<script setup lang="ts">
import { computed, reactive, ref } from "vue";

import { useRegisterStore, type RegisterStep } from "../registerStore";
import type { DocumentType, Gender } from "../types";
import { useRateLimitCountdown } from "../useRateLimitCountdown";
import AuthAlert from "./AuthAlert.vue";
import ContactFields from "./ContactFields.vue";
import DocumentNumberField from "./DocumentNumberField.vue";
import DocumentTypeSelector from "./DocumentTypeSelector.vue";
import PersonalFields from "./PersonalFields.vue";
import SecurityFields from "./SecurityFields.vue";

/**
 * Wizard de registro: 4 pasos con validación por paso.
 * Guarda cada paso en el store al continuar; el borrador vive en memoria.
 */
const store = useRegisterStore();

const documentType = ref<DocumentType>("CC");
const documentNumber = ref("");
const personal = reactive({
  firstName: "",
  lastName: "",
  birthDate: "",
  gender: "" as Gender | "",
});
const contact = reactive({ email: "", phone: "", addressLine: "", city: "" });
const security = reactive({
  password: "",
  confirmPassword: "",
  ley1581: false,
  notifications: true,
});

const busy = computed(() => store.submitting);
const fields = computed(() => store.stepFields);

const STEP_META: Record<RegisterStep, { title: string; hint: string }> = {
  1: {
    title: "Tipo y Número de Identificación",
    hint: "Selecciona el tipo de documento expedido oficialmente en Colombia.",
  },
  2: {
    title: "Datos Personales Básicos",
    hint: "Nombres y datos biográficos tal como aparecen en tu documento oficial.",
  },
  3: {
    title: "Contacto y Ubicación de Residencia",
    hint: "Para asignación de IPS primaria y envío de órdenes médicas electrónicas.",
  },
  4: {
    title: "Seguridad y Consentimiento Legal",
    hint: "Crea tu clave de acceso y autoriza el manejo de tus datos.",
  },
};

/** Cuenta regresiva visible del 429. */
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
  if (failure.kind === "register-conflict") {
    return {
      variant: "error" as const,
      title: "No pudimos crear tu cuenta",
      message: failure.message,
      correlationId: failure.correlationId,
    };
  }
  return {
    variant: "error" as const,
    title: "Tuvimos un problema",
    message: failure.message,
    correlationId: failure.correlationId,
  };
});

function currentValues(): Record<string, unknown> {
  switch (store.currentStep) {
    case 1:
      return { documentType: documentType.value, documentNumber: documentNumber.value };
    case 2:
      return { ...personal };
    case 3:
      return { ...contact };
    case 4:
      return { ...security };
  }
}

/** Guarda el paso actual; lo usa Continuar y el stepper al saltar. */
function saveCurrent(): boolean {
  return store.updateStep(store.currentStep, currentValues()).ok;
}

function onContinue(): void {
  if (!saveCurrent()) return;
  if (store.currentStep < 4) {
    store.next();
  } else {
    void store.submit();
  }
}

/** El stepper llama aquí: guarda lo digitado y luego navega. */
function goToStep(target: RegisterStep): void {
  saveCurrent();
  store.goToStep(target);
}

defineExpose({ goToStep });
</script>

<template>
  <div class="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-4 sm:p-8">
    <div class="flex items-center gap-3 pb-5 mb-6 border-b border-zinc-100">
      <div>
        <h2 class="text-primary font-display font-bold text-xl">
          {{ STEP_META[store.currentStep].title }}
        </h2>
        <p class="text-zinc-600 text-sm">
          {{ STEP_META[store.currentStep].hint }}
        </p>
      </div>
    </div>

    <form novalidate @submit.prevent="onContinue">
      <div v-if="store.currentStep === 1" class="flex flex-col gap-4">
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
        <p class="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 text-content text-xs sm:text-sm">
          <strong class="block mb-0.5 text-primary">Validación Registraduría / ADRES</strong>
          Los datos se cotejan de forma segura con la base nacional BDUA para
          garantizar la validez de tu cobertura en salud.
        </p>
      </div>

      <PersonalFields
        v-if="store.currentStep === 2"
        v-model:first-name="personal.firstName"
        v-model:last-name="personal.lastName"
        v-model:birth-date="personal.birthDate"
        v-model:gender="personal.gender"
        :errors="fields"
        :disabled="busy"
      />

      <ContactFields
        v-if="store.currentStep === 3"
        v-model:email="contact.email"
        v-model:phone="contact.phone"
        v-model:address-line="contact.addressLine"
        v-model:city="contact.city"
        :errors="fields"
        :disabled="busy"
      />

      <SecurityFields
        v-if="store.currentStep === 4"
        v-model:password="security.password"
        v-model:confirm-password="security.confirmPassword"
        v-model:ley1581="security.ley1581"
        v-model:notifications="security.notifications"
        :errors="fields"
        :disabled="busy"
      />

      <AuthAlert
        v-if="alert"
        class="mt-4"
        :variant="alert.variant"
        :title="alert.title"
        :message="alert.message"
        :correlation-id="alert.correlationId"
      />

      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-4 border-t border-zinc-200">
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <button
            v-if="store.currentStep > 1"
            class="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-xl bg-zinc-100 text-content font-display font-semibold text-sm hover:bg-zinc-200 transition-colors items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-70"
            type="button"
            :disabled="busy"
            @click="store.prev()"
          >
            Volver al paso anterior
          </button>
          <NuxtLink
            class="w-full sm:w-auto text-center font-display font-semibold text-sm text-accent hover:underline px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary rounded"
            to="/iniciar-sesion"
          >
            ¿Ya tienes cuenta? Iniciar sesión
          </NuxtLink>
        </div>
        <button
          class="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-display text-base font-bold shadow-sm transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-secondary disabled:opacity-70"
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
          <span>
            {{
              busy
                ? "Creando tu cuenta…"
                : store.currentStep === 4
                  ? "Crear mi cuenta"
                  : "Continuar"
            }}
          </span>
        </button>
      </div>
    </form>
  </div>
</template>
