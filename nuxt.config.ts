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
    public: {
      apiAuthBase: "",
      apiProfileBase: "",
      apiAppointmentsBase: "",
    },
  },

  i18n: {
    defaultLocale: "es",
    locales: [{ code: "es", language: "es-ES", name: "Español" }],
  },

  runtimeConfig: {
    // Privado (server): base del microservicio appointments.
    // Lee NUXT_API_CITAS_BASE o cae al público.
    apiCitasBase: "",
    public: {
      // Público (browser): también sirve como fallback en server.
      // Lee NUXT_PUBLIC_API_CITAS_BASE.
      apiCitasBase: "http://localhost:8002",
    },
  },
});
