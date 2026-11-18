import { loginSchema, toLoginRequest, type LoginFormValues } from "./schemas";
import {
  registerSchema,
  toRegisterRequest,
  type RegisterFormValues,
} from "./registerSchemas";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  toForgotRequest,
  toResetRequest,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
} from "./passwordRecoverySchemas";
import {
  isApiFailure,
  type ApiFieldDetail,
  type AuthUser,
  type RegisterSuccess,
} from "./types";

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
  | "register-conflict"
  | "reset-invalid"
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

/**
 * Traduce cualquier error lanzado a `AuthFailure` sin lanzar.
 * Misma semántica en formularios y stores: si no es `AuthError`,
 * fue algo inesperado (red rota, cuerpo malformado).
 */
export function failureFromUnknown(error: unknown): AuthFailure {
  if (error instanceof AuthError) return error.failure;
  return {
    kind: "unexpected",
    message: "Tuvimos un problema. Intenta de nuevo más tarde.",
  };
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

/** Mapea issues de zod a errores por campo (primer mensaje por campo). */
export function fieldsFromIssues(
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

function toAuthError(
  error: unknown,
  context: "login" | "session" | "register" | "recovery",
): AuthError {
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
      if (context === "recovery" && failure?.code === "PASSWORD_RESET_INVALID") {
        return new AuthError({
          kind: "reset-invalid",
          message:
            "Este enlace ya no sirve (se usó o venció). Pide uno nuevo.",
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
    case 409:
      if (context === "register" && failure?.code === "REGISTER_CONFLICT") {
        return new AuthError({
          kind: "register-conflict",
          message:
            "No pudimos crear tu cuenta con estos datos. Revisa tu documento y correo o intenta recuperar tu contraseña.",
          correlationId: failure.correlationId,
        });
      }
      break;
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

function isRegisterSuccess(payload: unknown): payload is { data: RegisterSuccess } {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    return false;
  }
  const data = (payload as { data: unknown }).data as Record<string, unknown>;
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.userId === "string" &&
    typeof data.maskedEmail === "string"
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
      fields: fieldsFromIssues(parsed.error.issues),
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
 * `POST /api/auth/register` (§3.1). Valida en cliente (respuesta inmediata)
 * y delega al BFF. Devuelve `{ userId, maskedEmail }`: el email enmascarado
 * se muestra tal cual, nunca se reconstruye el completo.
 */
export async function register(values: RegisterFormValues): Promise<RegisterSuccess> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    throw new AuthError({
      kind: "validation",
      message: "Revisa los datos ingresados.",
      fields: fieldsFromIssues(parsed.error.issues),
    });
  }
  const payload = toRegisterRequest(parsed.data);
  if (!payload) {
    throw new AuthError({
      kind: "unexpected",
      message: "Tuvimos un problema. Intenta de nuevo más tarde.",
    });
  }
  try {
    const result = await clientFetch()<unknown>("/api/auth/register", {
      method: "POST",
      body: payload,
    });
    if (!isRegisterSuccess(result)) {
      throw new AuthError({
        kind: "unexpected",
        message: "Tuvimos un problema. Intenta de nuevo más tarde.",
      });
    }
    return result.data;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw toAuthError(error, "register");
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
 *
 * Vuelo único compartido: si el bootstrap, el `httpClient` central y la
 * renovación del store coinciden, esperan la MISMA petición en vez de
 * lanzar 3. Reusar un token rotado revocaría la familia completa (§3.3),
 * así que nunca debe haber dos refresh en paralelo.
 */
let refreshInflight: Promise<LoginResult> | null = null;

export function refreshSession(): Promise<LoginResult> {
  if (!refreshInflight) {
    refreshInflight = doRefresh().finally(() => {
      refreshInflight = null;
    });
  }
  return refreshInflight;
}

async function doRefresh(): Promise<LoginResult> {
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

/**
 * `POST /api/auth/logout` (§3.4). Revoca todas las sesiones en el servidor.
 * Idempotente: nunca lanza; ante un fallo de red la UI limpia igual.
 */
export async function logoutSession(): Promise<void> {
  try {
    await clientFetch()<unknown>("/api/auth/logout", {
      method: "POST",
    });
  } catch {
    // Intencionalmente silencioso: el estado local se limpia siempre.
  }
}

function isEmptyData(payload: unknown): payload is { data: Record<string, never> } {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    return false;
  }
  const data = (payload as { data: unknown }).data;
  return typeof data === "object" && data !== null && Object.keys(data).length === 0;
}

/**
 * `POST /api/auth/password/forgot` (§3.5). Siempre responde igual exista o
 * no la cuenta (anti-enumeración): la UI muestra un único mensaje.
 */
export async function requestPasswordReset(
  values: ForgotPasswordFormValues,
): Promise<void> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    throw new AuthError({
      kind: "validation",
      message: "Revisa los datos ingresados.",
      fields: fieldsFromIssues(parsed.error.issues),
    });
  }
  const payload = toForgotRequest(parsed.data);
  if (!payload) {
    throw new AuthError({
      kind: "unexpected",
      message: "Tuvimos un problema. Intenta de nuevo más tarde.",
    });
  }
  try {
    const result = await clientFetch()<unknown>("/api/auth/password/forgot", {
      method: "POST",
      body: payload,
    });
    if (!isEmptyData(result)) {
      throw new AuthError({
        kind: "unexpected",
        message: "Tuvimos un problema. Intenta de nuevo más tarde.",
      });
    }
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw toAuthError(error, "recovery");
  }
}

/**
 * `POST /api/auth/password/reset` (§3.6). El `token` viaja solo en el body
 * (nunca en la URL); aquí no se registra ni se transforma.
 */
export async function resetPassword(
  values: ResetPasswordFormValues,
): Promise<void> {
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) {
    throw new AuthError({
      kind: "validation",
      message: "Revisa los datos ingresados.",
      fields: fieldsFromIssues(parsed.error.issues),
    });
  }
  const payload = toResetRequest(parsed.data);
  if (!payload) {
    throw new AuthError({
      kind: "unexpected",
      message: "Tuvimos un problema. Intenta de nuevo más tarde.",
    });
  }
  try {
    const result = await clientFetch()<unknown>("/api/auth/password/reset", {
      method: "POST",
      body: payload,
    });
    if (!isEmptyData(result)) {
      throw new AuthError({
        kind: "unexpected",
        message: "Tuvimos un problema. Intenta de nuevo más tarde.",
      });
    }
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw toAuthError(error, "recovery");
  }
}
