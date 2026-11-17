/**
 * BFF `POST /api/auth/logout` → microservicio `POST /auth/logout` (§3.4).
 * Revoca TODAS las sesiones del usuario en todos los dispositivos.
 * Idempotente: siempre `200 { data: {} }`; ante un fallo de red igualmente
 * se responde éxito para que la UI limpie el estado local.
 * Reenvía solo la cookie `kenko_refresh` y propaga su limpieza.
 */
import {
  AUTH_REFRESH_COOKIE,
  forwardCookie,
  newCorrelationId,
  pickCookies,
} from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const correlationId =
    getRequestHeader(event, "x-correlation-id") ?? newCorrelationId();
  const cookie = forwardCookie(getRequestHeader(event, "cookie"), AUTH_REFRESH_COOKIE);

  const upstreamBase =
    process.env.NUXT_PUBLIC_API_AUTH_BASE ?? "http://localhost:5500";

  if (cookie) {
    try {
      const response = await $fetch.raw(`${upstreamBase}/auth/logout`, {
        method: "POST",
        headers: {
          // Sin `content-type`: no hay body (mismo motivo que en refresh).
          "x-correlation-id": correlationId,
          cookie,
        },
        ignoreResponseError: true,
      });
      for (const cleared of pickCookies(response.headers, AUTH_REFRESH_COOKIE)) {
        appendResponseHeader(event, "set-cookie", cleared);
      }
    } catch {
      // Idempotente: el estado local se limpia igual (§3.4).
    }
  }

  setResponseStatus(event, 200);
  setResponseHeader(event, "x-correlation-id", correlationId);
  return { data: {} };
});
