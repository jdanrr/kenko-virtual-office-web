// Cliente frontend de citas: siempre llama a nuestro proxy /api/citas/* (mismo origen).
// El proxy reenvía al microservicio http://localhost:8002/api/v1 con el JWT.
// El JWT nunca se inventa aquí: sale de localStorage 'kenko_jwt' (lo pone el login de auth
// o el campo manual de la vista cuando el back responde 401).

import type {
  Appointment,
  AppointmentFilters,
  AvailableAppointmentsResponse,
  BackendApiError,
  CatalogMedicalCenter,
  CatalogPhysician,
} from "./types";

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("kenko_jwt")?.trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getStoredToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("kenko_jwt") ?? "";
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  if (!token.trim()) window.localStorage.removeItem("kenko_jwt");
  else window.localStorage.setItem("kenko_jwt", token.trim());
}

/** Mensaje legible desde un error del back o de red. */
export function toUserMessage(err: unknown): string {
  const data = (err as { data?: BackendApiError })?.data;
  if (data?.error?.message) return data.error.message;
  const status = (err as { statusCode?: number; status?: number })?.statusCode
    ?? (err as { status?: number })?.status;
  if (status === 401) return "Tu sesión expiró o falta el token. Pega tu JWT para continuar.";
  if (status === 403) return "Tu cuenta aún no tiene perfil creado (ProfileCreated). Complétalo antes de agendar.";
  if (status === 404) return "La cita ya no existe o no es tuya.";
  if (status === 409) return "Esa cita acaba de ser tomada por otro afiliado. Elige otra.";
  if (status === 422) return "El back rechazó la operación por regla de negocio (24h de aviso, 90 días máx. o distinto tipo).";
  return "No se pudo conectar con el servicio de citas. Revisa que el back esté prendido en :8002.";
}

export async function fetchMyAppointments(includePast = false): Promise<Appointment[]> {
  return await $fetch<Appointment[]>("/api/citas/me", {
    headers: authHeaders(),
    query: includePast ? { include_past: "true" } : {},
  });
}

export interface AvailableQuery {
  page?: number;
  pageSize?: number;
  type?: string;
  medicalCenterId?: string;
  physicianId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function fetchAvailable(
  q: AvailableQuery,
): Promise<AvailableAppointmentsResponse> {
  return await $fetch<AvailableAppointmentsResponse>("/api/citas/disponibles", {
    headers: authHeaders(),
    query: {
      page: q.page ?? 1,
      page_size: q.pageSize ?? 20,
      ...(q.type ? { type: q.type } : {}),
      ...(q.medicalCenterId ? { medical_center_id: q.medicalCenterId } : {}),
      ...(q.physicianId ? { physician_id: q.physicianId } : {}),
      ...(q.dateFrom ? { date_from: q.dateFrom } : {}),
      ...(q.dateTo ? { date_to: q.dateTo } : {}),
    },
  });
}

export async function fetchMedicalCenters(): Promise<CatalogMedicalCenter[]> {
  return await $fetch<CatalogMedicalCenter[]>("/api/citas/centros", {
    headers: authHeaders(),
  });
}

export async function fetchPhysicians(): Promise<CatalogPhysician[]> {
  return await $fetch<CatalogPhysician[]>("/api/citas/medicos", {
    headers: authHeaders(),
  });
}

export async function scheduleAppointment(appointmentId: string): Promise<Appointment> {
  return await $fetch<Appointment>(`/api/citas/${appointmentId}/agendar`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export async function rescheduleAppointment(
  oldId: string,
  newAppointmentId: string,
): Promise<Appointment> {
  return await $fetch<Appointment>(`/api/citas/${oldId}/reprogramar`, {
    method: "POST",
    headers: authHeaders(),
    body: { newAppointmentId },
  });
}

export async function cancelAppointment(appointmentId: string): Promise<Appointment> {
  return await $fetch<Appointment>(`/api/citas/${appointmentId}/cancelar`, {
    method: "POST",
    headers: authHeaders(),
  });
}

/** Convierte los filtros de la vista al query que espera el back. */
export function filtersToQuery(f: AppointmentFilters): AvailableQuery {
  return {
    page: f.page,
    pageSize: f.pageSize,
    type: f.type || undefined,
    medicalCenterId: f.medicalCenterId || undefined,
    physicianId: f.physicianId || undefined,
    dateFrom: f.dateFrom || undefined,
    dateTo: f.dateTo || undefined,
  };
}
