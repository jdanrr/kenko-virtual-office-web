// Acceso al microservicio Profile (directo, sin BFF).
// Auth: `Authorization: Bearer <JWT>` (mismo token de login); sin cookies.
// Generación bajo demanda: certificados e historial se crean con POST y el
// backend devuelve los metadatos (no hay descarga de PDF para estos dos).
// Solo las autorizaciones tienen PDF descargable (`GET .../:id/pdf`).
import { createServiceClient } from "../../core/api/httpClient";
import type { ServiceClient } from "../../core/api/httpClient";
import { ApiError } from "../../core/api/apiError";
import type {
  AuthorizationNotified,
  AuthorizationResponse,
  CertificateGenerated,
  MedicalHistoryGenerated,
  PatchProfileRequest,
  Profile,
} from "./types";
import { isProfile } from "./types";

export function createProfileClient(
  baseURL: string,
  getAccessToken: () => string | null,
): ServiceClient {
  return createServiceClient({ baseURL, getAccessToken });
}

/** `POST /certificates`: genera el certificado de afiliación. */
export async function generateCertificate(
  client: ServiceClient,
): Promise<CertificateGenerated> {
  return client.request<CertificateGenerated>("/certificates", {
    method: "POST",
    envelope: false,
  });
}

/** `POST /medical-history`: genera el consolidado clínico. */
export async function generateMedicalHistory(
  client: ServiceClient,
): Promise<MedicalHistoryGenerated> {
  return client.request<MedicalHistoryGenerated>("/medical-history", {
    method: "POST",
    envelope: false,
  });
}

/** `GET /authorizations`: lista las autorizaciones del usuario. */
export async function listAuthorizations(
  client: ServiceClient,
): Promise<AuthorizationResponse[]> {
  return client.request<AuthorizationResponse[]>("/authorizations", {
    envelope: false,
  });
}

/**
 * `GET /authorizations/:id/pdf`: descarga el PDF y lo guarda en el equipo.
 * Usa el nombre sugerido por el backend (`Content-Disposition`) o uno
 * propio si no llega. Requiere navegador (Blob + descarga).
 */
export async function downloadAuthorizationPdf(
  client: ServiceClient,
  authorizationId: string,
): Promise<void> {
  if (typeof document === "undefined") return;
  const blob = await client.request<Blob>(
    `/authorizations/${authorizationId}/pdf`,
    { responseType: "blob", envelope: false },
  );
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = `autorizacion-${authorizationId.slice(0, 8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * `POST /authorizations/:id/notify`: reenvía la autorización por correo
 * (genera el PDF y publica el evento). Sin botón en la maqueta (TODO).
 */
export async function notifyAuthorization(
  client: ServiceClient,
  authorizationId: string,
): Promise<AuthorizationNotified> {
  return client.request<AuthorizationNotified>(
    `/authorizations/${authorizationId}/notify`,
    { method: "POST", envelope: false },
  );
}

/**
 * Genera el `X-Correlation-Id` de trazabilidad (un uuid por petición).
 * Server-safe: usa `crypto.randomUUID` con respaldo sin PII.
 */
export function newCorrelationId(): string {
  const cryptoRef = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoRef?.randomUUID) return cryptoRef.randomUUID();
  const hex = (): string => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");
  const raw = `${hex()}${hex()}${hex()}${hex()}`;
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-4${raw.slice(13, 16)}-8${raw.slice(17, 20)}-${raw.slice(20, 32)}`;
}

function requireProfileId(id: string): string {
  const trimmed = id.trim();
  if (!trimmed) {
    throw new ApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "No pudimos identificar tu perfil. Vuelve a entrar.",
    });
  }
  return trimmed;
}

function toProfileOrThrow(payload: unknown, path: string): Profile {
  if (isProfile(payload)) return payload;
  throw new ApiError({
    status: 0,
    code: "INTERNAL_ERROR",
    message: `Respuesta inesperada de ${path}. Intenta de nuevo más tarde.`,
  });
}

/**
 * `GET /profiles/{id}` → `200` perfil propio (respuesta cruda, sin sobre).
 * `404 {"error":"profile not found"}` = SQS aún no llega (reintentar).
 * El `userId` lo aporta la página desde `auth.user.userId` (sesión).
 */
export async function getProfile(
  client: ServiceClient,
  id: string,
  correlationId: string = newCorrelationId(),
): Promise<Profile> {
  const result = await client.request<unknown>(`/profiles/${requireProfileId(id)}`, {
    envelope: false,
    headers: { "X-Correlation-Id": correlationId },
  });
  return toProfileOrThrow(result, `/profiles/${id}`);
}

/**
 * `PATCH /profiles/{id}` — único cuerpo permitido: `phone` y/o
 * `address.{line,city}` completo. Cualquier otro campo (`email`,
 * `password`, …) da `400` en backend; validarlo antes con `schemas.ts`.
 */
export async function patchProfile(
  client: ServiceClient,
  id: string,
  body: PatchProfileRequest,
  correlationId: string = newCorrelationId(),
): Promise<Profile> {
  if (!body || (body.phone === undefined && body.address === undefined)) {
    throw new ApiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "No hay cambios para guardar.",
    });
  }
  const result = await client.request<unknown>(`/profiles/${requireProfileId(id)}`, {
    method: "PATCH",
    body,
    envelope: false,
    headers: { "X-Correlation-Id": correlationId },
  });
  return toProfileOrThrow(result, `/profiles/${id}`);
}
