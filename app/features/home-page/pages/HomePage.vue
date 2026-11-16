<script setup lang="ts">
// Página de inicio del portal (compone las secciones de la feature home-page).
// TODO: sustituir los mocks por las queries de los barrels (auth,
// appointments, profile) cuando existan; el mapeo vive aquí, los
// componentes no cambian.
import AppointmentsCard from "~/features/home-page/components/AppointmentsCard.vue";
import AuthorizationsSection from "~/features/home-page/components/AuthorizationsSection.vue";
import CertificatesCard from "~/features/home-page/components/CertificatesCard.vue";
import ClinicLocationCard from "~/features/home-page/components/ClinicLocationCard.vue";
import HomeFooter from "~/features/home-page/components/HomeFooter.vue";
import HomeHeader from "~/features/home-page/components/HomeHeader.vue";
import {
  affiliationCertificateMock,
  appointmentsSummaryMock,
  authorizationsMock,
  dashboardPatientMock,
  medicalHistoryMock,
} from "~/features/home-page/mocks/dashboard.mock";

// Metadatos en español para la página de inicio.
useSeoMeta({
  title: "Portal del Paciente - Kenko EPS",
  description:
    "Portal del paciente Kenko EPS: citas médicas, sede, certificados y autorizaciones.",
  ogTitle: "Portal del Paciente - Kenko EPS",
  ogDescription:
    "Portal del paciente Kenko EPS: citas médicas, sede, certificados y autorizaciones.",
});

useHead({
  htmlAttrs: { lang: "es" },
});
</script>

<template>
  <div class="min-h-screen flex flex-col antialiased">
    <HomeHeader :patient="dashboardPatientMock" />

    <main
      class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6"
    >
      <!-- Tablero principal del afiliado -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div class="lg:col-span-7 flex flex-col h-full">
          <AppointmentsCard :summary="appointmentsSummaryMock" />
        </div>

        <div class="lg:col-span-5 flex flex-col gap-6">
          <ClinicLocationCard />
          <CertificatesCard
            :certificate="affiliationCertificateMock"
            :history="medicalHistoryMock"
          />
        </div>
      </div>

      <!-- Autorizaciones a ancho completo -->
      <AuthorizationsSection :items="authorizationsMock" />
    </main>

    <HomeFooter />
  </div>
</template>
