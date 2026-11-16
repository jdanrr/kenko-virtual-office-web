<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

import { useAuthStore } from "../store";
import { normalizeDocumentNumber } from "../schemas";
import type { DocumentType } from "../types";
import {
  clearRememberedDocument,
  loadRememberedDocument,
  saveRememberedDocument,
} from "../rememberDocument";
import AuthAlert from "./AuthAlert.vue";
import DocumentNumberField from "./DocumentNumberField.vue";
import DocumentTypeSelector from "./DocumentTypeSelector.vue";
import PasswordField from "./PasswordField.vue";

/** Formulario de login: integra átomos + store + recordar documento + 429. */
const store = useAuthStore();

const documentType = ref<DocumentType>("CC");
const documentNumber = ref("");
const password = ref("");
const remember = ref(false);

const busy = computed(() => store.status === "authenticating");
const fields = computed(() =>
  store.lastFailure?.kind === "validation" ? (store.lastFailure.fields ?? {}) : {},
);

/** Cuenta regresiva visible del 429 (el store guarda los segundos totales). */
const remaining = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

function stopTimer(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

watch(
  () => store.lastFailure,
  (failure) => {
    stopTimer();
    if (failure?.kind === "rate-limited" && failure.retryAfterSeconds) {
      remaining.value = failure.retryAfterSeconds;
      timer = setInterval(() => {
        remaining.value -= 1;
        if (remaining.value <= 0) stopTimer();
      }, 1000);
    }
  },
);

onUnmounted(stopTimer);

onMounted(() => {
  const saved = loadRememberedDocument();
  if (saved) {
    documentType.value = saved.documentType;
    documentNumber.value = saved.documentNumber;
    remember.value = true;
  }
});

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
  if (remember.value) {
    saveRememberedDocument({
      documentType: documentType.value,
      documentNumber: normalizeDocumentNumber(documentNumber.value),
    });
  } else {
    clearRememberedDocument();
  }
  await store.logIn({
    documentType: documentType.value,
    documentNumber: documentNumber.value,
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
    <div class="flex justify-end">
      <button
        class="font-body text-xs text-accent font-bold hover:underline rounded py-1 px-1.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        type="button"
        disabled
        title="Disponible próximamente"
      >
        ¿Olvidaste tu contraseña?
      </button>
    </div>

    <div
      class="flex items-center gap-2.5 p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl min-h-[48px]"
    >
      <input
        id="remember-document"
        v-model="remember"
        class="w-5 h-5 rounded text-primary border-zinc-300 focus:ring-secondary cursor-pointer"
        type="checkbox"
        :disabled="busy"
      >
      <label
        for="remember-document"
        class="font-body text-xs sm:text-sm text-zinc-700 cursor-pointer select-none"
      >
        Recordar mi documento en este equipo de confianza
      </label>
    </div>

    <AuthAlert
      v-if="alert"
      :variant="alert.variant"
      :title="alert.title"
      :message="alert.message"
      :correlation-id="alert.correlationId"
    />

    <div class="flex flex-col gap-2.5 pt-1">
      <button
        class="w-full min-h-[50px] rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-display text-base font-bold shadow-sm transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-secondary disabled:opacity-70"
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
