/**
 * BFF `POST /api/auth/email/change` → `POST /auth/email/change` (§B).
 *
 * - Exige `Authorization: Bearer` (sin él: 401 genérico, la UI va a login).
 * - Revalida con `changeEmailSchema` (nunca confía en el cliente);
 *   el correo viaja normalizado (`trim` + minúsculas) y jamás se
 *   registra en logs.
 * - `200 { data: { changed } }`: `false` = ya era ese correo (idempotente,
 *   sin evento); `true` = aplicado (Profile lo recibe después por SQS).
 * - `409 UPDATE_CONFLICT` se propaga tal cual ("correo no disponible").
 */
import { isApiFailure } from "../../../../app/features/auth/types";
import {
  changeEmailSchema,
  toChangeEmailRequest,
} from "../../../../app/features/auth/accountSchemas";
import {
  internalErrorEnvelope,
  isDataEnvelope,
  newCorrelationId,
  toFieldDetails,
  unauthorizedEnvelope,
  upstreamAuthBase,
  validationErrorEnvelope,
} from "../../../utils/auth";

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

  const parsed = changeEmailSchema.safeParse(
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

  const payload = toChangeEmailRequest(parsed.data);
  if (!payload) {
    const { status, body } = internalErrorEnvelope(correlationId);
    setResponseStatus(event, status);
    setResponseHeader(event, "x-correlation-id", correlationId);
    return body;
  }

  const upstreamBase = upstreamAuthBase();

  let upstream: { status: number; headers: Headers; data: unknown };
  try {
    const response = await $fetch.raw(`${upstreamBase}/auth/email/change`, {
      method: "POST",
      body: payload,
      headers: {
        authorization,
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

  if (upstream.status === 200 && isDataEnvelope(upstream.data)) {
    setResponseStatus(event, 200);
    return upstream.data;
  }
  if (isApiFailure(upstream.data)) {
    setResponseStatus(event, upstream.status);
    return upstream.data;
  }
  const { status, body } = internalErrorEnvelope(upstreamCorrelation);
  setResponseStatus(event, status);
  setResponseHeader(event, "x-correlation-id", upstreamCorrelation);
  return body;
});
