import { ApiError } from "../../core/api/apiError";

/**
 * Presentación del perfil propio (sin lógica de red ni de sesión).
 * Todo es derivado del contrato `Profile`: sin datos inventados.
 * Fechas en español (`es-CO`); horas solo para `updated_at`.
 */

/** Nombre completo sin espacios sobrantes. */
export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();
}

/** Documento `CC • 1.020.304.050` (agrupación de miles solo visual). */
export function formatDocument(documentType: string, documentNumber: string): string {
  const grouped = documentNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${documentType} • ${grouped}`;
}

/** `YYYY-MM-DD` → `21 de marzo de 1995` (UTC, sin corrimiento de día). */
export function formatBirthDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** RFC3339 → `14 de enero de 2024` (fecha de afiliación). */
export function formatAffiliationDate(rfc3339: string): string {
  const date = new Date(rfc3339);
  if (Number.isNaN(date.getTime())) return rfc3339;
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** RFC3339 → `15 mar 2026, 10:00` (trazabilidad de `updated_at`). */
export function formatUpdatedAt(rfc3339: string): string {
  const date = new Date(rfc3339);
  if (Number.isNaN(date.getTime())) return rfc3339;
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

/** `female` → `Femenino`; resto se capitaliza sin inventar catálogos. */
export function formatGender(gender: string): string {
  const key = gender.trim().toLowerCase();
  if (key === "male") return "Masculino";
  if (key === "female") return "Femenino";
  if (key === "other") return "Otro";
  if (!key) return gender;
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * Formato visual del celular colombiano (300 123 4567).
 * Solo presentación: la normalización a E.164 vive en `schemas.ts`.
 */
export function formatPhoneDisplayLocal(value: string): string {
  const raw = value.replace(/\D/g, "");
  const digits = raw.length === 12 && raw.startsWith("57") ? raw.slice(2) : raw;
  const ten = digits.slice(0, 10);
  if (ten.length > 6) return `${ten.slice(0, 3)} ${ten.slice(3, 6)} ${ten.slice(6)}`;
  if (ten.length > 3) return `${ten.slice(0, 3)} ${ten.slice(3)}`;
  return ten;
}

export type ProfilePageErrorKind = "not-found" | "validation" | "network" | "unexpected";

export interface ProfilePageError {
  kind: ProfilePageErrorKind;
  message: string;
  correlationId?: string;
}

/**
 * Mensaje en español para la página (por `status`, nunca por texto libre,
 * salvo el `400` de PATCH que muestra el mensaje del backend).
 * `404` = SQS aún no llega (reintentar); red/`5xx` = genérico.
 */
export function toProfilePageError(error: unknown): ProfilePageError | null {
  if (!error) return null;
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return {
        kind: "not-found",
        message:
          "Tu perfil se está creando, intenta de nuevo en unos segundos.",
        correlationId: error.correlationId,
      };
    }
    if (error.status === 400) {
      return {
        kind: "validation",
        message: error.message,
        correlationId: error.correlationId,
      };
    }
    if (error.status === 0) {
      return {
        kind: "network",
        message: "No pudimos conectarnos. Revisa tu conexión e intenta de nuevo.",
        correlationId: error.correlationId,
      };
    }
    return {
      kind: "unexpected",
      message: "Tuvimos un problema. Intenta de nuevo más tarde.",
      correlationId: error.correlationId,
    };
  }
  return {
    kind: "unexpected",
    message: "Tuvimos un problema. Intenta de nuevo más tarde.",
  };
}
