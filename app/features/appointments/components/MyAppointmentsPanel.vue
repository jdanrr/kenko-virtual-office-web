<script setup lang="ts">
// Panel lateral "Tus citas confirmadas": se usa en agendar y en reprogramar.
// Basado en el aside de stitch-referencia/agendar-con.resultados.html.
import type { AppointmentResponse } from "../types";
import { appointmentTitle, formatAppointmentDate } from "../citasView";

interface Props {
  appointments: AppointmentResponse[];
  pending?: boolean;
  error?: string | null;
}

withDefaults(defineProps<Props>(), { pending: false, error: null });
const emit = defineEmits<{
  reschedule: [appointment: AppointmentResponse];
  cancel: [appointment: AppointmentResponse];
}>();
</script>

<template>
  <aside class="bg-white rounded-xl p-5 shadow-md border-2 border-primary/20 relative overflow-hidden flex flex-col gap-4">
    <div class="absolute top-0 left-0 right-0 h-1.5 bg-primary" />

    <div class="flex items-center gap-2 pb-3 border-b border-slate-100">
      <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
        <Icon name="ph:notebook" class="text-lg" />
      </div>
      <div>
        <h2 class="text-sm text-primary font-bold leading-tight font-display">Tus citas confirmadas</h2>
        <p class="text-[11px] text-slate-500">
          {{ appointments.length === 0 ? "Sin citas por ahora" : `${appointments.length} ${appointments.length === 1 ? "cita activa" : "citas activas"}` }}
        </p>
      </div>
    </div>

    <div v-if="pending" class="space-y-3 animate-pulse" role="status" aria-label="Cargando tus citas">
      <div class="h-20 rounded-xl bg-slate-100" />
      <div class="h-20 rounded-xl bg-slate-100" />
    </div>

    <p v-else-if="error" role="alert" class="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
      {{ error }}
    </p>

    <div v-else-if="appointments.length === 0" class="text-center py-6 px-2 bg-slate-50 rounded-xl border border-slate-200">
      <div class="w-12 h-12 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
        <Icon name="ph:calendar-plus" class="text-2xl" />
      </div>
      <p class="text-sm font-bold text-slate-900">No tienes citas programadas</p>
      <p class="text-xs text-slate-500 mt-1">Busca un turno libre y agéndalo aquí mismo.</p>
    </div>

    <ul v-else class="space-y-3">
      <li
        v-for="a in appointments"
        :key="a.appointmentId"
        class="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col gap-2"
      >
        <p class="text-xs font-bold text-slate-900">{{ appointmentTitle(a) }}</p>
        <p class="text-[11px] text-slate-600">{{ formatAppointmentDate(a) }}</p>
        <p class="text-[11px] text-slate-500">{{ a.physician.name }} · {{ a.medicalCenter.name }}</p>
        <div class="flex items-center gap-2 pt-1">
          <button
            type="button"
            class="flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg bg-white border border-amber-300 text-slate-700 hover:bg-amber-50 transition flex items-center justify-center gap-1"
            @click="emit('reschedule', a)"
          >
            <Icon name="ph:arrows-clockwise" />
            <span>Reagendar</span>
          </button>
          <button
            type="button"
            class="py-1.5 px-2 text-[11px] font-bold rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-rose-700 hover:border-rose-200 transition"
            title="Cancelar cita"
            @click="emit('cancel', a)"
          >
            <Icon name="ph:x-circle" />
          </button>
        </div>
      </li>
    </ul>

    <NuxtLink
      to="/citas"
      class="text-[11px] text-accent hover:underline text-center"
    >
      Ir a agendar una cita
    </NuxtLink>
  </aside>
</template>
