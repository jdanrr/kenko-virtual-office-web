/**
 * BFF `POST /api/auth/refresh` → microservicio `POST /auth/refresh` (§3.3).
 * Renovación silenciosa: el `refreshToken` viaja SOLO en la cookie httpOnly
 * `kenko_refresh` (nunca en body/URL desde el navegador).
 * - Reenvía solo esa cookie al microservicio y propaga la cookie rotada.
 * - Devuelve únicamente `{ accessToken, expiresIn }`.
 * - Sin cookie responde 401 genérico para que la UI vuelva al login.
 */
import type { ApiSuccess, AuthTokenPair } from "../../../app/features/auth/types";
import {
  AUTH_REFRESH_COOKIE,
  forwardCookie,
  forwardedForHeaders,
  internalErrorEnvelope,
  isDataEnvelope,
  newCorrelationId,
  pickCookies,
  unauthorizedEnvelope,
  upstreamAuthBase,
} from "../../utils/auth";

function isRefreshSuccess(payload: unknown): payload is ApiSuccess<AuthTokenPair> {
  if (!isDataEnvelope(payload)) return false;
  const data = payload.data as Record<string, unknown>;
  return typeof data.accessToken === "string" && typeof data.expiresIn === "number";
}

export default defineEventHandler(async (event) => {
  const correlationId =
    getRequestHeader(event, "x-correlation-id") ?? newCorrelationId();
  const cookie = forwardCookie(getRequestHeader(event, "cookie"), AUTH_REFRESH_COOKIE);

  if (!cookie) {
    const { status, body } = unauthorizedEnvelope(correlationId);
    setResponseStatus(event, status);
    setResponseHeader(event, "x-correlation-id", correlationId);
    return body;
  }

  const upstreamBase = upstreamAuthBase();
  if (!upstreamBase) {
    const { status, body } = internalErrorEnvelope(correlationId);
    setResponseStatus(event, status);
    setResponseHeader(event, "x-correlation-id", correlationId);
    return body;
  }

  try {
    const response = await $fetch.raw(`${upstreamBase}/auth/refresh`, {
      method: "POST",
      headers: {
        // Sin `content-type`: no hay body. Enviar `application/json` con
        // cuerpo vacío hacía que el backend intentara parsear JSON y
        // respondiera 500. La cookie viaja en el header `cookie`.
        // Una sola fuente (solo cookie, sin body): si mandan ambos gana el
        // body y un valor viejo mataría la familia aunque la cookie esté bien.
        "x-correlation-id": correlationId,
        ...forwardedForHeaders(getRequestHeader(event, "x-forwarded-for")),
        cookie,
      },
      ignoreResponseError: true,
    });

    for (const rotated of pickCookies(response.headers, AUTH_REFRESH_COOKIE)) {
      appendResponseHeader(event, "set-cookie", rotated);
    }
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) setResponseHeader(event, "retry-after", retryAfter);
    const upstreamCorrelation =
      response.headers.get("x-correlation-id") ?? correlationId;
    setResponseHeader(event, "x-correlation-id", upstreamCorrelation);

    if (response.status === 200 && isRefreshSuccess(response._data)) {
      const { accessToken, expiresIn } = response._data.data;
      setResponseStatus(event, 200);
      return { data: { accessToken, expiresIn } };
    }
    if (isDataEnvelope(response._data)) {
      setResponseStatus(event, response.status);
      return response._data;
    }
    const { status, body } = internalErrorEnvelope(upstreamCorrelation);
    setResponseStatus(event, status);
    return body;
  } catch {
    const { status, body } = internalErrorEnvelope(correlationId);
    setResponseStatus(event, status);
    setResponseHeader(event, "x-correlation-id", correlationId);
    return body;
  }
});
