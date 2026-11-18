<script setup lang="ts">
import { onMounted, ref } from "vue";

import { tokenFromFragment } from "../features/auth/passwordRecoverySchemas";
import ResetForm from "../features/auth/components/ResetForm.vue";

/**
 * Página 2: restablecer con el token del enlace.
 * Excepción a la convención de español: el path `/reset` lo fija el backend
 * (`<PORTAL_BASE_URL>/reset#token=…`). El token vive en el fragmento: se lee
 * solo en cliente, nunca viaja en una URL ni se guarda en ningún store.
 */
const token = ref<string | null>(null);
const ready = ref(false);

onMounted(() => {
  token.value = tokenFromFragment(window.location.hash);
  ready.value = true;
});
</script>

<template>
  <NuxtLayout name="auth">
    <div class="w-full max-w-xl mx-auto flex flex-col">
      <div class="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-4 sm:p-8">
        <div class="flex flex-col gap-1 mb-6">
          <h1 class="text-primary font-display font-extrabold text-2xl md:text-3xl tracking-tight">
            Crea tu nueva contraseña
          </h1>
          <p class="text-zinc-600 text-sm">
            Ingresa tu nueva clave de acceso para actualizar las credenciales
            de tu cuenta de forma segura.
          </p>
        </div>

        <ResetForm v-if="ready && token" :key="token" :token="token" />

        <div
          v-else-if="ready"
          role="status"
          class="rounded-xl bg-zinc-50 border border-zinc-200/80 p-5 flex flex-col gap-3"
        >
          <p class="font-display font-bold text-base text-content">
            Necesitas un enlace válido
          </p>
          <p class="font-body text-sm text-zinc-600">
            Llegaste sin un enlace de recuperación (o ya se usó). Solicita uno
            nuevo y ábrelo desde tu correo: vence en 30 minutos y sirve una vez.
          </p>
          <NuxtLink
            class="w-full min-h-[48px] px-6 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary/90 font-display font-bold text-sm shadow flex items-center justify-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-secondary"
            to="/recuperar-contrasena"
          >
            Solicitar enlace
          </NuxtLink>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
