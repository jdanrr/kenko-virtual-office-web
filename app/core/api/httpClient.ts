import { ofetch } from "ofetch";
import type { FetchOptions } from "ofetch";

import { ApiError } from "./apiError";

/**
 * Cliente HTTP por microservicio sobre `ofetch`.
 *
 * - Agrega `Authorization: Bearer <token>` desde el almacén de sesión.
 * - `credentials: 'include'` SOLO cuando `useCookies` (servicio de
 *   Authentication directo); el resto usa el comportamiento estándar.
 * - Desenvuelve el sobre `{ data }` en éxito y normaliza todo error a
 *   `ApiError` (incluido el fallo de red, con código propio).
 * - Ante un `401` en una petición autenticada hace UN solo
 *   `refresh` y reintenta la petición original UNA vez. Mientras un refresh
 *   está en curso, las demás peticiones con `401` esperan esa misma promesa
 *   (un único refresh a la vez: reutilizar un token rotado revocaría
 *   la sesión completa). `/auth/login` y `/auth/refresh` nunca lo disparan.
 * - Si el refresh falla: avisa por `handleRefreshFailure` (limpiar sesión
 *   y redirigir) y lanza el `401` original. Si el reintento vuelve a dar
 *   `401`, el error llega al llamador SIN cerrar la sesión (p. ej.
 *   contraseña actual incorrecta en `password/change`).
 *
 * El cliente no importa la feature de sesión (las features usan `core/`,
 * no al revés): la sesión se conecta con `setAuthHooks` desde el plugin.
 */

export interface AccessTokenPair {
  accessToken: string;
  expiresIn: number;
}

export interface AuthHooks {
  /** Renueva el par y deja la sesión actualizada; lanza si no se pudo. */
  refreshAccessToken: () => Promise<AccessTokenPair>;
  /** El refresh falló: limpiar sesión y redirigir al login. */
  handleRefreshFailure: () => void;
}

let authHooks: AuthHooks | null = null;

/** Conecta la sesión (feature) con el cliente (core). Solo llamar una vez. */
export function setAuthHooks(hooks: AuthHooks | null): void {
  authHooks = hooks;
}

export interface ServiceClientOptions {
  baseURL: string;
  /** `true` solo para el microservicio de Authentication directo. */
  useCookies?: boolean;
  getAccessToken?: () => string | null;
  /** Rutas que nunca disparan refresh (defecto: login y refresh de auth). */
  noRefreshPaths?: string[];
  /** Inyección para pruebas (defecto: `ofetch`). */
  fetchImpl?: <T>(path: string, options?: FetchOptions) => Promise<T>;
}

interface UpstreamSnapshot {
  status: number;
  data: unknown;
  retryAfter: string | null;
  correlationId: string | null;
}

function readHeader(headers: unknown, name: string): string | null {
  if (!headers || typeof headers !== "object") return null;
  const get = (headers as { get?: unknown }).get;
  if (typeof get !== "function") return null;
  try {
    const value = (get as (n: string) => unknown).call(headers, name);
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

/** Lee defensivamente un error de `ofetch` (real o falso en tests). */
function snapshot(error: unknown): UpstreamSnapshot | null {
  const err = error as {
    status?: unknown;
    statusCode?: unknown;
    data?: unknown;
    response?: { status?: unknown; _data?: unknown; data?: unknown; headers?: unknown };
  };
  const response = err?.response;
  const status =
    typeof err?.status === "number"
      ? err.status
      : typeof err?.statusCode === "number"
        ? err.statusCode
        : typeof response?.status === "number"
          ? response.status
          : null;
  if (status === null) return null;
  const headers = response?.headers;
  return {
    status,
    data: err?.data ?? response?._data ?? response?.data,
    retryAfter: readHeader(headers, "retry-after"),
    correlationId: readHeader(headers, "x-correlation-id"),
  };
}

function parseRetryAfter(value: string | null): number {
  const seconds = value === null ? Number.NaN : Number.parseInt(value, 10);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : 30;
}

interface ErrorEnvelope {
  code?: unknown;
  message?: unknown;
  correlationId?: unknown;
  details?: unknown;
}

function isEnvelope(value: unknown): value is { error: ErrorEnvelope } {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return false;
  }
  return typeof (value as { error: unknown }).error === "object";
}

/** Convierte cualquier fallo (HTTP o red) en `ApiError`. Sin PII ni tokens. */
export function toApiError(error: unknown): ApiError {
  const snap = snapshot(error);
  if (!snap) {
    return new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: "No pudimos conectarnos. Revisa tu conexión e intenta de nuevo.",
    });
  }
  const failure = isEnvelope(snap.data) ? snap.data.error : undefined;
  const code = typeof failure?.code === "string" ? failure.code : "INTERNAL_ERROR";
  const message =
    typeof failure?.message === "string" && failure.message.length > 0
      ? failure.message
      : "Tuvimos un problema. Intenta de nuevo más tarde.";
  const correlationId =
    typeof failure?.correlationId === "string"
      ? failure.correlationId
      : (snap.correlationId ?? undefined);
  const details = Array.isArray(failure?.details)
    ? (failure.details as { field?: string; message: string }[]).filter(
        (d) => typeof d?.message === "string",
      )
    : undefined;
  return new ApiError({
    status: snap.status,
    code,
    message,
    correlationId,
    details,
    retryAfterSeconds: snap.status === 429 ? parseRetryAfter(snap.retryAfter) : undefined,
  });
}

function unwrapData<T>(payload: unknown, path: string): T {
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return (payload as { data: T }).data;
  }
  throw new ApiError({
    status: 0,
    code: "INTERNAL_ERROR",
    message: `Respuesta inesperada de ${path}. Intenta de nuevo más tarde.`,
  });
}

export interface ServiceClient {
  request<T>(path: string, options?: FetchOptions & { skipRefresh?: boolean }): Promise<T>;
}

const DEFAULT_NO_REFRESH_PATHS = ["/auth/login", "/auth/refresh"];

export function createServiceClient(options: ServiceClientOptions): ServiceClient {
  const {
    baseURL,
    useCookies = false,
    getAccessToken,
    noRefreshPaths = DEFAULT_NO_REFRESH_PATHS,
    fetchImpl = ofetch.create({ baseURL, retry: false }),
  } = options;

  let refreshPromise: Promise<AccessTokenPair> | null = null;

  async function raw<T>(path: string, opts: FetchOptions = {}): Promise<T> {
    const token = getAccessToken?.() ?? null;
    const headers = new Headers(opts.headers as HeadersInit | undefined);
    if (token && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${token}`);
    }
    const result = await fetchImpl<unknown>(path, {
      ...opts,
      headers,
      ...(useCookies ? { credentials: "include" as RequestCredentials } : {}),
    });
    return unwrapData<T>(result, path);
  }

  function needsRefresh(path: string, error: ApiError): boolean {
    if (error.status !== 401) return false;
    if (noRefreshPaths.some((p) => path.startsWith(p))) return false;
    return true;
  }

  async function refreshOnce(): Promise<AccessTokenPair> {
    if (!refreshPromise) {
      const hooks = authHooks;
      refreshPromise = (async () => {
        if (!hooks) {
          throw new ApiError({
            status: 401,
            code: "UNAUTHORIZED",
            message: "Tu sesión terminó. Vuelve a entrar.",
          });
        }
        return hooks.refreshAccessToken();
      })().finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  }

  async function request<T>(
    path: string,
    opts: FetchOptions & { skipRefresh?: boolean } = {},
  ): Promise<T> {
    const { skipRefresh = false, ...fetchOpts } = opts;
    try {
      return await raw<T>(path, fetchOpts);
    } catch (error) {
      const apiError = error instanceof ApiError ? error : toApiError(error);
      if (skipRefresh || !needsRefresh(path, apiError)) throw apiError;
      // Un solo refresh en vuelo para todas las peticiones con 401.
      try {
        await refreshOnce();
      } catch {
        authHooks?.handleRefreshFailure();
        throw apiError;
      }
      // Reintento único con el token nuevo; si vuelve a dar 401, el error
      // llega al llamador y la sesión se mantiene.
      try {
        return await raw<T>(path, fetchOpts);
      } catch (retryError) {
        throw retryError instanceof ApiError ? retryError : toApiError(retryError);
      }
    }
  }

  return { request };
}
