<script setup lang="ts">
// Vista /citas/reprogramar?oldId= — igual a agendar + recuadro con la cita actual.
// Reprogramar es UNA sola llamada: POST /api/citas/:oldId/reprogramar { newAppointmentId }.
import { computed, onMounted, ref, watch } from "vue";
import AppointmentFilters from "~/features/appointments/components/AppointmentFilters.vue";
import AvailableAppointmentCard from "~/features/appointments/components/AvailableAppointmentCard.vue";
import CancelAppointmentModal from "~/features/appointments/components/CancelAppointmentModal.vue";
import MyAppointmentsPanel from "~/features/appointments/components/MyAppointmentsPanel.vue";
import {
  cancelAppointment,
  fetchAvailable,
  fetchMedicalCenters,
  fetchMyAppointments,
  fetchPhysicians,
  filtersToQuery,
  getStoredToken,
  rescheduleAppointment,
  setStoredToken,
  toUserMessage,
} from "~/features/appointments/api";
import type {
  Appointment,
  AppointmentFilters as Filters,
  CatalogMedicalCenter,
  CatalogPhysician,
} from "~/features/appointments/types";
import { appointmentTitle, formatAppointmentDate, matchesDayPart } from "~/features/appointments/types";

useSeoMeta({ title: "Reprogramar cita - Kenko EPS" });

const route = useRoute();
const oldId = computed(() => {
  const q = route.query.oldId ?? route.query.citaId ?? route.query.id;
  return Array.isArray(q) ? q[0] ?? "" : (q as string) ?? "";
});

const filters = ref<Filters>({
  type: "",
  medicalCenterId: "",
  physicianId: "",
  dateFrom: "",
  dateTo: "",
  dayPart: "todas",
  page: 1,
  pageSize: 12,
});

const centers = ref<CatalogMedicalCenter[]>([]);
const physicians = ref<CatalogPhysician[]>([]);
const mine = ref<Appointment[]>([]);
const items = ref<Appointment[]>([]);
const total = ref(0);

const searching = ref(false);
const loadingMine = ref(false);
const reschedulingId = ref<string | null>(null);
const cancelPending = ref(false);

const mineError = ref<string | null>(null);
const searchError = ref<string | null>(null);
const actionError = ref<string | null>(null);
const toast = ref<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | undefined;

const tokenInput = ref("");
const showTokenBox = ref(false);

const oldAppointment = computed(
  () => mine.value.find((a) => a.appointmentId === oldId.value) ?? null,
);
const filteredItems = computed(() =>
  items.value.filter((a) => matchesDayPart(a.startTime, filters.value.dayPart)),
);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / filters.value.pageSize)));

function showToast(msg: string) {
  toast.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.value = null), 4500);
}

async function loadMine() {
  loadingMine.value = true;
  mineError.value = null;
  try {
    mine.value = await fetchMyAppointments();
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
  try {
    const res = await fetchAvailable(filtersToQuery(filters.value));
    // Nunca ofrecer la misma cita que se quiere cambiar.
    items.value = res.items.filter((a) => a.appointmentId !== oldId.value);
    total.value = res.total;
  }
  catch (err: unknown) {
    searchError.value = toUserMessage(err);
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 401 || status === 403) showTokenBox.value = true;
  }
  finally {
    searching.value = false;
  }
}

function clearFilters() {
  filters.value = {
    type: oldAppointment.value?.type ?? "",
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

async function usarEsteTurno(nueva: Appointment) {
  if (!oldId.value) {
    actionError.value = "Falta la cita actual (?oldId=). Vuelve a Mis citas y pulsa Reagendar.";
    return;
  }
  reschedulingId.value = nueva.appointmentId;
  actionError.value = null;
  try {
    await rescheduleAppointment(oldId.value, nueva.appointmentId);
    showToast(`Cita reprogramada al ${nueva.date} ${nueva.startTime}.`);
    await navigateTo("/citas");
  }
  catch (err: unknown) {
    actionError.value = toUserMessage(err);
  }
  finally {
    reschedulingId.value = null;
  }
}

const toCancel = ref<Appointment | null>(null);
async function confirmCancel() {
  if (!toCancel.value) return;
  cancelPending.value = true;
  try {
    await cancelAppointment(toCancel.value.appointmentId);
    showToast("Cita cancelada y liberada.");
    toCancel.value = null;
    await loadMine();
  }
  catch (err: unknown) {
    actionError.value = toUserMessage(err);
  }
  finally {
    cancelPending.value = false;
  }
}

function goReschedule(a: Appointment) {
  navigateTo({ path: "/citas/reprogramar", query: { oldId: a.appointmentId } });
}

function saveToken() {
  setStoredToken(tokenInput.value);
  showTokenBox.value = false;
  showToast("Token guardado.");
  loadMine();
  search();
}

// Cuando ya sabemos cuál es la cita vieja, prefiltramos por su mismo tipo
// (el back exige mismo type al reprogramar).
watch(oldAppointment, (cur) => {
  if (cur && !filters.value.type) {
    filters.value.type = cur.type;
    search();
  }
});

onMounted(async () => {
  tokenInput.value = getStoredToken();
  const [c, p] = await Promise.all([fetchMedicalCenters().catch(() => []), fetchPhysicians().catch(() => [])]);
  centers.value = c;
  physicians.value = p;
  await loadMine();
  await search();
});
</script>

<template>
  <div class="min-h-screen bg-background text-content">
    <header class="w-full bg-white border-b border-slate-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary">
            <Icon name="ph:arrows-clockwise" class="text-xl" />
          </div>
          <div>
            <p class="font-bold text-primary font-display leading-tight">Kenko EPS</p>
            <p class="text-[10px] uppercase tracking-wider text-slate-500">Reprogramar cita</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <NuxtLink to="/citas" class="text-sm font-bold text-primary hover:underline">← Volver a agendar</NuxtLink>
          <NuxtLink to="/" class="text-sm text-slate-500 hover:underline">Inicio</NuxtLink>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <div class="mb-5">
        <h1 class="text-2xl font-bold text-primary font-display">Reprogramar cita médica</h1>
        <p class="text-sm text-slate-600">Elige un nuevo turno libre. Al confirmar, se libera el anterior y se toma el nuevo en una sola operación.</p>
      </div>

      <!-- Recuadro con la cita actual que se quiere cambiar -->
      <section class="bg-primary text-on-primary rounded-xl p-5 shadow-md border-2 border-secondary mb-6">
        <p class="text-[11px] font-bold uppercase tracking-wider text-secondary mb-2 flex items-center gap-1">
          <Icon name="ph:repeat" />
          Estás cambiando esta cita
        </p>
        <div v-if="loadingMine" class="animate-pulse text-sm">Cargando tu cita actual…</div>
        <div v-else-if="oldAppointment" class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p class="text-[11px] uppercase opacity-70">Especialidad</p>
            <p class="font-bold">{{ appointmentTitle(oldAppointment) }}</p>
          </div>
          <div>
            <p class="text-[11px] uppercase opacity-70">Fecha y hora</p>
            <p class="font-bold">{{ formatAppointmentDate(oldAppointment) }}</p>
          </div>
          <div>
            <p class="text-[11px] uppercase opacity-70">Médico</p>
            <p class="font-bold">{{ oldAppointment.physician.name }}</p>
          </div>
          <div>
            <p class="text-[11px] uppercase opacity-70">Sede</p>
            <p class="font-bold">{{ oldAppointment.medicalCenter.name }}</p>
          </div>
        </div>
        <div v-else class="text-sm bg-white/10 border border-white/20 rounded-lg p-3">
          No encontré la cita <span class="font-mono">{{ oldId || "(sin ?oldId=)" }}</span> entre tus citas actuales.
          Ve a <NuxtLink to="/citas" class="underline font-bold">Agendar</NuxtLink>, abre el panel lateral y pulsa Reagendar sobre la cita correcta.
        </div>
      </section>

      <div v-if="showTokenBox" class="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-5 text-sm">
        <p class="font-bold text-amber-900">Falta tu sesión (401/403)</p>
        <div class="flex flex-col sm:flex-row gap-2 mt-3">
          <input v-model="tokenInput" type="text" placeholder="Pega tu JWT" class="flex-1 border border-amber-300 rounded-lg px-3 py-2 text-xs font-mono" />
          <button type="button" class="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold" @click="saveToken">Guardar token</button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div class="lg:col-span-8">
          <AppointmentFilters
            v-model="filters"
            :centers="centers"
            :physicians="physicians"
            :pending="searching"
            @search="filters.page = 1; search()"
            @clear="clearFilters"
          />

          <p v-if="actionError" role="alert" class="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4">{{ actionError }}</p>
          <p v-if="searchError" role="alert" class="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4">{{ searchError }}</p>

          <h2 class="font-bold text-slate-900 font-display mb-3">
            Nuevo turno <span class="text-xs font-normal text-slate-500">({{ total }} opciones · debe ser del mismo tipo: {{ oldAppointment?.type ?? "—" }})</span>
          </h2>

          <div v-if="searching" class="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse" role="status">
            <div class="h-44 rounded-xl bg-slate-100" />
            <div class="h-44 rounded-xl bg-slate-100" />
          </div>
          <div v-else-if="filteredItems.length === 0" class="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
            <p class="font-bold text-slate-900">Sin turnos libres con esos filtros</p>
            <p class="text-sm text-slate-500 mt-1">Cambia la fecha o la sede. Recuerda: mismo tipo de cita y con más de 24h de aviso.</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AvailableAppointmentCard
              v-for="a in filteredItems"
              :key="a.appointmentId"
              :appointment="a"
              :pending="reschedulingId === a.appointmentId"
              action-label="Usar este turno"
              :selected="oldAppointment != null && a.type !== oldAppointment.type"
              @action="usarEsteTurno"
            />
          </div>

          <div class="flex items-center justify-between mt-5">
            <button type="button" :disabled="filters.page <= 1 || searching" class="px-4 py-2 rounded-lg border text-sm font-bold disabled:opacity-40 bg-white" @click="filters.page--; search()">← Anterior</button>
            <span class="text-xs text-slate-500">Página {{ filters.page }} de {{ totalPages }}</span>
            <button type="button" :disabled="filters.page >= totalPages || searching" class="px-4 py-2 rounded-lg border text-sm font-bold disabled:opacity-40 bg-white" @click="filters.page++; search()">Siguiente →</button>
          </div>
        </div>

        <div class="lg:col-span-4 lg:sticky lg:top-20">
          <MyAppointmentsPanel
            :appointments="mine"
            :pending="loadingMine"
            :error="mineError"
            @reschedule="goReschedule"
            @cancel="toCancel = $event"
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

    <div v-if="toast" role="status" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg z-50">
      {{ toast }}
    </div>
  </div>
</template>
