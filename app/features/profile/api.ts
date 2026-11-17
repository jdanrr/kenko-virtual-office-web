// Acceso al microservicio Profile (directo, sin BFF).
// Auth: `Authorization: Bearer <JWT>` (mismo token de login); sin cookies.
// Generación bajo demanda: certificados e historial se crean con POST y el
// backend devuelve los metadatos (no hay descarga de PDF para estos dos).
// Solo las autorizaciones tienen PDF descargable (`GET .../:id/pdf`).
import { createServiceClient } from "../../core/api/httpClient";
import type { ServiceClient } from "../../core/api/httpClient";
import type {
  AuthorizationNotified,
  AuthorizationResponse,
  CertificateGenerated,
  MedicalHistoryGenerated,
} from "./types";

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
