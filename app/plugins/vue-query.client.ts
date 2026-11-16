import { VueQueryPlugin } from "@tanstack/vue-query";

import { getQueryClient } from "~/core/query/client";

/** Instala TanStack Query solo en el cliente (la sesión vive en el navegador). */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient: getQueryClient() });
});
