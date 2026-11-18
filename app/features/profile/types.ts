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

// Perfil propio (`GET /profiles/{id}`, `PATCH /profiles/{id}`).
// Fuente: equipo backend Profile (base http://127.0.0.1:8080, sin prefijo).
// Respuestas crudas (sin sobre `{ data }`); errores `{"error": "texto"}`.
// Solo lectura salvo `phone` y `address.{line,city}` vía PATCH.

/** `document_type` crudo (p. ej. `"CC"`). Abierto para no inventar el catálogo. */
export type ProfileDocumentType = string;

/** `gender` crudo (p. ej. `"female"`). Abierto para no inventar el catálogo. */
export type ProfileGender = string;

/** `GET /profiles/{id}` → `200` perfil propio. */
export interface Profile {
  /** uuid-v7 del usuario (= `sub` de la sesión). Nunca mostrar crudo en UI. */
  id: string;
  document_type: ProfileDocumentType;
  document_number: string;
  first_name: string;
  last_name: string;
  /** Fecha ISO `YYYY-MM-DD` (p. ej. `"1995-03-21"`). */
  birth_date: string;
  gender: ProfileGender;
  /** Solo lectura en esta vista (se cambia en Authentication, vía SQS). */
  email: string;
  email_verified: boolean;
  /** E.164 (p. ej. `"+573001234567"`). Editable vía PATCH. */
  phone: string;
  /** Editable vía PATCH solo junto a `city`. */
  address_line: string;
  /** Editable vía PATCH solo junto a `address_line`. */
  city: string;
  /** Fechas RFC3339. */
  created_at: string;
  updated_at: string;
}

/** `PATCH /profiles/{id}` — único cuerpo permitido por el backend. */
export interface ProfileAddressPatch {
  line: string;
  city: string;
}

export interface PatchProfileRequest {
  phone?: string;
  address?: ProfileAddressPatch;
}

/** Error crudo del backend Profile: `{"error": "texto"}`. */
export interface ProfileErrorBody {
  error: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Discriminante del perfil sin confiar en mensajes.
 * Tolera payloads malformados devolviendo `false` en vez de lanzar.
 */
export function isProfile(payload: unknown): payload is Profile {
  if (!isRecord(payload)) return false;
  return (
    typeof payload.id === "string" &&
    typeof payload.document_type === "string" &&
    typeof payload.document_number === "string" &&
    typeof payload.first_name === "string" &&
    typeof payload.last_name === "string" &&
    typeof payload.birth_date === "string" &&
    typeof payload.gender === "string" &&
    typeof payload.email === "string" &&
    typeof payload.email_verified === "boolean" &&
    typeof payload.phone === "string" &&
    typeof payload.address_line === "string" &&
    typeof payload.city === "string" &&
    typeof payload.created_at === "string" &&
    typeof payload.updated_at === "string"
  );
}

/** Discriminante del error `{"error": "texto"}` del backend Profile. */
export function isProfileErrorBody(payload: unknown): payload is ProfileErrorBody {
  if (!isRecord(payload)) return false;
  return typeof payload.error === "string";
}
