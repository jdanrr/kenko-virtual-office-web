// Tipos del microservicio Profile (kenko-profile-go).
// Fuente: info del equipo backend (base http://127.0.0.1:8080, sin prefijo).
// Auth: `Authorization: Bearer <JWT>`; sin body/query salvo `:id` en rutas.
// Respuestas crudas (sin sobre `{ data }`); errores `{"error": "texto"}`.
// Nombres en inglés; comentarios en español.

/** `POST /certificates` → `201` (genera el certificado bajo demanda). */
export interface CertificateGenerated {
  certificateId: string;
  /** Fecha RFC3339 de emisión. */
  issuedAt: string;
  /** Fecha RFC3339 de inicio de afiliación. */
  affiliationStartDate: string;
}

/** `POST /medical-history` → `201` (genera el consolidado bajo demanda). */
export interface MedicalHistoryGenerated {
  pdfId: string;
  /** Fecha RFC3339 de generación. */
  generatedAt: string;
  /** Número de citas incluidas. */
  recordCount: number;
}

/** Estados crudos de autorización (`authorizations.go`). */
export type AuthorizationStatusRaw = "IN_PROGRESS" | "REJECTED" | "APPROVED";

/** Tipos crudos de autorización (`authorizations.go`). */
export type AuthorizationTypeRaw = "BLOOD_TEST" | "XRAY" | "DENTAL_CLEANING";

/** `GET /authorizations` → `200` lista (vacía si no hay, nunca `404`). */
export interface AuthorizationResponse {
  authorizationId: string;
  type: AuthorizationTypeRaw;
  /** Etiqueta lista para mostrar (p. ej. `"Examen de sangre"`). */
  typeLabel: string;
  status: AuthorizationStatusRaw;
  /** Etiqueta lista para mostrar (p. ej. `"En proceso"`). */
  statusLabel: string;
  /** Solo si `status` es `REJECTED` (p. ej. `"MISSING_DOCUMENTATION"`). */
  rejectionReason?: string;
  /** Etiqueta lista para mostrar (p. ej. `"Falta de documentación"`). */
  rejectionReasonLabel?: string;
  /** Fecha RFC3339 de creación. */
  createdAt: string;
  appointment: {
    appointmentId: string;
    /** Fecha `YYYY-MM-DD` de la cita asociada. */
    date: string;
    /** Tipo crudo (p. ej. `"MEDICINA_GENERAL"`). */
    appointmentType: string;
    physicianName: string;
  };
}

/** `POST /authorizations/:id/notify` → `202` (estado crudo). */
export interface AuthorizationNotified {
  authorizationId: string;
  status: AuthorizationStatusRaw;
}
