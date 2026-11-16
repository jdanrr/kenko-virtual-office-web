<script setup lang="ts">
// Tarjeta de un turno disponible con botón Agendar.
import type { Appointment } from "../types";
import { appointmentTitle, formatAppointmentDate } from "../types";

interface Props {
  appointment: Appointment;
  pending?: boolean;
  selected?: boolean;
  actionLabel?: string;
}

withDefaults(defineProps<Props>(), { pending: false, selected: false, actionLabel: "Agendar cita" });
const emit = defineEmits<{ action: [appointment: Appointment] }>();
</script>

<template>
  <article
    class="bg-white rounded-xl p-4 border-2 shadow-sm transition flex flex-col gap-3"
    :class="selected ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 hover:border-primary/40'"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon name="ph:calendar-plus" class="text-2xl" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-slate-900 font-display">
            {{ appointmentTitle(appointment) }} · {{ appointment.startTime }} - {{ appointment.endTime }}
          </h3>
          <p class="text-xs text-slate-600 mt-0.5">{{ appointment.physician.name }}</p>
        </div>
      </div>
      <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
        Libre
      </span>
    </div>

    <div class="text-xs text-slate-600 space-y-1">
      <p class="flex items-center gap-1.5">
        <Icon name="ph:calendar-blank" class="text-slate-400" />
        <span class="font-medium">{{ formatAppointmentDate(appointment) }} ({{ appointment.weekday }})</span>
      </p>
      <p class="flex items-center gap-1.5">
        <Icon name="ph:map-pin" class="text-slate-400" />
        <span>{{ appointment.medicalCenter.name }} · {{ appointment.medicalCenter.location }}</span>
      </p>
    </div>

    <button
      type="button"
      :disabled="pending"
      class="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
      @click="emit('action', appointment)"
    >
      <Icon v-if="pending" name="ph:circle-notch" class="animate-spin" />
      <Icon v-else name="ph:calendar-plus" />
      <span>{{ pending ? "Procesando…" : actionLabel }}</span>
    </button>
  </article>
</template>
