<script setup lang="ts">
// Tarjeta de certificados: recibe los documentos por props (maqueta sin lógica).
// TODO(profile): recibir datos de useCertificatesQuery() y cablear las
// descargas con los helpers de la feature profile.
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
</script>

<template>
  <section
    aria-labelledby="certificados-title"
    class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
  >
    <h2 id="certificados-title" class="sr-only">Certificados y documentos</h2>

    <!-- Estado de carga -->
    <div v-if="isPending" role="status" class="grid grid-cols-1 gap-3 pt-1 animate-pulse">
      <span class="sr-only">Cargando certificados…</span>
      <div class="h-48 rounded-xl bg-slate-100" />
      <div class="h-40 rounded-xl bg-slate-100" />
    </div>

    <!-- Estado de error -->
    <p v-else-if="error" role="alert" class="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4">
      No se pudieron cargar los certificados. Inténtalo de nuevo más tarde.
    </p>

    <div v-else class="grid grid-cols-1 gap-3 pt-1">
      <!-- Certificado de afiliación -->
      <div
        v-if="certificate"
        class="p-3.5 bg-slate-50/80 hover:bg-emerald-50/40 rounded-xl border border-slate-200 transition flex flex-col justify-between"
      >
        <div class="flex items-start justify-between gap-2 mb-2">
          <div>
            <span
              class="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-100/90 px-1.5 py-0.5 rounded"
            >
              POST /certificates
            </span>
            <h3 class="text-xs md:text-sm font-bold text-slate-900 mt-1 font-display">
              Certificado Afiliación
            </h3>
            <p class="text-[11px] text-slate-500">
              PDF o entrega directa por correo registrado
            </p>
          </div>
          <div
            aria-hidden="true"
            class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0"
          >
            <Icon name="ph:file-pdf" class="text-lg" />
          </div>
        </div>

        <dl
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
            class="flex-1 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            type="button"
          >
            <Icon name="ph:download-simple" class="text-sm" aria-hidden="true" />
            Descargar PDF
          </button>
          <button
            aria-label="Enviar certificado por correo"
            class="py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            title="Enviar por correo"
            type="button"
          >
            <Icon name="ph:arrow-right" class="text-sm" aria-hidden="true" />
          </button>
        </div>
      </div>

      <!-- Historial médico -->
      <div
        v-if="history"
        class="p-3.5 bg-slate-50/80 hover:bg-blue-50/40 rounded-xl border border-slate-200 transition flex flex-col justify-between"
      >
        <div class="flex items-start justify-between gap-2 mb-2">
          <div>
            <span
              class="text-[10px] font-mono text-blue-600 font-semibold bg-blue-100 px-1.5 py-0.5 rounded"
            >
              POST /medical-history
            </span>
            <h3 class="text-xs md:text-sm font-bold text-slate-900 mt-1 font-display">
              Historial Médico
            </h3>
            <p class="text-[11px] text-slate-500">Consolidado general clínico</p>
          </div>
          <div
            aria-hidden="true"
            class="w-8 h-8 rounded-lg bg-kenko-primary text-white flex items-center justify-center shrink-0"
          >
            <Icon name="ph:file-text" class="text-lg" />
          </div>
        </div>

        <dl
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
            class="w-full py-2 px-2.5 bg-kenko-primary hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
            type="button"
          >
            <Icon name="ph:download-simple" class="text-sm" aria-hidden="true" />
            Descargar Historial
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
