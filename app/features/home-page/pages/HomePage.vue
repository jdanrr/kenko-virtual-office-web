<script setup lang="ts">
// Página de inicio del portal (compone las secciones de la feature home-page).
// Citas y autorizaciones: datos reales (barrels appointments y profile).
// Certificados e historial: se generan bajo demanda con mutations.
// El mapeo backend→vista vive en ./mapping; los componentes no cambian.
import { computed, ref } from "vue";

import { getServiceBases } from "~/core/config/services";
import { useAuthStore } from "~/features/auth";
import type { AuthUser } from "~/features/auth";
import { cancelAppointment, createAppointmentsClient, useMyAppointmentsQuery } from "../../appointments";
import type { AppointmentResponse } from "../../appointments";
import {
  createProfileClient,
  downloadAuthorizationPdf,
  useAuthorizationsQuery,
  useGenerateCertificateMutation,
  useGenerateHistoryMutation,
} from "../../profile";
import AppointmentsCard from "~/features/home-page/components/AppointmentsCard.vue";
import CancelAppointmentModal from "~/features/appointments/components/CancelAppointmentModal.vue";
import AuthorizationsSection from "~/features/home-page/components/AuthorizationsSection.vue";
import CertificatesCard from "~/features/home-page/components/CertificatesCard.vue";
import ClinicLocationCard from "~/features/home-page/components/ClinicLocationCard.vue";
import HomeFooter from "~/features/home-page/components/HomeFooter.vue";
import HomeHeader from "~/features/home-page/components/HomeHeader.vue";
import {
  toAppointmentsErrorMessage,
  toAppointmentsSummary,
  toAuthorizationViews,
  toCertificateView,
  toHistoryView,
  toProfileErrorMessage,
} from "~/features/home-page/mapping";
import {
  authorizationsMock,
  dashboardPatientMock,
} from "~/features/home-page/mocks/dashboard.mock";
import type { AppointmentsSummaryView, AppointmentView, SessionPatientView } from "~/features/home-page/types";

// Identidad real de la sesión (GET /auth/me vía el store).
// El backend aún no expone apellido ni documento: los completará profile
// (TODO). Sin sesión (p. ej. desarrollo sin backend) se usa el mock.
function toPatientView(user: AuthUser): SessionPatientView {
  return {
    id: user.userId,
    firstName: user.firstName,
    lastName: "",
    shortName: user.firstName,
    documentMasked: user.email,
    initials: user.firstName.charAt(0).toUpperCase(),
    // TODO(profile): el backend aún no expone género ni documento.
    gender: null,
    email: user.email,
  };
}

const auth = useAuthStore();
const getAccessToken = () => auth.accessToken;
const headerPatient = computed<SessionPatientView>(() =>
  auth.user ? toPatientView(auth.user) : dashboardPatientMock,
);

// Menú del avatar: logout cierra todo y redirige; perfil aún sin vista.
async function logout(): Promise<void> {
  await auth.logOutEverywhere();
}

function goToProfile(): void {
  void navigateTo("/mi-perfil");
}

// Citas reales del usuario (requiere sesión; el guarda la garantiza).
const bases = getServiceBases();
const appointmentsQuery = useMyAppointmentsQuery(getAccessToken, bases.appointments);
const appointmentsSummary = computed<AppointmentsSummaryView>(() =>
  appointmentsQuery.data.value
    ? toAppointmentsSummary(appointmentsQuery.data.value)
    : { next: null, others: [], pendingCount: 0 },
);
const appointmentsError = computed(() =>
  toAppointmentsErrorMessage(appointmentsQuery.error.value),
);

// Acciones de la tarjeta: reagendar navega con el id real, cancelar abre el pop-up rojo.
const appointmentsClient = createAppointmentsClient(bases.appointments, getAccessToken);
const toCancel = ref<AppointmentResponse | null>(null);
const cancelPending = ref(false);
const cancelError = ref<string | null>(null);

function goReschedule(view: AppointmentView): void {
  navigateTo({ path: "/citas/reprogramar", query: { oldId: view.id } });
}

function askCancel(view: AppointmentView): void {
  cancelError.value = null;
  toCancel.value =
    appointmentsQuery.data.value?.find((a) => a.appointmentId === view.id) ?? null;
}

async function confirmCancel(): Promise<void> {
  if (!toCancel.value) return;
  cancelPending.value = true;
  cancelError.value = null;
  try {
    await cancelAppointment(appointmentsClient, toCancel.value.appointmentId);
    toCancel.value = null;
    await appointmentsQuery.refetch();
  }
  catch (error) {
    cancelError.value =
      toAppointmentsErrorMessage(error) ?? "No se pudo cancelar la cita.";
  }
  finally {
    cancelPending.value = false;
  }
}

// Autorizaciones reales (solo lectura; el filtro se cableará después).
const authorizationsQuery = useAuthorizationsQuery(getAccessToken, bases.profile);
const authorizationViews = computed(() =>
  authorizationsQuery.data.value
    ? toAuthorizationViews(authorizationsQuery.data.value)
    : authorizationsMock,
);
const authorizationsError = computed(() =>
  toProfileErrorMessage(authorizationsQuery.error.value),
);

// Generación bajo demanda de certificado e historial.
const certificateMutation = useGenerateCertificateMutation(getAccessToken, bases.profile);
const historyMutation = useGenerateHistoryMutation(getAccessToken, bases.profile);
const certificateView = computed(() =>
  certificateMutation.data.value ? toCertificateView(certificateMutation.data.value) : null,
);
const historyView = computed(() =>
  historyMutation.data.value ? toHistoryView(historyMutation.data.value) : null,
);
const documentsPending = computed(
  () => certificateMutation.isPending.value || historyMutation.isPending.value,
);
const documentsError = computed(
  () =>
    toProfileErrorMessage(certificateMutation.error.value) ??
    toProfileErrorMessage(historyMutation.error.value),
);

// Descarga del PDF de autorización con aviso transitorio.
const downloadingId = ref<string | null>(null);
const downloadNotice = ref<string | null>(null);

async function downloadPdf(authorizationId: string): Promise<void> {
  if (downloadingId.value) return;
  downloadingId.value = authorizationId;
  downloadNotice.value = "Preparando tu PDF…";
  try {
    await downloadAuthorizationPdf(
      createProfileClient(bases.profile, getAccessToken),
      authorizationId,
    );
    downloadNotice.value = "PDF descargado. Revisa tu carpeta de descargas.";
  } catch (error) {
    downloadNotice.value =
      toProfileErrorMessage(error) ?? "No se pudo descargar el PDF.";
  } finally {
    downloadingId.value = null;
  }
}

// Metadatos en español para la página de inicio (viven en
// app/pages/home-page.vue para que el SSR los incluya; esta vista solo se
// renderiza en cliente vía <ClientOnly>).
</script>

<template>
  <div class="min-h-screen flex flex-col antialiased">
    <HomeHeader :patient="headerPatient" @profile="goToProfile" @logout="logout" />

    <main
      class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6"
    >
      <!-- Tablero principal del afiliado -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div class="lg:col-span-7 flex flex-col h-full">
          <AppointmentsCard
            :summary="appointmentsSummary"
            :is-pending="appointmentsQuery.isPending.value"
            :error="appointmentsError"
            @reschedule="goReschedule"
            @cancel="askCancel"
          />
          <p v-if="cancelError" role="alert" class="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 mt-3">
            {{ cancelError }}
          </p>
        </div>

        <div class="lg:col-span-5 flex flex-col gap-6">
          <ClinicLocationCard />
          <CertificatesCard
            :certificate="certificateView"
            :history="historyView"
            :is-pending="documentsPending"
            :error="documentsError"
            @generate-certificate="certificateMutation.mutate()"
            @generate-history="historyMutation.mutate()"
          />
        </div>
      </div>

      <!-- Autorizaciones a ancho completo -->
      <AuthorizationsSection
        :items="authorizationViews"
        :is-pending="authorizationsQuery.isPending.value"
        :error="authorizationsError"
        :notice="downloadNotice"
        @download-pdf="downloadPdf"
      />
    </main>

    <CancelAppointmentModal
      v-if="toCancel"
      :appointment="toCancel"
      :pending="cancelPending"
      @close="toCancel = null"
      @confirm="confirmCancel"
    />

    <HomeFooter />
  </div>
</template>
