// Mapeo backend Appointments → vista de home-page.
// El backend no devuelve estado ni modalidad: toda cita de `/me` está
// agendada (se muestra confirmada) y es presencial (tiene sede física).
// `documentMasked`/apellido los completará profile (TODO).
import { ApiError } from "../../core/api/apiError";
import type { AppointmentResponse, AppointmentType } from "../appointments/types";
import type {
  AuthorizationResponse,
  AuthorizationStatusRaw,
  CertificateGenerated,
  MedicalHistoryGenerated,
} from "../profile/types";
import { formatAppointmentDateTime, formatShortDate } from "../../utils/format";
import type {
  AffiliationCertificateView,
  AppointmentsSummaryView,
  AppointmentView,
  AuthorizationStatus,
  AuthorizationView,
  MedicalHistorySummaryView,
} from "./types";

/** Nombre visible por tipo de cita del backend. */
export const APPOINTMENT_TYPE_TITLES: Record<AppointmentType, string> = {
  GENERAL: "Medicina General",
  ODONTOLOGIA: "Odontología",
  PSICOLOGIA: "Psicología",
};

function toAppointmentView(item: AppointmentResponse): AppointmentView {
  const title = APPOINTMENT_TYPE_TITLES[item.type];
  return {
    id: item.appointmentId,
    title,
    specialty: title,
    modality: "presencial",
    status: "confirmada",
    dateISO: `${item.date}T${item.startTime}-05:00`,
    dateLabel: formatAppointmentDateTime(item.date, item.startTime, item.weekday),
    doctorName: item.physician.name,
    site: item.medicalCenter.name,
  };
}

/** Ordena por fecha/hora: la más próxima es `next`, el resto `others`. */
export function toAppointmentsSummary(
  items: AppointmentResponse[],
): AppointmentsSummaryView {
  const sorted = [...items].sort((a, b) =>
    `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`),
  );
  const [next = null, ...others] = sorted;
  return {
    next: next ? toAppointmentView(next) : null,
    others: others.map(toAppointmentView),
    pendingCount: others.length,
  };
}

/**
 * Mensaje en español para el estado de error de la tarjeta.
 * `403` = usuario aún no sincronizado en Appointments (se puebla por worker
 * desde `ProfileCreated`): mensaje específico en vez del genérico.
 */
export function toAppointmentsErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "Tus citas aún no están disponibles. Si acabas de crear tu cuenta, intenta de nuevo en unos minutos.";
    }
    return error.message;
  }
  return "Tuvimos un problema. Intenta de nuevo más tarde.";
}

const AUTHORIZATION_STATUS_MAP: Record<AuthorizationStatusRaw, AuthorizationStatus> = {
  IN_PROGRESS: "en-proceso",
  REJECTED: "rechazada",
  APPROVED: "aprobada",
};

const APPOINTMENT_TYPE_TITLES_PROFILE: Record<string, string> = {
  MEDICINA_GENERAL: "Medicina general",
  ODONTOLOGIA: "Odontología",
  PSICOLOGIA: "Psicología",
};

/** Etiqueta corta en español para el código crudo (nunca mostrar el enum). */
const AUTHORIZATION_TYPE_LABELS: Record<AuthorizationTypeRaw, string> = {
  BLOOD_TEST: "Examen de sangre",
  XRAY: "Radiografía",
  DENTAL_CLEANING: "Limpieza dental",
};

function appointmentTypeLabel(raw: string): string {
  return (
    APPOINTMENT_TYPE_TITLES_PROFILE[raw] ??
    raw.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
  );
}

/** `POST /certificates` → tarjeta de afiliación. */
export function toCertificateView(
  generated: CertificateGenerated,
): AffiliationCertificateView {
  return {
    id: generated.certificateId.slice(0, 8).toUpperCase(),
    issuedISO: generated.issuedAt,
    issuedLabel: formatShortDate(generated.issuedAt),
    memberSinceISO: generated.affiliationStartDate,
    memberSinceLabel: formatShortDate(generated.affiliationStartDate),
  };
}

/** `POST /medical-history` → tarjeta de historial. */
export function toHistoryView(
  generated: MedicalHistoryGenerated,
): MedicalHistorySummaryView {
  return {
    recordCount: generated.recordCount,
    recordsLabel: `${generated.recordCount} ${generated.recordCount === 1 ? "registro" : "registros"}`,
    updatedISO: generated.generatedAt,
    updatedLabel: formatShortDate(generated.generatedAt),
  };
}

/** `GET /authorizations` → tarjetas (usa las etiquetas del backend). */
export function toAuthorizationViews(
  items: AuthorizationResponse[],
): AuthorizationView[] {
  return items.map((item) => {
    const appointmentDate = formatShortDate(item.appointment.date);
    const views: AuthorizationView = {
      id: item.authorizationId,
      shortId: item.authorizationId.slice(0, 8).toUpperCase(),
      code: AUTHORIZATION_TYPE_LABELS[item.type] ?? item.type,
      title: item.typeLabel,
      description: `${appointmentTypeLabel(item.appointment.appointmentType)} • ${appointmentDate}`,
      status: AUTHORIZATION_STATUS_MAP[item.status],
      dateISO: item.createdAt,
      dateLabel: formatShortDate(item.createdAt),
      doctorName: item.appointment.physicianName,
    };
    if (item.status === "REJECTED") {
      views.rejectionReason = item.rejectionReasonLabel ?? undefined;
      views.rejectionCode = item.rejectionReason ?? undefined;
    }
    return views;
  });
}

/** Mensaje en español para errores de certificados/historial/autorizaciones. */
export function toProfileErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return "Aún no tienes documentos generados. Usa los botones para crearlos.";
    }
    return error.message;
  }
  return "Tuvimos un problema. Intenta de nuevo más tarde.";
}
