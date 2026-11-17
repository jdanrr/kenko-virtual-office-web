<script setup lang="ts">
// Vista /citas — Agendar + panel lateral "Mis citas".
// Usa el cliente directo de appointments (de otro equipo) + helpers locales de citasView.
// No usa el proxy BFF ni localStorage: el token sale de useAuthStore.
import { computed, onMounted, ref } from "vue";
import AppointmentFilters from "~/features/appointments/components/AppointmentFilters.vue";
import AvailableAppointmentCard from "~/features/appointments/components/AvailableAppointmentCard.vue";
import CancelAppointmentModal from "~/features/appointments/components/CancelAppointmentModal.vue";
import MyAppointmentsPanel from "~/features/appointments/components/MyAppointmentsPanel.vue";
import {
  cancelAppointment,
  createAppointmentsClient,
  listAvailableAppointments,
  listMedicalCenters,
  listMyAppointments,
  listPhysicians,
  scheduleAppointment,
} from "~/features/appointments/api";
import type {
  AppointmentResponse,
  MedicalCenter,
  Physician,
} from "~/features/appointments/types";
import {
  matchesDayPart,
  toUserMessage,
  viewFiltersToParams,
} from "~/features/appointments/citasView";
import type { CitasViewFilters } from "~/features/appointments/citasView";
import { getServiceBases } from "~/core/config/services";
import { useAuthStore } from "~/features/auth";

useSeoMeta({ title: "Agendar cita - Kenko EPS" });

const auth = useAuthStore();
const getAccessToken = () => auth.accessToken;
const bases = getServiceBases();
const client = createAppointmentsClient(bases.appointments, getAccessToken);

const filters = ref<CitasViewFilters>({
  type: "",
  medicalCenterId: "",
  physicianId: "",
  dateFrom: "",
  dateTo: "",
  dayPart: "todas",
  page: 1,
  pageSize: 12,
});

const centers = ref<MedicalCenter[]>([]);
const physicians = ref<Physician[]>([]);
const mine = ref<AppointmentResponse[]>([]);
const items = ref<AppointmentResponse[]>([]);
const total = ref(0);

const loadingCatalogs = ref(false);
const loadingMine = ref(false);
const searching = ref(false);
const schedulingId = ref<string | null>(null);
const cancelPending = ref(false);

const mineError = ref<string | null>(null);
const searchError = ref<string | null>(null);
const actionError = ref<string | null>(null);
const toast = ref<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | undefined;

const filteredItems = computed(() =>
  items.value.filter((a) => matchesDayPart(a.startTime, filters.value.dayPart)),
);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / filters.value.pageSize)));

function showToast(msg: string) {
  toast.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.value = null), 4000);
}

async function loadCatalogs() {
  loadingCatalogs.value = true;
  try {
    const [c, p] = await Promise.all([
      listMedicalCenters(client),
      listPhysicians(client),
    ]);
    centers.value = c;
    physicians.value = p;
  }
  catch (err) {
    // Catálogos no bloquean: los selects quedan con "todas".
    console.warn("No se pudieron cargar catálogos", err);
  }
  finally {
    loadingCatalogs.value = false;
  }
}

async function loadMine() {
  loadingMine.value = true;
  mineError.value = null;
  try {
    mine.value = await listMyAppointments(client);
  }
  catch (err: unknown) {
    mineError.value = toUserMessage(err);
  }
  finally {
    loadingMine.value = false;
  }
}

async function search() {
  searching.value = true;
  searchError.value = null;
  actionError.value = null;
  try {
    const res = await listAvailableAppointments(client, viewFiltersToParams(filters.value));
    items.value = res.items;
    total.value = res.total;
  }
  catch (err: unknown) {
    searchError.value = toUserMessage(err);
  }
  finally {
    searching.value = false;
  }
}

function clearFilters() {
  filters.value = {
    type: "",
    medicalCenterId: "",
    physicianId: "",
    dateFrom: "",
    dateTo: "",
    dayPart: "todas",
    page: 1,
    pageSize: 12,
  };
  search();
}

async function agendar(a: AppointmentResponse) {
  schedulingId.value = a.appointmentId;
  actionError.value = null;
  try {
    await scheduleAppointment(client, a.appointmentId);
    showToast(`Cita agendada: ${a.date} ${a.startTime.slice(0, 5)} con ${a.physician.name}`);
    await Promise.all([loadMine(), search()]);
  }
  catch (err: unknown) {
    actionError.value = toUserMessage(err);
  }
  finally {
    schedulingId.value = null;
  }
}

// Cancelar con pop-up rojo
const toCancel = ref<AppointmentResponse | null>(null);
function askCancel(a: AppointmentResponse) {
  toCancel.value = a;
}
async function confirmCancel() {
  if (!toCancel.value) return;
  cancelPending.value = true;
  try {
    await cancelAppointment(client, toCancel.value.appointmentId);
    showToast("Cita cancelada y liberada.");
    toCancel.value = null;
    await Promise.all([loadMine(), search()]);
  }
  catch (err: unknown) {
    actionError.value = toUserMessage(err);
  }
  finally {
    cancelPending.value = false;
  }
}

function goReschedule(a: AppointmentResponse) {
  navigateTo({ path: "/citas/reprogramar", query: { oldId: a.appointmentId } });
}

onMounted(async () => {
  await loadCatalogs();
  await Promise.all([loadMine(), search()]);
});
</script>

<template>
  <div class="min-h-screen bg-background text-content">
    <header class="w-full bg-white border-b border-slate-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary">
            <Icon name="ph:heart-pulse" class="text-xl" />
          </div>
          <div>
            <p class="font-bold text-primary font-display leading-tight">Kenko EPS</p>
            <p class="text-[10px] uppercase tracking-wider text-slate-500">Portal paciente</p>
          </div>
        </div>
        <NuxtLink to="/home-page" class="text-sm font-bold text-primary hover:underline flex items-center gap-1">
          <Icon name="ph:arrow-left" />
          Volver al inicio
        </NuxtLink>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-5">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1">
            <Icon name="ph:calendar-check" />
            Disponibilidad oficial · Red Kenko EPS
          </p>
          <h1 class="text-2xl font-bold text-primary font-display">Agendamiento de citas médicas</h1>
          <p class="text-sm text-slate-600">Filtra por especialidad, sede, médico o fecha y agenda en tiempo real.</p>
        </div>
        <span class="inline-flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200 text-xs font-semibold">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          Disponibilidad en vivo
        </span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div class="lg:col-span-8">
          <AppointmentFilters
            v-model="filters"
            :centers="centers"
            :physicians="physicians"
            :pending="searching || loadingCatalogs"
            @search="filters.page = 1; search()"
            @clear="clearFilters"
          />

          <p v-if="actionError" role="alert" class="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4">
            {{ actionError }}
          </p>
          <p v-if="searchError" role="alert" class="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4">
            {{ searchError }}
          </p>

          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-slate-900 font-display">
              Turnos disponibles
              <span class="text-xs font-normal text-slate-500">({{ total }} en total · página {{ filters.page }} de {{ totalPages }})</span>
            </h2>
          </div>

          <div v-if="searching" class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse" role="status" aria-label="Buscando turnos">
            <div class="h-44 rounded-xl bg-slate-100" />
            <div class="h-44 rounded-xl bg-slate-100" />
          </div>

          <div v-else-if="filteredItems.length === 0" class="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
            <Icon name="ph:calendar-x" class="text-4xl text-slate-300 mx-auto" />
            <p class="font-bold text-slate-900 mt-3">Sin resultados con esos filtros</p>
            <p class="text-sm text-slate-500 mt-1">Prueba con otra fecha, otra sede o limpia los filtros. La franja horaria se aplica aquí mismo.</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AvailableAppointmentCard
              v-for="a in filteredItems"
              :key="a.appointmentId"
              :appointment="a"
              :pending="schedulingId === a.appointmentId"
              @action="agendar"
            />
          </div>

          <div class="flex items-center justify-between mt-5">
            <button
              type="button"
              :disabled="filters.page <= 1 || searching"
              class="px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold disabled:opacity-40 bg-white"
              @click="filters.page--; search()"
            >
              ← Anterior
            </button>
            <span class="text-xs text-slate-500">Página {{ filters.page }} de {{ totalPages }}</span>
            <button
              type="button"
              :disabled="filters.page >= totalPages || searching"
              class="px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold disabled:opacity-40 bg-white"
              @click="filters.page++; search()"
            >
              Siguiente →
            </button>
          </div>
        </div>

        <div class="lg:col-span-4 lg:sticky lg:top-20">
          <MyAppointmentsPanel
            :appointments="mine"
            :pending="loadingMine"
            :error="mineError"
            @reschedule="goReschedule"
            @cancel="askCancel"
          />
        </div>
      </div>
    </main>

    <CancelAppointmentModal
      v-if="toCancel"
      :appointment="toCancel"
      :pending="cancelPending"
      @close="toCancel = null"
      @confirm="confirmCancel"
    />

    <div
      v-if="toast"
      role="status"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg z-50"
    >
      {{ toast }}
    </div>
  </div>
</template>
