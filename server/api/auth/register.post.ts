/**
 * BFF `POST /api/auth/register` → microservicio `POST /auth/register` (§3.1).
 *
 * - Revalida con `registerPayloadSchema` (formato de cable: 12 campos, sin
 *   consentimientos UI) y normaliza antes de enviarlo al microservicio.
 * - Propaga el sobre tal cual: `201 { data: { userId, maskedEmail } }`,
 *   `400 VALIDATION_ERROR` con `details` por campo, `409` genérico y
 *   `429` con `retry-after` (cuenta regresiva en la UI).
 * - Nunca registra PII (documento, email, teléfono, contraseñas).
 */
import type {
  ApiSuccess,
  RegisterSuccess,
} from "../../../app/features/auth/types";
import { isApiFailure } from "../../../app/features/auth/types";
import {
  registerPayloadSchema,
  toRegisterRequest,
} from "../../../app/features/auth/registerSchemas";
import {
  internalErrorEnvelope,
  isDataEnvelope,
  newCorrelationId,
  toFieldDetails,
  validationErrorEnvelope,
  upstreamAuthBase,
} from "../../utils/auth";

function isRegisterSuccess(payload: unknown): payload is ApiSuccess<RegisterSuccess> {
  if (!isDataEnvelope(payload)) return false;
  const data = payload.data as Record<string, unknown>;
  return typeof data.userId === "string" && typeof data.maskedEmail === "string";
}

export default defineEventHandler(async (event) => {
  const correlationId =
    getRequestHeader(event, "x-correlation-id") ?? newCorrelationId();

  const parsed = registerPayloadSchema.safeParse(
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

  const payload = toRegisterRequest(parsed.data);
  if (!payload) {
    const { status, body } = internalErrorEnvelope(correlationId);
    setResponseStatus(event, status);
    setResponseHeader(event, "x-correlation-id", correlationId);
    return body;
  }

  const upstreamBase = upstreamAuthBase();

  let upstream: { status: number; headers: Headers; data: unknown };
  try {
    const response = await $fetch.raw(`${upstreamBase}/auth/register`, {
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

  if (upstream.status === 201 && isRegisterSuccess(upstream.data)) {
    setResponseStatus(event, 201);
    return upstream.data;
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
