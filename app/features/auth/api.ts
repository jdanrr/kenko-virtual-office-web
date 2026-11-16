import { loginSchema, toLoginRequest, type LoginFormValues } from "./schemas";
import { isApiFailure, type ApiFieldDetail, type AuthUser } from "./types";

/**
 * Cliente del BFF de Authentication (`/api/auth/*`, nunca directo al microservicio).
 * Fuente de verdad: `docs/auth-service.md` §1–§3.
 * Traduce el sobre `{ data }/{ error }` a errores UI por `code` (nunca `message`).
 * Client-safe: sin APIs de navegador ni de Node (no importar `server/utils/*` aquí).
 */

export type FieldErrors = Record<string, string>;

export type AuthFailureKind =
  | "validation"
  | "invalid-credentials"
  | "session-expired"
  | "rate-limited"
  | "network"
  | "unexpected";

export interface AuthFailure {
  kind: AuthFailureKind;
  message: string;
  fields?: FieldErrors;
  retryAfterSeconds?: number;
  correlationId?: string;
}

export class AuthError extends Error {
  readonly failure: AuthFailure;

  constructor(failure: AuthFailure) {
    super(failure.message);
    this.name = "AuthError";
    this.failure = failure;
  }
}

export interface LoginResult {
  accessToken: string;
  expiresIn: number;
}

type FetchFn = <T>(url: string, options?: Record<string, unknown>) => Promise<T>;

function clientFetch(): FetchFn {
  return (globalThis as unknown as { $fetch: FetchFn }).$fetch;
}

function fieldErrorsFromDetails(
  details: readonly ApiFieldDetail[] | undefined,
): FieldErrors {
  const fields: FieldErrors = {};
  for (const detail of details ?? []) {
    if (detail.field && !(detail.field in fields)) fields[detail.field] = detail.message;
  }
  return fields;
}

function fieldErrorsFromIssues(
  issues: ReadonlyArray<{ path: ReadonlyArray<string | number>; message: string }>,
): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of issues) {
    const [first] = issue.path;
    if (typeof first === "string" && !(first in fields)) fields[first] = issue.message;
  }
  return fields;
}

/** `Retry-After` en segundos; respaldo 30 s si el header falta o es inválido. */
function parseRetryAfter(value: string | null): number {
  const seconds = value === null ? Number.NaN : Number.parseInt(value, 10);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : 30;
}

interface UpstreamSnapshot {
  status?: number;
  data?: unknown;
  retryAfter: string | null;
}

/** Lee defensivamente un error de `$fetch` (real o falso en tests). */
function snapshot(error: unknown): UpstreamSnapshot {
  const response = (error as { response?: unknown })?.response as
    | {
        status?: unknown;
        _data?: unknown;
        headers?: { get?: (name: string) => string | null };
      }
    | undefined;
  if (!response || typeof response !== "object") return { retryAfter: null };
  return {
    status: typeof response.status === "number" ? response.status : undefined,
    data: (response as { _data?: unknown })._data,
    retryAfter: response.headers?.get?.("retry-after") ?? null,
  };
}

function toAuthError(error: unknown, context: "login" | "session"): AuthError {
  const { status, data, retryAfter } = snapshot(error);
  const failure = isApiFailure(data) ? data.error : undefined;

  if (status === undefined) {
    return new AuthError({
      kind: "network",
      message: "No pudimos conectarnos. Revisa tu conexión e intenta de nuevo.",
    });
  }
  switch (status) {
    case 400:
      if (failure?.code === "VALIDATION_ERROR") {
        return new AuthError({
          kind: "validation",
          message: "Revisa los datos ingresados.",
          fields: fieldErrorsFromDetails(failure.details),
          correlationId: failure.correlationId,
        });
      }
      break;
    case 401:
      return context === "login"
        ? new AuthError({
            kind: "invalid-credentials",
            message: "El documento o la contraseña no son correctos.",
            correlationId: failure?.correlationId,
          })
        : new AuthError({
            kind: "session-expired",
            message: "Tu sesión terminó. Vuelve a entrar.",
            correlationId: failure?.correlationId,
          });
    case 429: {
      const retryAfterSeconds = parseRetryAfter(retryAfter);
      return new AuthError({
        kind: "rate-limited",
        message: `Hiciste muchos intentos. Espera ${retryAfterSeconds} segundos e intenta de nuevo.`,
        retryAfterSeconds,
        correlationId: failure?.correlationId,
      });
    }
  }
  return new AuthError({
    kind: "unexpected",
    message: "Tuvimos un problema. Intenta de nuevo más tarde.",
    correlationId: failure?.correlationId,
  });
}

function isLoginResult(payload: unknown): payload is { data: LoginResult } {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    return false;
  }
  const data = (payload as { data: unknown }).data as Record<string, unknown>;
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.accessToken === "string" &&
    typeof data.expiresIn === "number"
  );
}

function isAuthUser(payload: unknown): payload is { data: AuthUser } {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    return false;
  }
  const data = (payload as { data: unknown }).data as Record<string, unknown>;
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.userId === "string" &&
    typeof data.firstName === "string" &&
    typeof data.email === "string"
  );
}

/**
 * `POST /api/auth/login`. Valida en cliente (respuesta inmediata) y delega
 * al BFF. El `refreshToken` nunca llega aquí: vive en cookie httpOnly.
 */
export async function login(values: LoginFormValues): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    throw new AuthError({
      kind: "validation",
      message: "Revisa los datos ingresados.",
      fields: fieldErrorsFromIssues(parsed.error.issues),
    });
  }
  try {
    const result = await clientFetch()<unknown>("/api/auth/login", {
      method: "POST",
      body: toLoginRequest(parsed.data),
    });
    if (!isLoginResult(result)) {
      throw new AuthError({
        kind: "unexpected",
        message: "Tuvimos un problema. Intenta de nuevo más tarde.",
      });
    }
    return result.data;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw toAuthError(error, "login");
  }
}

/**
 * `GET /api/auth/me` (§3.7). Única fuente del saludo "Hola, {firstName}":
 * nunca decodificar el JWT en la UI.
 */
export async function fetchMe(accessToken: string): Promise<AuthUser> {
  try {
    const result = await clientFetch()<unknown>("/api/auth/me", {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!isAuthUser(result)) {
      throw new AuthError({
        kind: "unexpected",
        message: "Tuvimos un problema. Intenta de nuevo más tarde.",
      });
    }
    return result.data;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw toAuthError(error, "session");
  }
}

/**
 * `POST /api/auth/refresh` (§3.3). Renovación silenciosa: el refresh token
 * viaja solo en la cookie httpOnly; aquí no se toca.
 */
export async function refreshSession(): Promise<LoginResult> {
  try {
    const result = await clientFetch()<unknown>("/api/auth/refresh", {
      method: "POST",
    });
    if (!isLoginResult(result)) {
      throw new AuthError({
        kind: "unexpected",
        message: "Tuvimos un problema. Intenta de nuevo más tarde.",
      });
    }
    return result.data;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw toAuthError(error, "session");
  }
}
