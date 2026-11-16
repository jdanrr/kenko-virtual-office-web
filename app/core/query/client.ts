import { QueryClient } from "@tanstack/vue-query";

import { ApiError } from "../api/apiError";

/**
 * Cliente de TanStack Query para el estado de servidor.
 * - No reintenta errores `4xx` (son definitivos: validación, auth, límites).
 * - Reintenta hasta 2 veces los fallos de red y `5xx`.
 * - Sin `refetchOnWindowFocus` (evita llamadas sorpresa con sesión vencida).
 * - `staleTime` corto: fresco 30 s, luego revalida al reusarse.
 */

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status !== 0 && error.status < 500) {
    return false;
  }
  return failureCount < 2;
}

let client: QueryClient | null = null;

/** Instancia compartida (la crea el plugin solo-cliente). */
export function getQueryClient(): QueryClient {
  if (!client) {
    client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: shouldRetry,
          refetchOnWindowFocus: false,
          staleTime: 30_000,
        },
      },
    });
  }
  return client;
}

/**
 * Utilidad para claves de consulta consistentes: arreglos estables que
 * empiezan por feature y recurso (p. ej. `["appointments", "summary"]`).
 * Las features añaden las suyas siguiendo este patrón.
 */
export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
} as const;
