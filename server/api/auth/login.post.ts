/**
 * BFF `POST /api/auth/login` → microservicio `POST /auth/login` (§3.2).
 *
 * - Revalida con `loginSchema` (nunca confía en el cliente) y normaliza el
 *   documento antes de enviarlo al microservicio.
 * - Reenvía intacta la cookie httpOnly `kenko_refresh` y el header
 *   `retry-after` (429 con cuenta regresiva en la UI).
 * - Defensa en profundidad: el `refreshToken` del cuerpo **no** se devuelve
 *   al navegador (vive solo en la cookie httpOnly); solo se expone
 *   `{ accessToken, expiresIn }` para memoria del cliente.
 * - Nunca registra PII (documento, contraseña, tokens).
 */
import type { ApiSuccess, AuthTokenPair } from "../../../app/features/auth/types";
import { isApiFailure } from "../../../app/features/auth/types";
import { loginSchema, toLoginRequest } from "../../../app/features/auth/schemas";
import {
  AUTH_REFRESH_COOKIE,
  internalErrorEnvelope,
  isDataEnvelope,
  newCorrelationId,
  pickCookies,
  toFieldDetails,
  validationErrorEnvelope,
  upstreamAuthBase,
} from "../../utils/auth";

function isLoginSuccess(payload: unknown): payload is ApiSuccess<AuthTokenPair> {
  if (!isDataEnvelope(payload)) return false;
  const data = payload.data as Record<string, unknown>;
  return typeof data.accessToken === "string" && typeof data.expiresIn === "number";
}

export default defineEventHandler(async (event) => {
  const correlationId =
    getRequestHeader(event, "x-correlation-id") ?? newCorrelationId();

  const parsed = loginSchema.safeParse(await readBody(event).catch(() => undefined));
  if (!parsed.success) {
    const { status, body } = validationErrorEnvelope(
      toFieldDetails(parsed.error.issues),
      correlationId,
    );
    setResponseStatus(event, status);
    setResponseHeader(event, "x-correlation-id", correlationId);
    return body;
  }

  const payload = toLoginRequest(parsed.data);
  const upstreamBase = upstreamAuthBase();
  if (!upstreamBase) {
    const { status, body } = internalErrorEnvelope(correlationId);
    setResponseStatus(event, status);
    setResponseHeader(event, "x-correlation-id", correlationId);
    return body;
  }

  let upstream: { status: number; headers: Headers; data: unknown };
  try {
    const response = await $fetch.raw(`${upstreamBase}/auth/login`, {
      method: "POST",
      body: {
        documentType: payload.documentType,
        documentNumber: payload.documentNumber,
        password: payload.password,
      },
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      ignoreResponseError: true,
    });
    upstream = { status: response.status, headers: response.headers, data: response._data };
  } catch {
    const { status, body } = internalErrorEnvelope(correlationId);
    setResponseStatus(event, status);
    setResponseHeader(event, "x-correlation-id", correlationId);
    return body;
  }

  for (const cookie of pickCookies(upstream.headers, AUTH_REFRESH_COOKIE)) {
    appendResponseHeader(event, "set-cookie", cookie);
  }
  const retryAfter = upstream.headers.get("retry-after");
  if (retryAfter) setResponseHeader(event, "retry-after", retryAfter);
  const upstreamCorrelation =
    upstream.headers.get("x-correlation-id") ?? correlationId;
  setResponseHeader(event, "x-correlation-id", upstreamCorrelation);

  if (upstream.status === 200 && isLoginSuccess(upstream.data)) {
    setResponseStatus(event, 200);
    const { accessToken, expiresIn } = upstream.data.data;
    return { data: { accessToken, expiresIn } };
  }
  if (isDataEnvelope(upstream.data) || isApiFailure(upstream.data)) {
    setResponseStatus(event, upstream.status);
    return upstream.data;
  }
  const { status, body } = internalErrorEnvelope(upstreamCorrelation);
  setResponseStatus(event, status);
  setResponseHeader(event, "x-correlation-id", upstreamCorrelation);
  return body;
});
