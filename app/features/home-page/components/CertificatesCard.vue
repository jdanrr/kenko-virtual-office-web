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
    class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
  >
    <h2 id="certificados-title" class="sr-only">Certificados y documentos</h2>

    <!-- Estado de carga -->
    <div v-if="isPending" role="status" class="grid grid-cols-1 gap-3 pt-1 animate-pulse">
      <span class="sr-only">Generando documento…</span>
      <div class="h-48 rounded-xl bg-slate-100" />
      <div class="h-40 rounded-xl bg-slate-100" />
    </div>

    <div v-else class="grid grid-cols-1 gap-3 pt-1">
      <!-- El aviso de error no oculta los botones: reintentar es la acción. -->
      <p v-if="error" role="alert" class="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4">
        {{ error }}
      </p>
      <!-- Certificado de afiliación -->
      <div
        class="p-3.5 bg-slate-50/80 hover:bg-emerald-50/40 rounded-xl border border-slate-200 transition flex flex-col justify-between"
      >
        <div class="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 class="text-xs md:text-sm font-bold text-slate-900 mt-1 font-display">
              Certificado Afiliación
            </h3>
            <p class="text-[11px] text-slate-500">
              Se genera bajo demanda y llega a tu correo registrado
            </p>
          </div>
          <div
            aria-hidden="true"
            class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0"
          >
            <Icon name="ph:file-pdf" class="text-lg" />
          </div>
        </div>

        <p v-if="!certificate && !isPending && !error" class="text-[11px] text-slate-500 mb-2.5">
          Aún no has generado tu certificado. Usa el botón para crearlo.
        </p>

        <p
          v-if="certificate && !isPending && !error"
          role="status"
          class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 mb-2.5"
        >
          ¡Listo! Tu certificado fue generado y enviado a tu correo registrado.
        </p>

        <dl
          v-if="certificate"
          class="bg-white rounded-lg p-2 border border-slate-200/80 text-[11px] space-y-1 mb-2.5 text-slate-600"
        >
          <div class="flex justify-between">
            <dt class="text-slate-400 font-mono">ID:</dt>
            <dd class="font-mono font-bold text-slate-800">{{ certificate.id }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-400">Emisión:</dt>
            <dd class="font-medium text-slate-700">{{ certificate.issuedLabel }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-400">Afiliado:</dt>
            <dd class="font-semibold text-emerald-700">{{ certificate.memberSinceLabel }}</dd>
          </div>
        </dl>

        <div class="flex items-center gap-2">
          <button
            class="flex-1 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            type="button"
            @click="$emit('generate-certificate')"
          >
            <Icon name="ph:download-simple" class="text-sm" aria-hidden="true" />
            Generar certificado
          </button>
        </div>
      </div>

      <!-- Historial médico -->
      <div
        class="p-3.5 bg-slate-50/80 hover:bg-blue-50/40 rounded-xl border border-slate-200 transition flex flex-col justify-between"
      >
        <div class="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 class="text-xs md:text-sm font-bold text-slate-900 mt-1 font-display">
              Historial Médico
            </h3>
            <p class="text-[11px] text-slate-500">Consolidado general clínico (llega a tu correo registrado)</p>
          </div>
          <div
            aria-hidden="true"
            class="w-8 h-8 rounded-lg bg-kenko-primary text-white flex items-center justify-center shrink-0"
          >
            <Icon name="ph:file-text" class="text-lg" />
          </div>
        </div>

        <p v-if="!history && !isPending && !error" class="text-[11px] text-slate-500 mb-2.5">
          Aún no has generado tu historial. Usa el botón para crearlo.
        </p>

        <p
          v-if="history && !isPending && !error"
          role="status"
          class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 mb-2.5"
        >
          ¡Listo! Tu historial fue generado y enviado a tu correo registrado.
        </p>

        <dl
          v-if="history"
          class="bg-white rounded-lg p-2 border border-slate-200/80 text-[11px] space-y-1 mb-2.5 text-slate-600"
        >
          <div class="flex justify-between">
            <dt class="text-slate-400">Registros:</dt>
            <dd
              class="font-bold text-slate-800 bg-slate-100 px-1.5 rounded"
            >
              {{ history.recordsLabel }}
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-slate-400">Actualizado:</dt>
            <dd class="font-medium text-slate-700">{{ history.updatedLabel }}</dd>
          </div>
        </dl>

        <div class="flex items-center gap-2">
          <button
            class="w-full py-2 px-2.5 bg-kenko-primary hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
            type="button"
            @click="$emit('generate-history')"
          >
            <Icon name="ph:download-simple" class="text-sm" aria-hidden="true" />
            Generar historial
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
