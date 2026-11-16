// Bases de los microservicios desde la runtimeConfig pública.
// Se alimentan de NUXT_PUBLIC_API_* (ver .env.example).
export interface ServiceBases {
  auth: string;
  profile: string;
  appointments: string;
}

export function getServiceBases(): ServiceBases {
  const config = useRuntimeConfig();
  return {
    auth: config.public.apiAuthBase as string,
    profile: config.public.apiProfileBase as string,
    appointments: config.public.apiAppointmentsBase as string,
  };
}
