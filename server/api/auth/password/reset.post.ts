/**
 * BFF `POST /api/auth/password/reset` → `POST /auth/password/reset` (§3.6).
 *
 * - Revalida con `resetPasswordSchema` (nunca confía en el cliente).
 * - El `token` opaco viaja SOLO en el body (nunca en URL) y jamás se
 *   registra en logs: es un secreto de un solo uso.
 * - `400 PASSWORD_RESET_INVALID` se propaga tal cual para mostrar
 *   "pide uno nuevo". Éxito `200` revoca sesiones en el backend.
 */
import { isApiFailure } from "../../../../app/features/auth/types";
import {
  resetPasswordSchema,
  toResetRequest,
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

  const parsed = resetPasswordSchema.safeParse(
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

  const payload = toResetRequest(parsed.data);
  if (!payload) {
    const { status, body } = internalErrorEnvelope(correlationId);
    setResponseStatus(event, status);
    setResponseHeader(event, "x-correlation-id", correlationId);
    return body;
  }

  const upstreamBase = process.env.NUXT_PUBLIC_API_AUTH_BASE ?? "http://localhost:5500";

  let upstream: { status: number; headers: Headers; data: unknown };
  try {
    const response = await $fetch.raw(`${upstreamBase}/auth/password/reset`, {
      method: "POST",
      // JSON con { token, password, confirmPassword } ($fetch fija el
      // `content-type` solo). El token nunca va en la URL ni en logs.
      body: payload,
      headers: {
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
