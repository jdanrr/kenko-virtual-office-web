import { VueQueryPlugin } from "@tanstack/vue-query";

import { createQueryClient, getQueryClient } from "~/core/query/client";

/**
 * Instala TanStack Query en servidor y cliente.
 * En servidor se crea una instancia fresca por petición (nunca se comparte
 * caché entre usuarios); en el navegador se reusa la instancia única, que es
 * donde vive la sesión. Las queries solo hacen fetch en cliente (ver
 * `enabled` en cada query): el access token solo existe en memoria del
 * navegador, así que pedir en SSR sería un 401 inútil.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = import.meta.server ? createQueryClient() : getQueryClient();
  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient });
});
