<script setup lang="ts">
// Filtros de búsqueda. Especialidad/centro/médico/fecha van al back;
// franja horaria (mañana/tarde/noche) se filtra aquí en el front porque el back no la tiene.
import type { MedicalCenter, Physician } from "../types";
import type { CitasViewFilters, DayPart } from "../citasView";
import { APPOINTMENT_TYPE_LABEL } from "../citasView";

interface Props {
  modelValue: CitasViewFilters;
  centers: MedicalCenter[];
  physicians: Physician[];
  pending?: boolean;
}

const props = withDefaults(defineProps<Props>(), { pending: false });
const emit = defineEmits<{
  "update:modelValue": [v: CitasViewFilters];
  search: [];
  clear: [];
}>();

function patch(p: Partial<CitasViewFilters>) {
  emit("update:modelValue", { ...props.modelValue, page: 1, ...p });
}

const quickRanges = [
  { id: "hoy", label: "Hoy" },
  { id: "manana", label: "Mañana" },
  { id: "semana", label: "Esta semana" },
  { id: "mes", label: "Este mes" },
  { id: "todas", label: "Todas" },
] as const;

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function applyQuick(id: string) {
  const now = new Date();
  if (id === "hoy") patch({ dateFrom: toISO(now), dateTo: toISO(now) });
  else if (id === "manana") {
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    patch({ dateFrom: toISO(t), dateTo: toISO(t) });
  }
  else if (id === "semana") {
    const end = new Date(now);
    end.setDate(end.getDate() + 7);
    patch({ dateFrom: toISO(now), dateTo: toISO(end) });
  }
  else if (id === "mes") {
    const end = new Date(now);
    end.setDate(end.getDate() + 30);
    patch({ dateFrom: toISO(now), dateTo: toISO(end) });
  }
  else patch({ dateFrom: "", dateTo: "" });
}

const dayParts: { id: DayPart; label: string }[] = [
  { id: "manana", label: "Mañana (<12:00)" },
  { id: "tarde", label: "Tarde (12:00-18:00)" },
  { id: "noche", label: "Noche (>18:00)" },
  { id: "todas", label: "Todas" },
];
</script>

<template>
  <section class="bg-white rounded-xl p-5 shadow-md border-2 border-primary/20 relative overflow-hidden mb-6">
    <div class="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
    <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
      <h2 class="text-primary font-bold font-display flex items-center gap-2">
        <Icon name="ph:funnel" />
        Parámetros de búsqueda
      </h2>
      <span class="text-[11px] font-semibold text-slate-600">Máxima anticipación: 90 días naturales</span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <label class="flex flex-col gap-1 text-sm">
        <span class="font-semibold text-slate-800">Especialidad / Servicio</span>
        <select
          :value="modelValue.type"
          class="border-2 border-slate-200 rounded-lg px-3 py-2 text-sm"
          @change="patch({ type: ($event.target as HTMLSelectElement).value as CitasViewFilters['type'] })"
        >
          <option value="">Todas las especialidades</option>
          <option v-for="(label, key) in APPOINTMENT_TYPE_LABEL" :key="key" :value="key">{{ label }}</option>
        </select>
      </label>

      <label class="flex flex-col gap-1 text-sm">
        <span class="font-semibold text-slate-800">Centro médico / Sede</span>
        <select
          :value="modelValue.medicalCenterId"
          class="border-2 border-slate-200 rounded-lg px-3 py-2 text-sm"
          @change="patch({ medicalCenterId: ($event.target as HTMLSelectElement).value })"
        >
          <option value="">Todas las sedes</option>
          <option v-for="c in centers" :key="c.medicalCenterId" :value="c.medicalCenterId">
            {{ c.name }} — {{ c.location }}
          </option>
        </select>
      </label>

      <label class="flex flex-col gap-1 text-sm">
        <span class="font-semibold text-slate-800">Profesional de la salud</span>
        <select
          :value="modelValue.physicianId"
          class="border-2 border-slate-200 rounded-lg px-3 py-2 text-sm"
          @change="patch({ physicianId: ($event.target as HTMLSelectElement).value })"
        >
          <option value="">Cualquier médico disponible</option>
          <option v-for="p in physicians" :key="p.physicianId" :value="p.physicianId">
            {{ p.firstName }} {{ p.lastName }} ({{ APPOINTMENT_TYPE_LABEL[p.specialty] ?? p.specialty }})
          </option>
        </select>
      </label>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div class="flex gap-3">
        <label class="flex-1 flex flex-col gap-1 text-sm">
          <span class="font-semibold text-slate-800">Desde</span>
          <input
            type="date"
            :value="modelValue.dateFrom"
            class="border-2 border-slate-200 rounded-lg px-3 py-2 text-sm"
            @change="patch({ dateFrom: ($event.target as HTMLInputElement).value })"
          />
        </label>
        <label class="flex-1 flex flex-col gap-1 text-sm">
          <span class="font-semibold text-slate-800">Hasta</span>
          <input
            type="date"
            :value="modelValue.dateTo"
            class="border-2 border-slate-200 rounded-lg px-3 py-2 text-sm"
            @change="patch({ dateTo: ($event.target as HTMLInputElement).value })"
          />
        </label>
      </div>
      <div class="flex flex-col gap-1 text-sm">
        <span class="font-semibold text-slate-800">Franja horaria (filtro local)</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="d in dayParts"
            :key="d.id"
            type="button"
            class="px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer"
            :class="modelValue.dayPart === d.id ? 'bg-primary text-on-primary border-primary' : 'bg-white border-slate-200 text-slate-600 hover:border-primary/40'"
            @click="patch({ dayPart: d.id })"
          >
            {{ d.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-2 mt-4">
      <span class="text-xs font-semibold text-slate-600 self-center">Búsqueda rápida:</span>
      <button
        v-for="q in quickRanges"
        :key="q.id"
        type="button"
        class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
        @click="applyQuick(q.id)"
      >
        {{ q.label }}
      </button>
    </div>

    <div class="flex flex-col sm:flex-row gap-3 mt-5">
      <button
        type="button"
        class="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
        @click="emit('clear')"
      >
        Limpiar filtros
      </button>
      <button
        type="button"
        :disabled="pending"
        class="flex-1 px-4 py-2.5 rounded-xl bg-secondary hover:bg-amber-400 text-slate-900 text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        @click="emit('search')"
      >
        <Icon v-if="pending" name="ph:circle-notch" class="animate-spin" />
        <Icon v-else name="ph:magnifying-glass" />
        {{ pending ? "Buscando…" : "Buscar turnos" }}
      </button>
    </div>
  </section>
</template>
