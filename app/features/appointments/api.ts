// Acceso al microservicio Appointments (directo, sin BFF).
// Auth: `Authorization: Bearer <access-token-kenko-auth>` (mismo JWT de login).
// Sin cookies: los otros servicios validan el Bearer y no usan cookies.
// Las respuestas vienen crudas (`envelope: false`): sin sobre `{ data }`.
// Errores `{ error: { code, message, correlationId } }` con códigos en
// minúsculas (`unauthorized`, `forbidden`, `not_found`, ...).
import { createServiceClient } from "../../core/api/httpClient";
import type { ServiceClient } from "../../core/api/httpClient";
import type {
  AppointmentResponse,
  AvailableAppointmentsParams,
  MedicalCenter,
  PaginatedAppointments,
  Physician,
  RescheduleRequest,
} from "./types";

export function createAppointmentsClient(
  baseURL: string,
  getAccessToken: () => string | null,
): ServiceClient {
  return createServiceClient({ baseURL, getAccessToken });
}

/** `GET /appointments/me`: citas del usuario (futuras salvo `includePast`). */
export async function listMyAppointments(
  client: ServiceClient,
  includePast = false,
): Promise<AppointmentResponse[]> {
  const query = includePast ? "?include_past=true" : "";
  return client.request<AppointmentResponse[]>(`/appointments/me${query}`, {
    envelope: false,
  });
}

/** `GET /appointments/available`: citas libres con filtros opcionales. */
export async function listAvailableAppointments(
  client: ServiceClient,
  params: AvailableAppointmentsParams = {},
): Promise<PaginatedAppointments> {
  const search = new URLSearchParams();
  if (params.type) search.set("type", params.type);
  if (params.medicalCenterId) search.set("medical_center_id", params.medicalCenterId);
  if (params.physicianId) search.set("physician_id", params.physicianId);
  if (params.dateFrom) search.set("date_from", params.dateFrom);
  if (params.dateTo) search.set("date_to", params.dateTo);
  search.set("page", String(params.page ?? 1));
  search.set("page_size", String(params.pageSize ?? 20));
  const query = `?${search.toString()}`;
  return client.request<PaginatedAppointments>(`/appointments/available${query}`, {
    envelope: false,
  });
}

/** `POST /appointments/{id}/schedule`: agendar una cita libre (sin body). */
export async function scheduleAppointment(
  client: ServiceClient,
  appointmentId: string,
): Promise<AppointmentResponse> {
  return client.request<AppointmentResponse>(
    `/appointments/${appointmentId}/schedule`,
    { method: "POST", envelope: false },
  );
}

/** `POST /appointments/{id}/cancel`: cancelar una cita propia (sin body). */
export async function cancelAppointment(
  client: ServiceClient,
  appointmentId: string,
): Promise<AppointmentResponse> {
  return client.request<AppointmentResponse>(`/appointments/${appointmentId}/cancel`, {
    method: "POST",
    envelope: false,
  });
}

/** `POST /appointments/{id}/reschedule`: mover a otra cita libre del mismo tipo. */
export async function rescheduleAppointment(
  client: ServiceClient,
  appointmentId: string,
  body: RescheduleRequest,
): Promise<AppointmentResponse> {
  return client.request<AppointmentResponse>(
    `/appointments/${appointmentId}/reschedule`,
    { method: "POST", body, envelope: false },
  );
}

/** `GET /catalog/physicians`: catálogo de médicos. */
export async function listPhysicians(client: ServiceClient): Promise<Physician[]> {
  return client.request<Physician[]>("/catalog/physicians", { envelope: false });
}

/** `GET /catalog/medical-centers`: catálogo de sedes. */
export async function listMedicalCenters(
  client: ServiceClient,
): Promise<MedicalCenter[]> {
  return client.request<MedicalCenter[]>("/catalog/medical-centers", {
    envelope: false,
  });
}
