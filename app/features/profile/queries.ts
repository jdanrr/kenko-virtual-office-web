import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";

import {
  createProfileClient,
  generateCertificate,
  generateMedicalHistory,
  getProfile,
  listAuthorizations,
  patchProfile,
} from "./api";
import type {
  AuthorizationResponse,
  CertificateGenerated,
  MedicalHistoryGenerated,
  PatchProfileRequest,
  Profile,
} from "./types";

/** Claves de consulta de profile (arreglos estables). */
export const profileKeys = {
  authorizations: () => ["profile", "authorizations"] as const,
  /** Perfil propio por `userId` (de `auth.user.userId`, nunca input manual). */
  detail: (id: string) => ["profile", "detail", id] as const,
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

/**
 * Perfil propio (`GET /profiles/{id}`, solo lectura).
 * El `userId` se inyecta desde la página (`auth.user.userId` de la sesión);
 * la feature no importa otras features. Solo en cliente (token en memoria).
 * `404` = SQS aún no llega (la UI muestra reintentar); `4xx` no reintenta.
 */
export function useProfileQuery(
  getAccessToken: () => string | null,
  baseURL: string,
  getUserId: () => string | null,
) {
  const client = createProfileClient(baseURL, getAccessToken);
  return useQuery<Profile>({
    queryKey: profileKeys.detail(getUserId() ?? ""),
    queryFn: () => getProfile(client, getUserId() ?? ""),
    // Solo en cliente con sesión: el token y el id viven en memoria (en SSR no hay).
    enabled: import.meta.client && !!getUserId(),
  });
}

/**
 * Actualización de contacto (`PATCH /profiles/{id}`).
 * Solo `phone` y/o `address.{line,city}` (validar antes con `schemas.ts`).
 * Al `200` actualiza la caché del detalle (refleja `updated_at` sin refetch).
 */
export function usePatchProfileMutation(
  getAccessToken: () => string | null,
  baseURL: string,
  getUserId: () => string | null,
) {
  const client = createProfileClient(baseURL, getAccessToken);
  const queryClient = useQueryClient();
  return useMutation<Profile, Error, PatchProfileRequest>({
    mutationFn: (body) => patchProfile(client, getUserId() ?? "", body),
    onSuccess: (updated) => {
      queryClient.setQueryData(profileKeys.detail(getUserId() ?? ""), updated);
    },
  });
}
