<script setup lang="ts">
import { computed, ref } from "vue";

import { useRegisterStore, type RegisterStep } from "../features/auth/registerStore";
import RegisterForm from "../features/auth/components/RegisterForm.vue";
import RegisterStepper from "../features/auth/components/RegisterStepper.vue";
import RegisterSuccessModal from "../features/auth/components/RegisterSuccessModal.vue";
import RegisterSummary from "../features/auth/components/RegisterSummary.vue";

/**
 * Página de registro: wizard en 4 pasos + resumen en vivo + ayuda.
 * Convención del proyecto: rutas de páginas SIEMPRE en español.
 * El borrador vive en memoria (al recargar se empieza de cero).
 */
const store = useRegisterStore();
const formRef = ref<{ goToStep: (step: RegisterStep) => void } | null>(null);
const showModal = ref(true);

const STEP_NAMES: Record<RegisterStep, string> = {
  1: "Documento de Identidad",
  2: "Datos personales",
  3: "Contacto y Residencia",
  4: "Seguridad y Consentimiento",
};

const summaryDocument = computed(() => {
  if (!store.data.documentNumber) return undefined;
  return `${store.data.documentType ?? "CC"} • ${store.data.documentNumber}`;
});

const summaryHolder = computed(() => {
  const name = `${store.data.firstName ?? ""} ${store.data.lastName ?? ""}`.trim();
  return name === "" ? undefined : name;
});

const summaryContact = computed(() => {
  const parts = [store.data.city, store.data.phone].filter(Boolean);
  return parts.length > 0 ? parts.join(" • ") : undefined;
});
</script>

<template>
  <NuxtLayout name="auth">
    <div class="w-full max-w-6xl mx-auto flex flex-col gap-8">
      <div class="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-4 sm:p-6">
        <div class="flex flex-col gap-1 mb-6">
          <div class="flex items-center gap-2 flex-wrap">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary text-content"
            >
              Portal Oficial Afiliación
            </span>
            <span class="text-zinc-500 text-xs font-medium">Normativa SGSSS • Colombia</span>
          </div>
          <h1 class="text-primary font-display font-extrabold text-2xl md:text-3xl tracking-tight">
            Registro de Nuevo Afiliado
          </h1>
          <p aria-live="polite" class="text-zinc-600 text-sm">
            Paso <strong class="text-primary">{{ store.currentStep }}</strong> de 4:
            {{ STEP_NAMES[store.currentStep] }}
          </p>
          <div>
            <button
              class="inline-flex items-center gap-1 font-body text-xs text-accent font-bold rounded py-1 px-1.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
              type="button"
              disabled
              title="Disponible próximamente"
            >
              Guía de Trámites
            </button>
          </div>
        </div>
        <RegisterStepper
          :current-step="store.currentStep"
          :disabled="store.submitting"
          @select="formRef?.goToStep($event)"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div class="lg:col-span-8 flex flex-col">
          <RegisterForm ref="formRef" />
        </div>

        <div class="lg:col-span-4 flex flex-col gap-6">
          <RegisterSummary
            :document="summaryDocument"
            :holder="summaryHolder"
            :contact="summaryContact"
          />
          <aside
            aria-label="Ayuda para el registro"
            class="bg-primary text-on-primary rounded-2xl shadow-sm p-6 flex flex-col gap-4"
          >
            <h2 class="font-display font-bold text-lg">¿Necesitas ayuda?</h2>
            <p class="text-xs sm:text-sm opacity-90">
              Nuestros asesores de afiliación en salud te orientan en cualquier
              punto de tu registro.
            </p>
            <a
              class="flex items-center justify-between p-2.5 rounded-xl bg-white/10 border border-white/10 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-secondary"
              href="tel:018000915500"
            >
              <span class="font-medium text-xs sm:text-sm">Línea Gratuita Nacional</span>
              <span class="font-bold text-secondary text-sm">01 8000 915 500</span>
            </a>
            <div
              class="flex items-center justify-between p-2.5 rounded-xl bg-white/10 border border-white/10 min-h-[48px]"
            >
              <span class="font-medium text-xs sm:text-sm">Bogotá D.C.</span>
              <span class="font-bold text-secondary text-sm">(601) 307 8000</span>
            </div>
          </aside>
        </div>
      </div>
    </div>

    <RegisterSuccessModal
      v-if="store.isSucceeded && showModal && store.result"
      :masked-email="store.result.maskedEmail"
      @close="showModal = false"
    />
  </NuxtLayout>
</template>
