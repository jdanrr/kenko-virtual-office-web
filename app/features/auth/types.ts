/**
 * Tipos del dominio Authentication.
 *
 * Fuente de verdad: `docs/auth-service.md` §1–§3 (contrato del microservicio).
 * Solo tipos y constantes puras: sin I/O, sin validación, sin fetches.
 * La validación vive en `schemas.ts`; el acceso a API en `api.ts`.
 */

/** §3.2 / §3.1: únicos tipos de documento que acepta la API. */
export const DOCUMENT_TYPES = ["CC", "TI", "CE", "PA"] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/**
 * §3.2 `POST /auth/login` — cuerpo ya normalizado:
 * `documentNumber` en mayúsculas, sin espacios/puntos/guiones.
 */
export interface LoginRequest {
  documentType: DocumentType;
  documentNumber: string;
  password: string;
}

/**
 * §3.2 salida `200` y §3.3 `POST /auth/refresh` (par nuevo).
 * `expiresIn` en segundos (suposición documentada del contrato: 900).
 */
export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** §3.7 `GET /auth/me` — única fuente del saludo ("Hola, {firstName}"). */
export interface AuthUser {
  userId: string;
  firstName: string;
  email: string;
}

/** §3.1: únicos géneros que acepta la API. */
export const GENDERS = ["male", "female", "other"] as const;

export type Gender = (typeof GENDERS)[number];

/**
 * §3.1 `POST /auth/register` — cuerpo ya normalizado (12 campos).
 * `confirmPassword` SÍ se envía (el backend la exige idéntica), solo no se
 * almacena. Nombres/dirección solo con `trim` (sin cambiar capitalización).
 */
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  /** Fecha ISO `YYYY-MM-DD`, no futura, no mayor a 120 años. */
  birthDate: string;
  gender: Gender;
  /** `trim` + minúsculas, máx. 254. */
  email: string;
  /** Normalizado a E.164 (p. ej. `+573001234567`). */
  phone: string;
  addressLine: string;
  city: string;
  documentType: DocumentType;
  /** Mayúsculas, sin espacios/puntos/guiones, `^[A-Z0-9]{4,20}$`. */
  documentNumber: string;
  /** 8–128, fuera de la lista negra. */
  password: string;
  /** Idéntica a `password`. */
  confirmPassword: string;
}

/**
 * §3.1 salida `201 { data: { userId, maskedEmail } }`
 * (`maskedEmail` tipo `m***@dominio`: se muestra tal cual, sin reconstruir).
 */
export interface RegisterSuccess {
  userId: string;
  maskedEmail: string;
}

/**
 * §3.5 `POST /auth/password/forgot` — cuerpo ya normalizado.
 * Respuesta siempre `200 { data: {} }` exista o no la cuenta
 * (anti-enumeración: el mensaje UI es idéntico en ambos casos).
 */
export interface ForgotPasswordRequest {
  documentType: DocumentType;
  /** Mayúsculas, sin espacios/puntos/guiones, `^[A-Z0-9]{4,20}$`. */
  documentNumber: string;
}

/**
 * §3.6 `POST /auth/password/reset` — cuerpo ya normalizado.
 * `token` opaco: llega en el fragmento del enlace (`#token=…`), nunca en
 * la URL al llamar a la API; aquí viaja solo en el BODY.
 */
export interface ResetPasswordRequest {
  /** Opaco, no vacío. Nunca loguearlo ni ponerlo en una URL. */
  token: string;
  /** Misma política 8–128 + lista negra (§3.1). Distinta a la actual. */
  password: string;
  /** Idéntica a `password`. */
  confirmPassword: string;
}

/**
 * `POST /auth/password/change` — cuerpo ya normalizado.
 * Sin confirmación: se valida solo en la UI, al cable no viaja.
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  /** Misma política 8–128 + lista negra (§3.1). Distinta a la actual. */
  newPassword: string;
}

/**
 * `POST /auth/email/change` — cuerpo ya normalizado.
 * `newEmail` con `trim` + minúsculas (igual que el backend).
 */
export interface ChangeEmailRequest {
  newEmail: string;
  currentPassword: string;
}

/** §1.2 sobre de respuesta en éxito: `{ data }`. */
export interface ApiSuccess<T> {
  data: T;
}

/**
 * §1.2 `details: [{ field?, message }]` existe **solo** en `VALIDATION_ERROR`.
 * Se usa para pintar errores bajo cada campo.
 */
export interface ApiFieldDetail {
  field?: string;
  message: string;
}

/** §3.10 catálogo transversal de códigos (estables; nunca matchear por `message`). */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "REGISTER_CONFLICT"
  | "UPDATE_CONFLICT"
  | "PASSWORD_RESET_INVALID"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "PAYLOAD_TOO_LARGE"
  | "INTERNAL_ERROR";

/** §1.2 sobre de respuesta en error: `{ error: { code, message, correlationId, details? } }`. */
export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  correlationId: string;
  details?: ApiFieldDetail[];
}

export interface ApiFailure {
  error: ApiErrorBody;
}

/** §1.2 sobre completo: éxito `{ data }` o error `{ error }`. */
export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

/**
 * Discriminante del sobre sin confiar en `message` (§1.2: usar `code`).
 * Tolera payloads malformados devolviendo `false` en vez de lanzar.
 */
export function isApiFailure(payload: unknown): payload is ApiFailure {
  if (typeof payload !== "object" || payload === null) return false;
  if (!("error" in payload)) return false;
  const { error } = payload as { error: unknown };
  if (typeof error !== "object" || error === null) return false;
  const { code, message, correlationId } = error as Record<string, unknown>;
  return (
    typeof code === "string" &&
    typeof message === "string" &&
    typeof correlationId === "string"
  );
}
