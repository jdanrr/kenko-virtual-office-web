// Tipos del microservicio appointments (backend real).
// Nombres en inglés, comentarios en español. Todo camelCase como responde el back.

export type AppointmentType = "GENERAL" | "ODONTOLOGIA" | "PSICOLOGIA";

export interface AppointmentPhysician {
  physicianId: string;
  name: string;
}

export interface AppointmentMedicalCenter {
  medicalCenterId: string;
  name: string;
  location: string;
}

/** Cita tal como la devuelve el back (mis citas y disponibles comparten forma). */
export interface Appointment {
  appointmentId: string;
  type: AppointmentType;
  date: string; // YYYY-MM-DD
  weekday: string; // ej. "Thursday"
  startTime: string; // "09:00"
  endTime: string; // "09:30"
  physician: AppointmentPhysician;
  medicalCenter: AppointmentMedicalCenter;
}

export interface AvailableAppointmentsResponse {
  page: number;
  pageSize: number;
  total: number;
  items: Appointment[];
}

export interface CatalogMedicalCenter {
  medicalCenterId: string;
  name: string;
  location: string;
  appointmentTypes?: AppointmentType[];
}

export interface CatalogPhysician {
  physicianId: string;
  firstName: string;
  lastName: string;
  specialty: AppointmentType;
  primaryMedCenterId?: string | null;
  secondaryMedCenterId?: string | null;
}

/** Error estándar del back: { error: { code, message, correlationId } } */
export interface BackendApiError {
  error: {
    code:
      | "not_found"
      | "conflict"
      | "business_rule_violation"
      | "validation_error"
      | "unauthorized"
      | "forbidden";
    message: string;
    correlationId: string;
  };
}

/** Filtros de la vista. Hora NO existe en back: se filtra aquí en el front. */
export type DayPart = "todas" | "manana" | "tarde" | "noche";

export interface AppointmentFilters {
  type: "" | AppointmentType;
  medicalCenterId: string;
  physicianId: string;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
  dayPart: DayPart;
  page: number;
  pageSize: number;
}

export const APPOINTMENT_TYPE_LABEL: Record<AppointmentType, string> = {
  GENERAL: "Medicina General",
  ODONTOLOGIA: "Odontología",
  PSICOLOGIA: "Psicología",
};

/** Franja horaria — solo front, el back no la soporta. */
export function matchesDayPart(startTime: string, part: DayPart): boolean {
  if (part === "todas") return true;
  const hour = Number(startTime.split(":")[0]);
  if (Number.isNaN(hour)) return true;
  if (part === "manana") return hour >= 6 && hour < 12;
  if (part === "tarde") return hour >= 12 && hour < 18;
  return hour >= 18;
}

export function appointmentTitle(a: Pick<Appointment, "type">): string {
  return APPOINTMENT_TYPE_LABEL[a.type] ?? a.type;
}

export function formatAppointmentDate(a: Pick<Appointment, "date" | "startTime" | "endTime">): string {
  return `${a.date} · ${a.startTime} - ${a.endTime}`;
}
