<script setup lang="ts">
// Tarjeta de certificados: genera los documentos bajo demanda.
// Generar ES enviar: el backend crea el PDF, lo sube a S3 y publica el
// evento que dispara el correo al email registrado (sin endpoint aparte).
import type {
  AffiliationCertificateView,
  MedicalHistorySummaryView,
} from "~/features/home-page/types";

interface Props {
  certificate: AffiliationCertificateView | null;
  history: MedicalHistorySummaryView | null;
  isPending?: boolean;
  error?: string | null;
}

withDefaults(defineProps<Props>(), { isPending: false, error: null });

defineEmits<{
  (e: "generate-certificate" | "generate-history"): void;
}>();
</script>

<template>
  <section
    aria-labelledby="certificados-title"
    class="bg-white rounded-2xl p-5 shadow-sm border border-content/10"
  >
    <h2 id="certificados-title" class="sr-only">Certificados y documentos</h2>

    <!-- Estado de carga -->
    <div v-if="isPending" role="status" class="grid grid-cols-1 gap-3 pt-1 animate-pulse">
      <span class="sr-only">Generando documento…</span>
      <div class="h-48 rounded-xl bg-content/10" />
      <div class="h-40 rounded-xl bg-content/10" />
    </div>

    <div v-else class="grid grid-cols-1 gap-3 pt-1">
      <!-- El aviso de error no oculta los botones: reintentar es la acción. -->
      <p v-if="error" role="alert" class="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4">
        {{ error }}
      </p>
      <!-- Certificado de afiliación -->
      <div
        class="p-4 bg-background rounded-xl border border-content/10 transition-colors flex flex-col justify-between"
      >
        <div class="flex items-start justify-between gap-3 mb-2.5">
          <div>
            <h3 class="text-[15px] md:text-base font-extrabold text-content mt-1 font-display">
              Certificado Afiliación
            </h3>
            <p class="text-[13px] font-medium text-content/70">
              Se genera bajo demanda y llega a tu correo registrado
            </p>
          </div>
          <div
            aria-hidden="true"
            class="w-10 h-10 rounded-xl bg-emerald-700 text-on-primary flex items-center justify-center shrink-0"
          >
            <Icon name="ph:file-pdf" class="text-xl" />
          </div>
        </div>

        <p v-if="!certificate && !isPending && !error" class="text-[13px] text-content/70 mb-2.5">
          Aún no has generado tu certificado. Usa el botón para crearlo.
        </p>

        <p
          v-if="certificate && !isPending && !error"
          role="status"
          class="text-[13px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-2.5"
        >
          ¡Listo! Tu certificado fue generado y enviado a tu correo registrado.
        </p>

        <dl
          v-if="certificate"
          class="bg-white rounded-xl p-3 border border-content/10 text-[13px] space-y-1.5 mb-3 text-content"
        >
          <div class="flex justify-between">
            <dt class="font-semibold text-content/60">ID:</dt>
            <dd class="font-mono font-bold text-content">{{ certificate.id }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="font-semibold text-content/60">Emisión:</dt>
            <dd class="font-semibold text-content">{{ certificate.issuedLabel }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="font-semibold text-content/60">Afiliado:</dt>
            <dd class="font-semibold text-emerald-700">{{ certificate.memberSinceLabel }}</dd>
          </div>
        </dl>

        <div class="flex items-center gap-2">
          <button
            class="flex-1 min-h-11 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
            type="button"
            @click="$emit('generate-certificate')"
          >
            <Icon name="ph:download-simple" class="text-base" aria-hidden="true" />
            Generar certificado
          </button>
        </div>
      </div>

      <!-- Historial médico -->
      <div
        class="p-4 bg-background rounded-xl border border-content/10 transition-colors flex flex-col justify-between"
      >
        <div class="flex items-start justify-between gap-3 mb-2.5">
          <div>
            <h3 class="text-[15px] md:text-base font-extrabold text-content mt-1 font-display">
              Historial Médico
            </h3>
            <p class="text-[13px] font-medium text-content/70">Consolidado general clínico (llega a tu correo registrado)</p>
          </div>
          <div
            aria-hidden="true"
            class="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0"
          >
            <Icon name="ph:file-text" class="text-xl" />
          </div>
        </div>

        <p v-if="!history && !isPending && !error" class="text-[13px] text-content/70 mb-2.5">
          Aún no has generado tu historial. Usa el botón para crearlo.
        </p>

        <p
          v-if="history && !isPending && !error"
          role="status"
          class="text-[13px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-2.5"
        >
          ¡Listo! Tu historial fue generado y enviado a tu correo registrado.
        </p>

        <dl
          v-if="history"
          class="bg-white rounded-xl p-3 border border-content/10 text-[13px] space-y-1.5 mb-3 text-content"
        >
          <div class="flex justify-between">
            <dt class="font-semibold text-content/60">Registros:</dt>
            <dd
              class="font-bold text-content bg-content/10 px-2 py-0.5 rounded-md"
            >
              {{ history.recordsLabel }}
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="font-semibold text-content/60">Actualizado:</dt>
            <dd class="font-semibold text-content">{{ history.updatedLabel }}</dd>
          </div>
        </dl>

        <div class="flex items-center gap-2">
          <button
            class="w-full min-h-11 py-2.5 px-3 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
            type="button"
            @click="$emit('generate-history')"
          >
            <Icon name="ph:download-simple" class="text-base" aria-hidden="true" />
            Generar historial
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
