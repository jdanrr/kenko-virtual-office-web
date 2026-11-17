/**
 * BFF `GET /api/auth/me` → microservicio `GET /auth/me` (§3.7).
 * Reenvía el `Authorization: Bearer` de la llamada y devuelve el sobre
 * `{ data: { userId, firstName, email } }` para el saludo.
 * Sin `Bearer` responde 401 genérico (la UI vuelve al login en silencio).
 */
import {
  internalErrorEnvelope,
  isDataEnvelope,
  newCorrelationId,
  unauthorizedEnvelope,
  upstreamAuthBase,
} from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const correlationId =
    getRequestHeader(event, "x-correlation-id") ?? newCorrelationId();
  const authorization = getRequestHeader(event, "authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    const { status, body } = unauthorizedEnvelope(correlationId);
    setResponseStatus(event, status);
    setResponseHeader(event, "x-correlation-id", correlationId);
    return body;
  }

  const upstreamBase = upstreamAuthBase();

  try {
    const response = await $fetch.raw(`${upstreamBase}/auth/me`, {
      headers: { authorization, "x-correlation-id": correlationId },
      ignoreResponseError: true,
    });
    const upstreamCorrelation =
      response.headers.get("x-correlation-id") ?? correlationId;
    setResponseHeader(event, "x-correlation-id", upstreamCorrelation);
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
