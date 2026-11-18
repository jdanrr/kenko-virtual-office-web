<script setup lang="ts">
import { useAuthStore } from "../features/auth/store";

/**
 * Confirmación de cierre de sesión (§3.4).
 * Muestra "Saliste de tu cuenta" solo si vienes de un logout voluntario
 * (`justLoggedOut`); en acceso directo, mensaje neutro sin inventar estado.
 */
const store = useAuthStore();
</script>

<template>
  <NuxtLayout name="auth">
    <div class="w-full max-w-xl mx-auto flex flex-col">
      <div class="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 sm:p-8 flex flex-col items-center text-center gap-4">
        <span
          class="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center"
          aria-hidden="true"
        >
          <svg
            class="w-7 h-7"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
        </span>
        <h1 class="text-primary font-display font-extrabold text-2xl tracking-tight">
          {{ store.justLoggedOut ? "Saliste de tu cuenta" : "Sesión terminada" }}
        </h1>
        <p class="font-body text-sm text-zinc-600 leading-relaxed">
          {{
            store.justLoggedOut
              ? "Cerramos tus sesiones en todos los dispositivos. Tus datos están a salvo."
              : "Tu sesión no está activa. Si quieres entrar, usa tu documento y contraseña."
          }}
        </p>
        <NuxtLink
          class="w-full min-h-[48px] px-6 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary/90 font-display font-bold text-sm shadow flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary"
          to="/iniciar-sesion"
        >
          Volver a entrar
        </NuxtLink>
      </div>
    </div>
  </NuxtLayout>
</template>
