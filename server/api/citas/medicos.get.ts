// GET /api/citas/medicos -> GET {base}/api/v1/catalog/physicians
export default defineEventHandler(async (event) => {
  try {
    return await $fetch(`${citasBase()}/api/v1/catalog/physicians`, {
      headers: forwardAuthHeader(event),
    });
  }
  catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status ?? 503;
    const data = (err as { response?: { _data?: unknown } })?.response?._data
      ?? { error: { code: "validation_error", message: "No se pudieron cargar los médicos", correlationId: "" } };
    throw createError({ statusCode: status, data });
  }
});
