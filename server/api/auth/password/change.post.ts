/**
 * BFF `POST /api/auth/password/change` → `POST /auth/password/change` (§A).
 *
 * - Exige `Authorization: Bearer` (sin él: 401 genérico, la UI va a login).
 * - Revalida con `changePasswordPayloadSchema` (formato de cable, sin la
 *   confirmación de la UI) y nunca confía en el cliente;
 *   al microservicio viajan solo `currentPassword` + `newPassword`
 *   (la confirmación es solo UI y jamás se registra en logs).
 * - `401 "Contraseña actual incorrecta."` se propaga tal cual para marcar
 *   el campo sin cerrar sesión. Éxito `200` no toca sesiones aquí (el
 *   cliente rota con `refresh` en silencio).
 */
import { isApiFailure } from "../../../../app/features/auth/types";
import type { ChangePasswordRequest } from "../../../../app/features/auth/types";
import { changePasswordPayloadSchema } from "../../../../app/features/auth/accountSchemas";
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

  const parsed = changePasswordPayloadSchema.safeParse(
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

  // El cable ya viene sin confirmación (la UI la valida y la descarta).
  const payload: ChangePasswordRequest = parsed.data;

  const upstreamBase = upstreamAuthBase();
  if (!upstreamBase) {
    const { status, body } = internalErrorEnvelope(correlationId);
    setResponseStatus(event, status);
    setResponseHeader(event, "x-correlation-id", correlationId);
    return body;
  }

  let upstream: { status: number; headers: Headers; data: unknown };
  try {
    const response = await $fetch.raw(`${upstreamBase}/auth/password/change`, {
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
