<script setup lang="ts">
// Sección de autorizaciones: lista real del backend + descarga de PDF.
// Filtros aún estáticos (TODO: emitir el cambio y filtrar en la query).
// TODO(profile): `notify` (envío por correo) no tiene botón en el diseño.
import type {
  AuthorizationFilter,
  AuthorizationStatus,
  AuthorizationView,
} from "~/features/home-page/types";

interface Props {
  items: AuthorizationView[];
  activeFilter?: AuthorizationFilter;
  isPending?: boolean;
  error?: string | null;
  /** Aviso transitorio (p. ej. "Preparando tu PDF…"). */
  notice?: string | null;
}

withDefaults(defineProps<Props>(), {
  activeFilter: "todas",
  isPending: false,
  error: null,
  notice: null,
});

defineEmits<{
  (e: "download-pdf", authorizationId: string): void;
}>();

const filters: { value: AuthorizationFilter; label: string }[] = [
  { value: "todas", label: "Todos" },
  { value: "en-proceso", label: "En proceso" },
  { value: "aprobada", label: "Aprobada" },
  { value: "rechazada", label: "Rechazada" },
];

const statusLabel: Record<AuthorizationStatus, string> = {
  aprobada: "Aprobada",
  "en-proceso": "En proceso",
  rechazada: "Rechazada",
};

const cardClasses: Record<AuthorizationStatus, string> = {
  aprobada: "bg-emerald-50/40 border-emerald-300/80",
  "en-proceso": "bg-amber-50/40 border-amber-300",
  rechazada: "bg-rose-50/40 border-rose-300",
};

const badgeClasses: Record<AuthorizationStatus, string> = {
  aprobada: "bg-emerald-600 text-white",
  "en-proceso": "bg-amber-500 text-slate-900",
  rechazada: "bg-rose-600 text-white",
};

const dividerClasses: Record<AuthorizationStatus, string> = {
  aprobada: "border-emerald-200/60",
  "en-proceso": "border-amber-200",
  rechazada: "border-rose-200",
};

const statusIcon: Record<AuthorizationStatus, string> = {
  aprobada: "ph:check-circle",
  "en-proceso": "ph:hourglass-medium",
  rechazada: "ph:x-circle",
};
</script>

<template>
  <section
    aria-labelledby="autorizaciones-title"
    class="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100"
  >
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4"
    >
      <div>
        <div class="flex items-center gap-2">
          <div
            aria-hidden="true"
            class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center"
          >
            <Icon name="ph:shield-check" class="text-xl" />
          </div>
          <h2
            id="autorizaciones-title"
            class="text-xl font-bold text-slate-900 tracking-tight font-display"
          >
            Autorizaciones Médicas
          </h2>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">
          Consulta, descarga de PDF y notificación de órdenes autorizadas
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          class="text-xs font-semibold text-kenko-primary hover:text-kenko-accent flex items-center gap-1 transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 rounded"
          type="button"
        >
          Ver historial completo
          <Icon name="ph:arrow-right" class="text-xs" aria-hidden="true" />
        </button>
      </div>
    </div>

    <p
      v-if="notice"
      role="status"
      class="text-xs text-slate-700 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 mb-4"
    >
      {{ notice }}
    </p>

    <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtro por estado">
        <span class="text-xs text-slate-500 font-medium mr-1">Filtro por estado:</span>
        <button
          v-for="filter in filters"
          :key="filter.value"
          :aria-current="filter.value === activeFilter"
          :class="filter.value === activeFilter
            ? 'bg-slate-900 text-white font-bold shadow-xs'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium'"
          class="px-2.5 py-1 text-xs rounded-lg transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          type="button"
        >
          {{ filter.label }}
        </button>
      </div>
      <span class="text-xs text-slate-400">
        {{ items.length }} {{ items.length === 1 ? "autorización registrada" : "autorizaciones registradas" }}
      </span>
    </div>

    <!-- Estado de carga -->
    <div v-if="isPending" role="status" class="grid grid-cols-1 md:grid-cols-3 gap-5 animate-pulse">
      <span class="sr-only">Cargando autorizaciones…</span>
      <div class="h-64 rounded-xl bg-slate-100" />
      <div class="h-64 rounded-xl bg-slate-100" />
      <div class="h-64 rounded-xl bg-slate-100" />
    </div>

    <!-- Estado de error -->
    <p v-else-if="error" role="alert" class="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4">
      {{ error }}
    </p>

    <!-- Estado vacío -->
    <p v-else-if="items.length === 0" class="text-sm text-slate-500">
      No hay autorizaciones registradas para este filtro.
    </p>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <article
        v-for="item in items"
        :key="item.id"
        :class="cardClasses[item.status]"
        class="border-2 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition"
      >
        <div>
          <div class="flex items-center justify-between mb-2.5">
            <span
              :class="badgeClasses[item.status]"
              class="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-0.5 rounded-full shadow-xs"
            >
              <Icon :name="statusIcon[item.status]" aria-hidden="true" />
              {{ statusLabel[item.status] }}
            </span>
            <span class="text-[11px] text-slate-500 font-medium">{{ item.dateLabel }}</span>
          </div>
          <div class="flex items-center gap-1.5 mb-1">
            <span
              class="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold"
              :class="{
                'text-emerald-800 bg-emerald-100': item.status === 'aprobada',
                'text-amber-800 bg-amber-100': item.status === 'en-proceso',
                'text-rose-800 bg-rose-100': item.status === 'rechazada',
              }"
            >
              {{ item.code }}
            </span>
          </div>
          <h3 class="text-sm font-bold text-slate-900 leading-snug">{{ item.title }}</h3>
          <p v-if="item.description" class="text-xs text-slate-600 mt-0.5">
            {{ item.description }}
          </p>
          <p v-if="item.status === 'rechazada'" class="text-xs text-rose-700 font-medium mt-0.5">
            Motivo: {{ item.rejectionReason }}
            <span v-if="item.rejectionCode" class="font-mono text-[10px]">
              ({{ item.rejectionCode }})
            </span>
          </p>
          <dl
            :class="dividerClasses[item.status]"
            class="mt-3 pt-2.5 border-t text-xs space-y-1 text-slate-600"
          >
            <div class="flex justify-between">
              <dt class="text-slate-500">Código:</dt>
              <dd class="font-mono font-bold text-slate-800" :title="item.id">{{ item.shortId }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500">Médico:</dt>
              <dd class="font-medium text-slate-800">{{ item.doctorName }}</dd>
            </div>
          </dl>
        </div>
        <div class="mt-4 pt-3 flex items-center gap-2">
          <button
            :class="item.status === 'aprobada'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white focus-visible:outline-emerald-600'
              : item.status === 'rechazada'
                ? 'bg-rose-600 hover:bg-rose-700 text-white focus-visible:outline-rose-600'
                : 'bg-white hover:bg-amber-100/60 text-slate-800 border border-amber-300 focus-visible:outline-amber-500'"
            class="flex-1 py-2 px-2.5 text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
            :title="`GET /authorizations/${item.id}/pdf`"
            type="button"
            @click="$emit('download-pdf', item.id)"
          >
            <Icon
              name="ph:download-simple"
              class="text-sm font-bold"
              :class="item.status === 'en-proceso' ? 'text-amber-700' : ''"
              aria-hidden="true"
            />
            Descargar PDF
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
