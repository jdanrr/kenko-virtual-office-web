<script setup lang="ts">
import { computed, ref } from "vue";

import { failureFromUnknown, requestPasswordReset } from "../api";
import type { AuthFailure } from "../api";
import type { DocumentType } from "../types";
import { useRateLimitCountdown } from "../useRateLimitCountdown";
import AuthAlert from "./AuthAlert.vue";
import DocumentNumberField from "./DocumentNumberField.vue";
import DocumentTypeSelector from "./DocumentTypeSelector.vue";

/**
 * Paso 1: solicitar enlace de recuperación.
 * Anti-enumeración (§3.5): el mensaje de éxito es idéntico exista o no
 * la cuenta. El enfriamiento (60 s) lo impone el backend con 429.
 */
const documentType = ref<DocumentType>("CC");
const documentNumber = ref("");
const busy = ref(false);
const sent = ref(false);
const failure = ref<AuthFailure | null>(null);

const fields = computed(() =>
  failure.value?.kind === "validation" ? (failure.value.fields ?? {}) : {},
);

const { remaining } = useRateLimitCountdown(() => failure.value);

const alert = computed(() => {
  const current = failure.value;
  if (!current || current.kind === "validation") return null;
  if (current.kind === "rate-limited") {
    return {
      variant: "info" as const,
      title: "Demasiados intentos",
      message: `Ya pediste un enlace hace poco. Espera ${remaining.value} segundos e intenta de nuevo.`,
      correlationId: current.correlationId,
    };
  }
  return {
    variant: "error" as const,
    title: "No pudimos procesar tu solicitud",
    message: current.message,
    correlationId: current.correlationId,
  };
});

async function onSubmit(): Promise<void> {
  if (busy.value) return;
  busy.value = true;
  failure.value = null;
  try {
    await requestPasswordReset({
      documentType: documentType.value,
      documentNumber: documentNumber.value,
    });
    sent.value = true;
  } catch (error) {
    failure.value = failureFromUnknown(error);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <form novalidate @submit.prevent="onSubmit">
    <div class="flex flex-col gap-4">
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

      <button
        class="w-full min-h-[50px] rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-display text-base font-bold shadow-sm transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-secondary cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        :disabled="busy"
        :aria-busy="busy"
      >
        <span>{{ busy ? "Enviando enlace…" : "Enviar enlace de recuperación" }}</span>
      </button>

      <AuthAlert
        v-if="alert"
        :variant="alert.variant"
        :title="alert.title"
        :message="alert.message"
        :correlation-id="alert.correlationId"
      />

      <div
        v-if="sent && !alert"
        role="status"
        class="rounded-2xl border border-accent/25 bg-gradient-to-b from-accent/5 to-white p-5 sm:p-6 flex flex-col gap-4"
      >
        <div class="flex items-center gap-3">
          <span
            class="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3.5 7l8.5 6 8.5-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <p class="font-display font-bold text-base text-primary">
            Revisa tu correo
          </p>
        </div>
        <ul class="flex flex-col gap-2 font-body text-sm text-content">
          <li class="flex items-start gap-2">
            <span class="text-accent font-bold" aria-hidden="true">•</span>
            <span>Si tus datos corresponden a una cuenta activa, te enviamos un correo con el enlace.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-accent font-bold" aria-hidden="true">•</span>
            <span>Revisa tu bandeja y spam.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-accent font-bold" aria-hidden="true">•</span>
            <span>El enlace vence en 30 minutos y solo sirve una vez.</span>
          </li>
        </ul>
        <button
          class="w-full sm:w-auto min-h-[48px] px-6 rounded-xl border-2 border-accent/30 text-accent font-display font-bold text-sm hover:border-accent hover:bg-accent/5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-70"
          type="submit"
          :disabled="busy"
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
              d="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 00-14-3M4 16a8 8 0 0014 3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>Solicitar otro enlace</span>
        </button>
      </div>
    </div>
  </form>
</template>
