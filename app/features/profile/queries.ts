import { useMutation, useQuery } from "@tanstack/vue-query";

import {
  createProfileClient,
  generateCertificate,
  generateMedicalHistory,
  listAuthorizations,
} from "./api";
import type {
  AuthorizationResponse,
  CertificateGenerated,
  MedicalHistoryGenerated,
} from "./types";

/** Claves de consulta de profile (arreglos estables). */
export const profileKeys = {
  authorizations: () => ["profile", "authorizations"] as const,
};

/**
 * Autorizaciones del usuario (`GET /authorizations`, solo lectura).
 * El token se inyecta desde la página (store de sesión); la feature no
 * importa otras features. 404 imposible aquí (lista vacía si no hay).
 */
export function useAuthorizationsQuery(
  getAccessToken: () => string | null,
  baseURL: string,
) {
  const client = createProfileClient(baseURL, getAccessToken);
  return useQuery<AuthorizationResponse[]>({
    queryKey: profileKeys.authorizations(),
    queryFn: () => listAuthorizations(client),
    // Solo en cliente: el token vive en memoria del navegador (en SSR no hay).
    enabled: import.meta.client,
  });
}

/** Generación bajo demanda del certificado (`POST /certificates`). */
export function useGenerateCertificateMutation(
  getAccessToken: () => string | null,
  baseURL: string,
) {
  const client = createProfileClient(baseURL, getAccessToken);
  return useMutation<CertificateGenerated>({
    mutationFn: () => generateCertificate(client),
  });
}

/** Generación bajo demanda del historial (`POST /medical-history`). */
export function useGenerateHistoryMutation(
  getAccessToken: () => string | null,
  baseURL: string,
) {
  const client = createProfileClient(baseURL, getAccessToken);
  return useMutation<MedicalHistoryGenerated>({
    mutationFn: () => generateMedicalHistory(client),
  });
}
