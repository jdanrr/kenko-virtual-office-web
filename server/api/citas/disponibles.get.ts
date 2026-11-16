// GET /api/citas/disponibles -> GET {base}/api/v1/appointments/available
export default defineEventHandler(async (event) => {
  const q = getQuery(event);
  try {
    return await $fetch(`${citasBase()}/api/v1/appointments/available`, {
      headers: forwardAuthHeader(event),
      query: q,
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
