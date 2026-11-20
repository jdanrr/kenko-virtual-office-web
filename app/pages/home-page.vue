<script setup lang="ts">
// Ruta de la página de inicio: renderiza la página de la feature home-page.
// Solo en cliente: toda la vista depende de la sesión (token en memoria) y de
// queries client-only; sin esto el SSR pinta otro estado y Vue avisa
// hydration mismatch. El fallback es estático para que servidor y cliente
// hidraten exactamente lo mismo. El SEO/meta queda aquí (server-safe) para
// que no se pierda al no renderizar el hijo en el servidor.
import HomePage from "~/features/home-page/pages/HomePage.vue";

useSeoMeta({
  title: "Portal del Paciente - Kenko EPS",
  description:
    "Portal del paciente Kenko EPS: citas médicas, sede, certificados y autorizaciones.",
  ogTitle: "Portal del Paciente - Kenko EPS",
  ogDescription:
    "Portal del paciente Kenko EPS: citas médicas, sede, certificados y autorizaciones.",
});

useHead({
  htmlAttrs: { lang: "es" },
});
</script>

<template>
  <ClientOnly>
    <HomePage />
    <template #fallback>
      <div class="min-h-screen flex flex-col antialiased">
        <div class="h-16 bg-amber-100 border-b border-amber-200" />
        <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="h-64 rounded-2xl bg-slate-100 animate-pulse" />
        </main>
      </div>
    </template>
  </ClientOnly>
</template>
