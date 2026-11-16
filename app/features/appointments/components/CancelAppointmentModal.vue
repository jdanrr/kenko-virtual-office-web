<script setup lang="ts">
// Pop-up rojo de confirmación para cancelar. Basado en stitch-referencia/popup-cancelar.html.
import type { Appointment } from "../types";
import { appointmentTitle, formatAppointmentDate } from "../types";

interface Props {
  appointment: Appointment | null;
  pending?: boolean;
}

defineProps<Props>();
const emit = defineEmits<{ close: []; confirm: [] }>();
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="presentation"
      @click.self="emit('close')"
    >
      <div
        class="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border-2 border-slate-200 overflow-hidden relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div class="h-1.5 w-full bg-gradient-to-r from-red-500 via-amber-400 to-red-500" />

        <div class="p-6">
          <button
            type="button"
            aria-label="Cerrar modal"
            class="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            @click="emit('close')"
          >
            <Icon name="ph:x" class="text-xl" />
          </button>

          <div class="flex items-start gap-4 mb-4">
            <div class="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0 text-red-600">
              <Icon name="ph:calendar-x" class="text-2xl" />
            </div>
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-red-700 bg-red-100/70 px-2 py-0.5 rounded-md inline-block mb-1">
                Acción irreversible
              </span>
              <h2 id="modal-title" class="text-xl font-extrabold text-slate-900 leading-tight font-display">
                ¿Está seguro de cancelar esta cita?
              </h2>
            </div>
          </div>

          <p class="text-sm text-slate-600 leading-relaxed mb-5">
            Al confirmar, tu turno se liberará inmediatamente y quedará disponible para otro afiliado de Kenko EPS.
          </p>

          <div v-if="appointment" class="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 space-y-2.5">
            <div class="flex items-center justify-between pb-2 border-b border-slate-200">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Detalle de la cita</span>
              <span class="text-[11px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                Ref: {{ appointment.appointmentId.slice(0, 8).toUpperCase() }}
              </span>
            </div>
            <p class="text-[13px] font-bold text-slate-900 leading-snug">
              {{ appointmentTitle(appointment) }}
            </p>
            <p class="text-xs text-slate-600">{{ appointment.physician.name }}</p>
            <p class="text-xs text-slate-700 font-medium">
              {{ formatAppointmentDate(appointment) }}
            </p>
            <p class="text-xs text-slate-700">
              {{ appointment.medicalCenter.name }} · {{ appointment.medicalCenter.location }}
            </p>
          </div>

          <div class="flex flex-col-reverse sm:flex-row items-center gap-3">
            <button
              type="button"
              :disabled="pending"
              class="w-full sm:flex-1 py-3 px-4 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all disabled:opacity-50"
              @click="emit('close')"
            >
              No, conservar cita
            </button>
            <button
              type="button"
              :disabled="pending"
              class="w-full sm:flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              @click="emit('confirm')"
            >
              <Icon v-if="pending" name="ph:circle-notch" class="animate-spin" />
              <span>{{ pending ? "Cancelando…" : "Sí, cancelar cita" }}</span>
            </button>
          </div>
        </div>

        <div class="bg-slate-50 px-6 py-2.5 border-t border-slate-200 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Icon name="ph:lock" />
          <span>Transacción oficial protegida por Kenko EPS</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>
