// POST /api/citas/:id/reprogramar { newAppointmentId } -> POST {base}/api/v1/appointments/:id/reschedule
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Falta el id de la cita actual" });
  const body = await readBody<{ newAppointmentId?: string }>(event);
  if (!body?.newAppointmentId) {
    throw createError({
      statusCode: 400,
      data: { error: { code: "validation_error", message: "newAppointmentId es obligatorio", correlationId: "" } },
    });
  }
  try {
    return await $fetch(`${citasBase()}/api/v1/appointments/${id}/reschedule`, {
      method: "POST",
      headers: { ...forwardAuthHeader(event), "Content-Type": "application/json" },
      body: { newAppointmentId: body.newAppointmentId },
    });
  }
  catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status ?? 503;
    const data = (err as { response?: { _data?: unknown } })?.response?._data
      ?? { error: { code: "conflict", message: "No se pudo reprogramar la cita", correlationId: "" } };
    throw createError({ statusCode: status, data });
  }
});
