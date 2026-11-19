// Helpers SOLO para las vistas /citas y /citas/reprogramar.
// No toca la API pública de la feature (api.ts / types.ts / queries.ts son de otro equipo).
// Trabaja sobre `AppointmentResponse` (el tipo real del back) y añade lo que las
// vistas necesitan: franja horaria local, títulos en español y mensajes legibles.
import { ApiError } from "~/core/api/apiError";
import type {
  AppointmentResponse,
  AppointmentType,
  AvailableAppointmentsParams,
} from "./types";

export type DayPart = "todas" | "manana" | "tarde" | "noche";

export interface CitasViewFilters {
  type: "" | AppointmentType;
  medicalCenterId: string;
  physicianId: string;
  dateFrom: string;
  dateTo: string;
  dayPart: DayPart;
  page: number;
  pageSize: number;
}

export const APPOINTMENT_TYPE_LABEL: Record<AppointmentType, string> = {
  GENERAL: "Medicina General",
  ODONTOLOGIA: "Odontología",
  PSICOLOGIA: "Psicología",
};

/** Franja horaria: solo front, el back no la soporta. Acepta "08:00" y "08:00:00". */
export function matchesDayPart(startTime: string, part: DayPart): boolean {
  if (part === "todas") return true;
  const hour = Number(startTime.split(":")[0]);
  if (Number.isNaN(hour)) return true;
  if (part === "manana") return hour >= 6 && hour < 12;
  if (part === "tarde") return hour >= 12 && hour < 18;
  return hour >= 18;
}

export function appointmentTitle(a: Pick<AppointmentResponse, "type">): string {
  return APPOINTMENT_TYPE_LABEL[a.type] ?? a.type;
}

/** "2026-11-20 · 09:00 - 09:30" (recorta los segundos "09:00:00" del back). */
export function formatAppointmentDate(
  a: Pick<AppointmentResponse, "date" | "startTime" | "endTime">,
): string {
  const short = (t: string) => t.slice(0, 5);
  return `${a.date} · ${short(a.startTime)} - ${short(a.endTime)}`;
}

/** Horas que faltan para la cita (fecha + hora de Bogotá). Negativo = ya pasó. */
export function hoursUntilAppointment(
  a: Pick<AppointmentResponse, "date" | "startTime">,
  now: Date = new Date(),
): number {
  const time = a.startTime.length === 5 ? `${a.startTime}:00` : a.startTime;
  const start = new Date(`${a.date}T${time}`);
  if (Number.isNaN(start.getTime())) return Number.POSITIVE_INFINITY;
  return (start.getTime() - now.getTime()) / 3_600_000;
}

/** El back exige 24h de aviso para cancelar/reprogramar. */
export function isBlockedBy24hRule(
  a: Pick<AppointmentResponse, "date" | "startTime">,
  now: Date = new Date(),
): boolean {
  return hoursUntilAppointment(a, now) < 24;
}

export const BLOCKED_24H_MESSAGE =
  "No puedes cancelar/reprogramar citas con menos de 24 horas de anticipación, comunícate al WhatsApp de Kenko para más opciones.";

/** Vista -> query del back (sin dayPart, que es local). */
export function viewFiltersToParams(f: CitasViewFilters): AvailableAppointmentsParams {
  return {
    type: f.type || undefined,
    medicalCenterId: f.medicalCenterId || undefined,
    physicianId: f.physicianId || undefined,
    dateFrom: f.dateFrom || undefined,
    dateTo: f.dateTo || undefined,
    page: f.page,
    pageSize: f.pageSize,
  };
}

/** Mensaje en español desde ApiError (códigos del back en minúsculas) o fallo de red. */
export function toUserMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.message && err.message !== "Tuvimos un problema. Intenta de nuevo más tarde.") {
      // Mensajes de negocio del back (409 ocupada, 422 regla, 404 ajena) ya vienen claros.
      if (err.status === 409 || err.status === 422 || err.status === 404) return err.message;
    }
    if (err.status === 0 || err.code === "NETWORK_ERROR" || err.code === "CONFIG_ERROR") return err.message;
    if (err.status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión para continuar.";
    if (err.status === 403) return "Tu cuenta aún no tiene perfil creado. Complétalo antes de agendar.";
    if (err.status === 404) return "La cita ya no existe o no es tuya.";
    if (err.status === 409) return "Esa cita acaba de ser tomada por otro afiliado. Elige otra.";
    if (err.status === 422) return err.message || "El back rechazó la operación (24h de aviso, 90 días máx. o distinto tipo).";
    return err.message;
  }
  const data = (err as { data?: { error?: { message?: string } } })?.data;
  if (typeof data?.error?.message === "string" && data.error.message) return data.error.message;
  return "No se pudo conectar con el servicio de citas. Revisa que el back esté prendido en :8002.";
}
