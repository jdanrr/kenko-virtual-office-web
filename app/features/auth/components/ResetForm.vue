<script setup lang="ts">
import { computed, ref } from "vue";

import { failureFromUnknown, resetPassword } from "../api";
import type { AuthFailure, FieldErrors } from "../api";
import AuthAlert from "./AuthAlert.vue";
import PasswordChecklist from "./PasswordChecklist.vue";
import PasswordField from "./PasswordField.vue";

/**
 * Paso 2: crear la nueva contraseña con el token del enlace.
 * El `token` llega por prop (la página lo lee del fragmento `#token=`).
 * Nunca se muestra, loguea ni pone en una URL: solo viaja en el body.
 */
const props = defineProps<{
  token: string;
}>();

const password = ref("");
const confirmPassword = ref("");
const busy = ref(false);
const succeeded = ref(false);
const fields = ref<FieldErrors>({});
const failure = ref<AuthFailure | null>(null);

const alert = computed(() => {
  const current = failure.value;
  if (!current) return null;
  if (current.kind === "validation") return null;
  if (current.kind === "reset-invalid") {
    return {
      variant: "error" as const,
      title: "Enlace no válido o expirado",
      message: current.message,
      correlationId: current.correlationId,
    };
  }
  return {
    variant: "error" as const,
    title: "No pudimos cambiar tu contraseña",
    message: current.message,
    correlationId: current.correlationId,
  };
});

async function onSubmit(): Promise<void> {
  if (busy.value || succeeded.value) return;
  busy.value = true;
  failure.value = null;
  fields.value = {};
  try {
    await resetPassword({
      token: props.token,
      password: password.value,
      confirmPassword: confirmPassword.value,
    });
    succeeded.value = true;
  } catch (error) {
    const current = failureFromUnknown(error);
    if (current.kind === "validation") {
      fields.value = current.fields ?? {};
    } else {
      failure.value = current;
    }
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <form v-if="!succeeded" novalidate @submit.prevent="onSubmit">
    <div class="flex flex-col gap-4">
      <PasswordField
        v-model="password"
        label="Nueva contraseña"
        input-name="password"
        autocomplete="new-password"
        placeholder="8 a 128 caracteres"
        :error="fields.password"
        :disabled="busy"
      />
      <PasswordChecklist :password="password" :confirm-password="confirmPassword" />
      <PasswordField
        v-model="confirmPassword"
        label="Confirmar nueva contraseña"
        input-name="confirmPassword"
        autocomplete="new-password"
        placeholder="Repite la contraseña"
        :error="fields.confirmPassword"
        :disabled="busy"
      />

      <button
        class="w-full min-h-[50px] rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-display text-base font-bold shadow-sm transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-secondary cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        :disabled="busy"
        :aria-busy="busy"
      >
        <span>{{ busy ? "Guardando…" : "Guardar nueva contraseña" }}</span>
      </button>

      <AuthAlert
        v-if="alert"
        :variant="alert.variant"
        :title="alert.title"
        :message="alert.message"
        :correlation-id="alert.correlationId"
      />
      <NuxtLink
        v-if="failure?.kind === 'reset-invalid'"
        class="self-start font-body text-xs font-bold text-accent hover:underline rounded py-1 px-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary"
        to="/recuperar-contrasena"
      >
        Solicitar un nuevo enlace
      </NuxtLink>
    </div>
  </form>

  <div
    v-else
    role="status"
    class="rounded-2xl bg-primary/5 border border-primary/20 p-6 flex flex-col gap-3 text-center items-center"
  >
    <p class="font-display font-bold text-xl text-primary">
      Tu contraseña cambió
    </p>
    <p class="font-body text-sm text-content">
      Ahora entra con tu documento y tu nueva contraseña.
    </p>
    <NuxtLink
      class="w-full min-h-[48px] px-6 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary/90 font-display font-bold text-sm shadow flex items-center justify-center gap-2 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary"
      to="/iniciar-sesion"
    >
      Ir a entrar
    </NuxtLink>
  </div>
</template>
