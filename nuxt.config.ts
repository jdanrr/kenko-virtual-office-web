import tailwindcss from "@tailwindcss/vite";
import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@pinia/nuxt",
    "nuxt-auth-utils",
    "@pinia/colada-nuxt",
    "@nuxt/icon/module",
    "@nuxt/image",
    "@nuxtjs/i18n",
  ],
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  devtools: { enabled: true },
  compatibilityDate: "2025-07-15",

  runtimeConfig: {
    // Privado (server): base del microservicio appointments (proxy BFF legacy).
    // Lee NUXT_API_CITAS_BASE o cae al público.
    apiCitasBase: "",
    public: {
      apiAuthBase: "",
      apiProfileBase: "",
      apiAppointmentsBase: "",
      // Fallback del proxy legacy. Lee NUXT_PUBLIC_API_CITAS_BASE.
      apiCitasBase: "http://3.224.127.142:8002",
    },
  },

  i18n: {
    defaultLocale: "es",
    locales: [{ code: "es", language: "es-ES", name: "Español" }],
  },
});
