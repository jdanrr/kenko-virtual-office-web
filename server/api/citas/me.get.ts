// GET /api/citas/me -> GET {base}/api/v1/appointments/me
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  try {
    return await $fetch(`${citasBase()}/api/v1/appointments/me`, {
      headers: forwardAuthHeader(event),
      query: query.include_past ? { include_past: "true" } : {},
    });
  }
  catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status ?? 503;
    const data = (err as { response?: { _data?: unknown } })?.response?._data
      ?? (err as { data?: unknown })?.data
      ?? { error: { code: "validation_error", message: "Servicio de citas no disponible", correlationId: "" } };
    throw createError({ statusCode: status, data });
  }
});
