/**
 * BFF `POST /api/auth/password/forgot` → `POST /auth/password/forgot` (§3.5).
 *
 * - Revalida con `forgotPasswordSchema` (nunca confía en el cliente).
 * - El microservicio responde siempre `200` exista o no la cuenta
 *   (anti-enumeración); el BFF propaga ese comportamiento tal cual.
 * - Respeta el enfriamiento: propaga `retry-after` para la cuenta regresiva.
 * - Nunca registra PII (documento).
 */
import { isApiFailure } from "../../../../app/features/auth/types";
import {
  forgotPasswordSchema,
  toForgotRequest,
} from "../../../../app/features/auth/passwordRecoverySchemas";
import {
  internalErrorEnvelope,
  isDataEnvelope,
  newCorrelationId,
  toFieldDetails,
  validationErrorEnvelope,
} from "../../../utils/auth";

export default defineEventHandler(async (event) => {
  const correlationId =
    getRequestHeader(event, "x-correlation-id") ?? newCorrelationId();

  const parsed = forgotPasswordSchema.safeParse(
    await readBody(event).catch(() => undefined),
  );
  if (!parsed.success) {
    const { status, body } = validationErrorEnvelope(
      toFieldDetails(parsed.error.issues),
      correlationId,
    );
    setResponseStatus(event, status);
    setResponseHeader(event, "x-correlation-id", correlationId);
    return body;
  }

  const payload = toForgotRequest(parsed.data);
  if (!payload) {
    const { status, body } = internalErrorEnvelope(correlationId);
    setResponseStatus(event, status);
    setResponseHeader(event, "x-correlation-id", correlationId);
    return body;
  }

  const upstreamBase = process.env.NUXT_PUBLIC_API_AUTH_BASE ?? "http://localhost:5500";

  let upstream: { status: number; headers: Headers; data: unknown };
  try {
    const response = await $fetch.raw(`${upstreamBase}/auth/password/forgot`, {
      method: "POST",
      body: payload,
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

  const retryAfter = upstream.headers.get("retry-after");
  if (retryAfter) setResponseHeader(event, "retry-after", retryAfter);
  const upstreamCorrelation =
    upstream.headers.get("x-correlation-id") ?? correlationId;
  setResponseHeader(event, "x-correlation-id", upstreamCorrelation);

  if (upstream.status === 200) {
    setResponseStatus(event, 200);
    return { data: {} };
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
