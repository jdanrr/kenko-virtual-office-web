<script setup lang="ts">
// Tarjeta de citas médicas: recibe el resumen por props (maqueta sin lógica).
// TODO(appointments): recibir `summary` de useAppointmentsSummaryQuery() y
// cablear reagendar, cancelar y agendar con la feature appointments.
import type {
  AppointmentModality,
  AppointmentsSummaryView,
  AppointmentView,
} from "~/features/home-page/types";

interface Props {
  summary: AppointmentsSummaryView;
  isPending?: boolean;
  error?: string | null;
}

withDefaults(defineProps<Props>(), { isPending: false, error: null });

// Mapeo especialidad → icono (local a home-page según CONTRACTS.md).
function specialtyIcon(appointment: AppointmentView): string {
  if (appointment.specialty === "Odontología") return "ph:tooth";
  if (appointment.specialty === "Psicología") return "ph:brain";
  return "ph:calendar-plus";
}

function modalityLabel(modality: AppointmentModality): string | null {
  return modality === "teleconsulta" ? "Teleconsulta" : null;
}
</script>

<template>
  <section
    aria-labelledby="citas-title"
    class="bg-white rounded-2xl p-5 shadow-sm border-2 border-amber-300 relative flex flex-col h-full overflow-hidden"
  >
    <div
      aria-hidden="true"
      class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400"
    />

    <div class="flex items-center justify-between mb-4 pt-1">
      <div class="flex items-center gap-3">
        <div
          aria-hidden="true"
          class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center"
        >
          <Icon name="ph:calendar-plus" class="text-xl" />
        </div>
        <div>
          <h2
            id="citas-title"
            class="text-xl font-bold text-slate-900 tracking-tight font-display"
          >
            Citas Médicas
          </h2>
          <p class="text-xs text-slate-500">
            Consulta, confirmación y programación directa de citas
          </p>
        </div>
      </div>
      <span
        class="text-xs font-semibold text-amber-900 bg-amber-100/90 border border-amber-300 px-3 py-1 rounded-full"
      >
        Portal en Línea
      </span>
    </div>

    <!-- Estado de carga -->
    <div v-if="isPending" role="status" class="space-y-3 animate-pulse">
      <span class="sr-only">Cargando citas…</span>
      <div class="h-32 rounded-xl bg-amber-100/60" />
      <div class="h-20 rounded-xl bg-slate-100" />
    </div>

    <template v-else>
      <!-- El aviso de error no oculta las acciones: reintentar es la acción. -->
      <p v-if="error" role="alert" class="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4 mb-5">
        {{ error }}
      </p>
      <!-- Próxima cita confirmada -->
      <div
        v-if="summary.next"
        class="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-xl p-4 border border-amber-200/80 mb-5"
      >
        <div class="flex items-center justify-between mb-3">
          <span
            class="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5"
          >
            <Icon name="ph:clock-countdown" class="text-sm" aria-hidden="true" />
            Próxima Cita Confirmada
          </span>
          <span
            class="text-xs bg-white text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200"
          >
            Confirmada
          </span>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div
              aria-hidden="true"
              class="w-12 h-12 rounded-full bg-white text-amber-600 flex items-center justify-center shadow-sm border border-amber-200 shrink-0"
            >
              <Icon :name="specialtyIcon(summary.next)" class="text-2xl" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">
                {{ summary.next.title }}
              </h3>
              <p class="text-xs text-slate-600 font-medium mt-0.5">
                {{ summary.next.dateLabel }}
              </p>
              <p class="text-[11px] text-slate-500 mt-0.5">
                {{ summary.next.doctorName }} • {{ summary.next.site }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 sm:self-center">
            <button
              class="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-amber-100/60 text-slate-700 text-xs font-semibold rounded-lg border border-amber-300/80 shadow-xs transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
              type="button"
            >
              <Icon name="ph:calendar-plus" class="text-sm text-amber-700" aria-hidden="true" />
              <span>Reagendar</span>
            </button>
            <button
              class="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold rounded-lg border border-slate-200 hover:border-rose-200 shadow-xs transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
              type="button"
            >
              <Icon name="ph:x-circle" class="text-sm text-rose-500" aria-hidden="true" />
              <span>Cancelar cita</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Otras citas -->
      <div class="flex-1 flex flex-col justify-between">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
            >
              <Icon name="ph:clock" class="text-sm text-kenko-primary" aria-hidden="true" />
              Otras Citas Programadas
            </span>
            <span class="text-xs text-slate-400 font-medium">
              {{ summary.pendingCount }} {{ summary.pendingCount === 1 ? "cita pendiente" : "citas pendientes" }}
            </span>
          </div>

          <p v-if="summary.others.length === 0" class="text-xs text-slate-500">
            No tienes otras citas programadas.
          </p>

          <div
            v-for="appointment in summary.others"
            :key="appointment.id"
            class="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div class="flex items-center gap-3.5">
              <div
                aria-hidden="true"
                class="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0"
              >
                <Icon :name="specialtyIcon(appointment)" class="text-xl" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-xs md:text-sm font-bold text-slate-900">
                    {{ appointment.title }}
                  </h3>
                  <span
                    v-if="modalityLabel(appointment.modality)"
                    class="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100"
                  >
                    {{ modalityLabel(appointment.modality) }}
                  </span>
                </div>
                <p class="text-[11px] text-slate-600 mt-0.5">
                  {{ appointment.dateLabel }}
                </p>
                <p class="text-[11px] text-slate-500">
                  {{ appointment.doctorName }} • {{ appointment.site }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 sm:self-center">
              <button
                class="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-amber-100/60 text-slate-700 text-xs font-semibold rounded-lg border border-amber-300/80 shadow-xs transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                type="button"
              >
                <Icon name="ph:calendar-plus" class="text-sm text-amber-700" aria-hidden="true" />
                <span>Reagendar</span>
              </button>
              <button
                class="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold rounded-lg border border-slate-200 hover:border-rose-200 shadow-xs transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                type="button"
              >
                <Icon name="ph:x-circle" class="text-sm text-rose-500" aria-hidden="true" />
                <span>Cancelar cita</span>
              </button>
            </div>
          </div>
        </div>

        <div class="pt-4 mt-auto">
          <a
            class="w-full py-3 px-4 bg-kenko-secondary hover:bg-amber-400 text-slate-900 font-bold text-xs md:text-sm rounded-xl transition duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
            href="#agendar-cita"
          >
            <Icon name="ph:calendar-plus" class="font-bold text-base" aria-hidden="true" />
            <span>Agendar Nueva Cita Médica</span>
            <Icon name="ph:arrow-right" class="text-sm" aria-hidden="true" />
          </a>
        </div>
      </div>
    </template>
  </section>
</template>
