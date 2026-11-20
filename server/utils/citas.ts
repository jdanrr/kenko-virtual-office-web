// Helper del proxy citas: resuelve la base del microservicio y reenvía el JWT.
// Lee NUXT_API_CITAS_BASE (server) o NUXT_PUBLIC_API_CITAS_BASE, default AWS dev :8002.
// Base sin sufijo /api/v1: cada handler agrega /api/v1/... o /health.
export function citasBase(): string {
  const config = useRuntimeConfig();
  const raw =
    (config.apiCitasBase as string | undefined) ||
    (config.public?.apiCitasBase as string | undefined) ||
    "http://3.224.127.142:8002";
  return raw.replace(/\/$/, "");
}

export function forwardAuthHeader(event: Parameters<typeof getRequestHeader>[0]): Record<string, string> {
  const auth = getRequestHeader(event, "authorization");
  return auth ? { Authorization: auth } : {};
}
