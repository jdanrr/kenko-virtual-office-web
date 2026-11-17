import { useQuery } from "@tanstack/vue-query";

import { createAppointmentsClient, listMyAppointments } from "./api";
import type { AppointmentResponse } from "./types";

/** Claves de consulta de appointments (arreglos estables). */
export const appointmentKeys = {
  mine: () => ["appointments", "me"] as const,
};

/**
 * Citas del usuario autenticado (`GET /appointments/me`).
 * El token se inyecta desde la página (store de sesión); la feature no
 * importa otras features. Reintentos y caché según el QueryClient global.
 */
export function useMyAppointmentsQuery(
  getAccessToken: () => string | null,
  baseURL: string,
) {
  const client = createAppointmentsClient(baseURL, getAccessToken);
  return useQuery<AppointmentResponse[]>({
    queryKey: appointmentKeys.mine(),
    queryFn: () => listMyAppointments(client),
    // Solo en cliente: el token vive en memoria del navegador (en SSR no hay).
    enabled: import.meta.client,
  });
}
