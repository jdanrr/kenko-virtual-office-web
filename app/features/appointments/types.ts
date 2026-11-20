// Tipos del microservicio Appointments (FastAPI).
// Fuente: info del equipo backend (base http://3.224.127.142:8002/api/v1, AWS dev).
// Respuestas en camelCase, sin sobre `{ data }` (listas y objetos crudos).
// Nombres en inglés; comentarios en español.

/** `AppointmentType` (app/models.py): únicos tipos de cita. */
export type AppointmentType = "GENERAL" | "ODONTOLOGIA" | "PSICOLOGIA";

export interface PhysicianRef {
  physicianId: string;
  name: string;
}

export interface MedicalCenterRef {
  medicalCenterId: string;
  name: string;
  location: string;
}

/** `AppointmentResponse` (app/schemas.py): cita libre o asignada. */
export interface AppointmentResponse {
  appointmentId: string;
  type: AppointmentType;
  /** Fecha `YYYY-MM-DD` (hora local de Bogotá). */
  date: string;
  /** Día en mayúsculas (p. ej. `"JUEVES"`). */
  weekday: string;
  /** Hora `HH:MM:SS` (p. ej. `"08:00:00"`). */
  startTime: string;
  endTime: string;
  physician: PhysicianRef;
  medicalCenter: MedicalCenterRef;
}

/** `PaginatedAppointments` (app/schemas.py): página de citas libres. */
export interface PaginatedAppointments {
  page: number;
  pageSize: number;
  total: number;
  items: AppointmentResponse[];
}

/** Filtros de `GET /appointments/available` (todos opcionales). */
export interface AvailableAppointmentsParams {
  type?: AppointmentType;
  medicalCenterId?: string;
  physicianId?: string;
  /** `YYYY-MM-DD`. */
  dateFrom?: string;
  /** `YYYY-MM-DD`. */
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

/** Body de `POST /appointments/{id}/reschedule`. */
export interface RescheduleRequest {
  newAppointmentId: string;
}

export interface Physician {
  physicianId: string;
  firstName: string;
  lastName: string;
  specialty: AppointmentType;
  primaryMedCenterId: string;
  secondaryMedCenterId: string | null;
}

export interface MedicalCenter {
  medicalCenterId: string;
  name: string;
  location: string;
  appointmentTypes: AppointmentType[];
}
