import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

// Solo infraestructura de tests: permite montar SFC de Vue con happy-dom.
// Se desactiva la resolución estática de assets en <img>: en tests no hay
// servidor de public/ y colgaría el transform (en prod Nuxt sirve /public).
export default defineConfig({
  plugins: [
    vue({
      template: {
        transformAssetUrls: {
          img: [],
        },
      },
    }),
  ],
  test: {
    environment: "happy-dom",
  },
});
