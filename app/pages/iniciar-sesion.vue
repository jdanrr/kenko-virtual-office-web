<script setup lang="ts">
import { onMounted, watch } from "vue";

import { useAuthStore } from "../features/auth/store";
import LoginForm from "../features/auth/components/LoginForm.vue";

/**
 * Página de login: tarjeta de acceso + panel de seguridad.
 * Tras el login muestra el saludo inline (sin redirección: la vista destino
 * es de otro compañero). "Crear cuenta" deshabilitado hasta implementarlo.
 *
 * Convención del proyecto: las rutas de páginas van SIEMPRE en español,
 * kebab-case y sin tildes (`/iniciar-sesion`). Las rutas BFF `/api/auth/*`
 * se mantienen en inglés porque son API, no navegación.
 */
const store = useAuthStore();

// Refresh silencioso (§3.3): tras recargar, recupera la sesión si la cookie
// httpOnly sigue vigente. Si no hay sesión, falla en silencio.
onMounted(() => {
  void store.restoreSession();
});

function onLogout(): void {
  store.logOut();
}

const route = useRoute();

// Tras un login correcto: ir a la página principal (o al destino pedido
// por `?redirect=`). Solo se aceptan rutas internas (sin redirección abierta).
watch(
  () => store.isAuthenticated,
  (authenticated) => {
    if (!authenticated) return;
    const redirect = route.query.redirect;
    const target =
      typeof redirect === "string" && redirect.startsWith("/") && !redirect.startsWith("//")
        ? redirect
        : "/home-page";
    void navigateTo(target, { replace: true });
  },
);
</script>

<template>
  <NuxtLayout name="auth">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div class="lg:col-span-7 xl:col-span-8 flex flex-col">
        <article
          class="bg-white rounded-2xl p-4 sm:p-10 border border-zinc-200/80 shadow-sm"
        >
          <header class="mb-6">
            <div
              class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-body text-xs font-bold mb-3"
            >
              <svg
                class="w-4 h-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>Atención Preferencial Kenko</span>
            </div>
            <h1 class="font-display text-2xl sm:text-3xl text-primary font-extrabold tracking-tight">
              ¡Hola de nuevo!
            </h1>
            <p class="font-body text-sm sm:text-base text-zinc-600 mt-1.5 leading-relaxed">
              Ingresa a tu portal de salud para gestionar citas, autorizaciones y
              recetas con tranquilidad.
            </p>
          </header>

          <div v-if="store.isAuthenticated" class="flex flex-col gap-4">
            <div
              role="status"
              class="rounded-xl border border-primary/20 bg-primary/5 p-5 flex flex-col gap-2"
            >
              <p class="font-display text-xl font-bold text-primary">
                {{ store.greeting }}
              </p>
              <p class="font-body text-sm text-zinc-700">
                Has entrado correctamente a tu portal de salud.
              </p>
            </div>
            <button
              class="w-full min-h-[48px] rounded-xl border-2 border-primary/20 hover:border-primary text-primary font-display text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-secondary"
              type="button"
              @click="onLogout"
            >
              Salir
            </button>
          </div>

          <LoginForm v-else />

          <div v-if="!store.isAuthenticated" class="pt-4 text-center">
            <div class="relative flex py-2 items-center">
              <div class="flex-grow border-t border-zinc-200" />
              <span class="flex-shrink mx-4 text-xs font-medium text-zinc-500 font-body">
                ¿No tienes cuenta aún en Kenko EPS?
              </span>
              <div class="flex-grow border-t border-zinc-200" />
            </div>
            <button
              class="w-full min-h-[48px] px-4 py-2.5 rounded-xl border-2 border-primary/20 text-primary font-display text-sm font-bold transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50 mt-1"
              type="button"
              disabled
              title="Disponible próximamente"
            >
              <svg
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                aria-hidden="true"
              >
                <circle cx="10" cy="8" r="3.5" />
                <path
                  d="M4 19c.8-3 3.2-4.5 6-4.5s5.2 1.5 6 4.5M18 8v6M15 11h6"
                  stroke-linecap="round"
                />
              </svg>
              <span>Crear cuenta nueva</span>
            </button>
          </div>
        </article>
      </div>

      <div class="lg:col-span-5 xl:col-span-4 flex flex-col">
        <aside
          aria-label="Información de seguridad y soporte"
          class="bg-white rounded-2xl p-4 sm:p-6 border border-zinc-200/80 shadow-sm flex flex-col gap-4"
        >
          <div class="flex items-start gap-3">
            <div
              class="w-11 h-11 rounded-xl bg-amber-50 border border-secondary/40 flex items-center justify-center text-amber-700 flex-shrink-0"
              aria-hidden="true"
            >
              <svg
                class="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path
                  d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z"
                  stroke-linejoin="round"
                />
                <path d="M9.5 12l2 2 3.5-4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div class="flex-1">
              <h2 class="font-display font-bold text-base text-zinc-900 leading-snug">
                Compromiso de Seguridad Kenko
              </h2>
              <p class="font-body text-xs sm:text-sm text-zinc-600 mt-1.5 leading-relaxed">
                Nunca te pediremos contraseñas, claves dinámicas ni transferencias
                de dinero por llamada, SMS o WhatsApp.
              </p>
            </div>
          </div>

          <div class="rounded-xl bg-zinc-50 border border-zinc-200/80 p-3 flex items-start gap-2.5">
            <svg
              class="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            >
              <path
                d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z"
                stroke-linejoin="round"
              />
              <path d="M9.5 12l2 2 3.5-4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div>
              <span class="font-display text-xs font-bold text-zinc-900 block">
                Verificación de Dominio Seguro
              </span>
              <p class="font-body text-xs text-zinc-600 mt-0.5">
                Verifica siempre que la dirección empiece exactamente por
                <span class="font-mono font-bold text-primary text-[11px] block sm:inline">
                  https://portal.kenkoeps.com.co
                </span>
              </p>
            </div>
          </div>

          <div class="pt-2 border-t border-zinc-100 flex flex-col gap-2.5">
            <h3
              class="font-display text-xs font-bold uppercase tracking-wider text-zinc-700"
            >
              Canales de Orientación y Ayuda
            </h3>
            <a
              class="flex items-center justify-between p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 transition-colors min-h-[48px] focus:outline-none focus:ring-2 focus:ring-secondary"
              href="tel:018000912345"
            >
              <span class="flex items-center gap-3">
                <svg
                  class="w-6 h-6 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  aria-hidden="true"
                >
                  <path
                    d="M5 4h4l2 5-2.5 1.5a12 12 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>
                  <span class="font-body text-[11px] text-zinc-500 block">
                    Línea Nacional Gratuita 24/7
                  </span>
                  <span class="font-display text-base text-primary font-extrabold tracking-tight">
                    01 8000 912345
                  </span>
                </span>
              </span>
              <span class="font-body text-xs bg-secondary text-content px-2 py-0.5 rounded font-bold">
                Gratis
              </span>
            </a>
            <button
              class="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 min-h-[48px] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary text-left"
              type="button"
              disabled
              title="Disponible próximamente"
            >
              <span>
                <span class="font-display text-sm text-content block font-bold">
                  Chat Asistido en Línea
                </span>
                <span class="font-body text-[11px] text-zinc-500">
                  Orientación con asistente virtual
                </span>
              </span>
              <svg
                class="w-5 h-5 text-zinc-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </aside>
      </div>
    </div>
  </NuxtLayout>
</template>
