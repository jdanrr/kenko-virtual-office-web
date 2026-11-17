// Tipos view-model propios de la feature home-page.
// Espejo temporal de CONTRACTS.md: cuando existan los barrels de
// appointments, profile y auth, se importará desde allí y se mapeará
// a estas vistas en el punto de conexión (HomePage.vue).
// Nombres en inglés; comentarios en español.

export interface SessionPatientView {
  id: string;
  firstName: string;
  lastName: string;
  shortName: string;
  /** Documento enmascarado, nunca completo. */
  documentMasked: string;
  initials: string;
}

export type AppointmentModality = "presencial" | "teleconsulta";
export type AppointmentStatus = "confirmada" | "pendiente";

export interface AppointmentView {
  id: string;
  title: string;
  /** Especialidad en texto; home-page mapea el icono. */
  specialty: string;
  modality: AppointmentModality;
  status: AppointmentStatus;
  dateISO: string;
  /** Texto tal como se muestra (p. ej. "Mañana, 15 Mar 2026 - 10:00 AM"). */
  dateLabel: string;
  doctorName: string;
  site: string;
}

export interface AppointmentsSummaryView {
  next: AppointmentView | null;
  others: AppointmentView[];
  pendingCount: number;
}

export interface AffiliationCertificateView {
  id: string;
  issuedISO: string;
  issuedLabel: string;
  memberSinceISO: string;
  memberSinceLabel: string;
}

export interface MedicalHistorySummaryView {
  recordCount: number;
  recordsLabel: string;
  updatedISO: string;
  updatedLabel: string;
}

export type AuthorizationStatus = "aprobada" | "en-proceso" | "rechazada";
export type AuthorizationFilter = AuthorizationStatus | "todas";

export interface AuthorizationView {
  id: string;
  /** Primeros 8 caracteres del UUID para mostrar. */
  shortId: string;
  code: string;
  title: string;
  description?: string;
  status: AuthorizationStatus;
  dateISO: string;
  dateLabel: string;
  doctorName: string;
  /** Solo aprobada. */
  validityUntilLabel?: string;
  /** Solo en-proceso. */
  estimatedTime?: string;
  /** Solo rechazada. */
  rejectionReason?: string;
  rejectionCode?: string;
  suggestedAction?: string;
}
