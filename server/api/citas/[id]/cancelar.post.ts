// POST /api/citas/:id/cancelar -> POST {base}/api/v1/appointments/:id/cancel
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Falta el id de la cita" });
  try {
    return await $fetch(`${citasBase()}/api/v1/appointments/${id}/cancel`, {
      method: "POST",
      headers: forwardAuthHeader(event),
    });
  }
  catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status ?? 503;
    const data = (err as { response?: { _data?: unknown } })?.response?._data
      ?? { error: { code: "conflict", message: "No se pudo cancelar la cita", correlationId: "" } };
    throw createError({ statusCode: status, data });
  }
});
