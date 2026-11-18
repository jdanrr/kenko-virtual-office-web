<script setup lang="ts">
import { computed, ref } from "vue";

import { useAuthStore } from "../store";
import { normalizeDocumentNumber } from "../schemas";
import type { DocumentType } from "../types";
import { useRateLimitCountdown } from "../useRateLimitCountdown";
import AuthAlert from "./AuthAlert.vue";
import DocumentNumberField from "./DocumentNumberField.vue";
import DocumentTypeSelector from "./DocumentTypeSelector.vue";
import PasswordField from "./PasswordField.vue";

/** Formulario de login: integra átomos + store + 429. */
const store = useAuthStore();

const documentType = ref<DocumentType>("CC");
const documentNumber = ref("");
const password = ref("");

const busy = computed(() => store.status === "authenticating");
const fields = computed(() =>
  store.lastFailure?.kind === "validation" ? (store.lastFailure.fields ?? {}) : {},
);

/** Cuenta regresiva visible del 429 (el store guarda los segundos totales). */
const { remaining } = useRateLimitCountdown(() => store.lastFailure);

const alert = computed(() => {
  const failure = store.lastFailure;
  if (!failure || failure.kind === "validation") return null;
  if (failure.kind === "rate-limited") {
    return {
      variant: "info" as const,
      title: "Demasiados intentos",
      message: `Hiciste muchos intentos. Espera ${remaining.value} segundos e intenta de nuevo.`,
      correlationId: failure.correlationId,
    };
  }
  return {
    variant: "error" as const,
    title: "No pudimos entrar",
    message: failure.message,
    correlationId: failure.correlationId,
  };
});

async function onSubmit(): Promise<void> {
  await store.logIn({
    documentType: documentType.value,
    documentNumber: normalizeDocumentNumber(documentNumber.value),
    password: password.value,
  });
}
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
    <DocumentTypeSelector
      v-model="documentType"
      :error="fields.documentType"
      :disabled="busy"
    />
    <DocumentNumberField
      v-model="documentNumber"
      :error="fields.documentNumber"
      :disabled="busy"
    />
    <PasswordField v-model="password" :error="fields.password" :disabled="busy" />

    <NuxtLink
      class="group flex items-center gap-3 p-4 rounded-xl bg-primary/5 border-2 border-primary/20 hover:border-primary hover:bg-primary/10 transition-all min-h-[64px] focus:outline-none focus:ring-2 focus:ring-secondary"
      to="/recuperar-contrasena"
    >
      <span
        aria-hidden="true"
        class="w-11 h-11 rounded-xl bg-white border border-primary/20 text-primary flex items-center justify-center shrink-0"
      >
        <svg
          class="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <circle cx="10" cy="8" r="3.5" />
          <path
            d="M4 19c.8-3 3.2-4.5 6-4.5s5.2 1.5 6 4.5M18 8v6M15 11h6"
            stroke-linecap="round"
          />
        </svg>
      </span>
      <span class="flex-1">
        <span class="font-display text-base sm:text-lg font-bold text-primary block leading-snug">
          ¿Olvidaste tu contraseña?
        </span>
        <span class="font-body text-xs sm:text-sm text-zinc-600">
          Recupérala en un minuto solo con tu documento
        </span>
      </span>
      <svg
        class="w-5 h-5 text-primary shrink-0 transition-transform group-hover:translate-x-0.5"
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
    </NuxtLink>

    <AuthAlert
      v-if="alert"
      :variant="alert.variant"
      :title="alert.title"
      :message="alert.message"
      :correlation-id="alert.correlationId"
    />

    <div class="flex flex-col gap-2.5 pt-1">
      <button
        class="w-full min-h-[50px] rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-display text-base font-bold shadow-sm transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-secondary cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        :disabled="busy"
        :aria-busy="busy"
      >
        <svg
          v-if="busy"
          class="w-5 h-5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        <span>{{ busy ? "Entrando de forma segura…" : "Ingresar" }}</span>
        <svg
          v-if="!busy"
          class="w-5 h-5"
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
  </form>
</template>
