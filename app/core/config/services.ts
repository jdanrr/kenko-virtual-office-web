// Bases de los microservicios desde la runtimeConfig pública.
// Se alimentan de NUXT_PUBLIC_API_* (ver .env.example).
// Sin `/` final: evita `//recurso` (404 en backends estrictos).
import { normalizeBaseUrl } from "../api/httpClient";
export interface ServiceBases {
  auth: string;
  profile: string;
  appointments: string;
}

export function getServiceBases(): ServiceBases {
  const config = useRuntimeConfig();
  const bases = {
    auth: normalizeBaseUrl(config.public.apiAuthBase as string),
    profile: normalizeBaseUrl(config.public.apiProfileBase as string),
    appointments: normalizeBaseUrl(config.public.apiAppointmentsBase as string),
  };
  if (import.meta.dev && (!bases.auth || !bases.profile || !bases.appointments)) {
    console.warn(
      "[kenko] Falta(n) URL(s) de microservicio en tu .env " +
        "(NUXT_PUBLIC_API_AUTH_BASE, NUXT_PUBLIC_API_PROFILE_BASE, " +
        "NUXT_PUBLIC_API_APPOINTMENTS_BASE). Las llamadas irán al mismo origen y darán 404.",
    );
  }
  return bases;
}
