<script setup lang="ts">
import ForgotForm from "../features/auth/components/ForgotForm.vue";

/**
 * Página 1: solicitar enlace de recuperación.
 * Ruta pública (ver middleware). Siempre el mismo mensaje exista o no
 * la cuenta (anti-enumeración, §3.5).
 */
</script>

<template>
  <NuxtLayout name="auth">
    <div class="w-full max-w-xl mx-auto flex flex-col">
      <div class="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-4 sm:p-8">
        <div class="flex flex-col gap-2 mb-6">
          <h1 class="text-primary font-display font-extrabold text-2xl md:text-3xl tracking-tight">
            Recuperar acceso a tu cuenta
          </h1>
          <p class="text-zinc-600 text-sm">
            Ingresa tu documento registrado para recibir un enlace de
            restablecimiento seguro en tu correo electrónico.
          </p>
        </div>

        <ForgotForm />

        <div class="mt-6 pt-5 border-t border-zinc-200/80">
          <NuxtLink
            class="w-full min-h-[48px] px-4 py-2.5 rounded-xl border-2 border-primary/20 hover:border-primary text-primary font-display text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary"
            to="/iniciar-sesion"
          >
            <svg
              class="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                d="M19 12H5M11 6l-6 6 6 6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>Volver a iniciar sesión</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
