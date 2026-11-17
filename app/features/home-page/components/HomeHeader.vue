<script setup lang="ts">
// Encabezado del portal: saludo y perfil del afiliado por props.
// TODO(auth): recibir `patient` de usePatientSession() en HomePage.vue.
import { computed } from "vue";

import type { SessionPatientView } from "~/features/home-page/types";

interface Props {
  patient: SessionPatientView | null;
  isPending?: boolean;
}

const props = withDefaults(defineProps<Props>(), { isPending: false });

// Nombre completo sin espacios sobrantes (el apellido llega con profile).
const fullName = computed(
  () => `${props.patient?.firstName ?? ""} ${props.patient?.lastName ?? ""}`.trim(),
);
</script>

<template>
  <header
    class="w-full bg-white border-b border-amber-200/80 sticky top-0 z-50 shadow-sm"
  >
    <!-- Franja superior institucional -->
    <div
      class="bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 border-b border-amber-300/70 px-4 py-2 sm:px-8"
    >
      <div
        class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2"
      >
        <!-- Marca -->
        <div class="flex items-center gap-3">
          <div
            class="bg-white p-1 rounded-lg shadow-sm border border-amber-300/60 flex items-center justify-center"
          >
            <img
              alt="Logo Kenko EPS"
              class="h-9 w-auto object-contain"
              src="/logos/kenko-logo.svg"
            >
          </div>
        </div>

        <!-- Saludo -->
        <div class="text-center">
          <div
            v-if="isPending"
            role="status"
            class="h-7 w-64 animate-pulse rounded bg-amber-200/70 mx-auto"
          >
            <span class="sr-only">Cargando saludo…</span>
          </div>
          <h1
            v-else
            class="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2 font-display"
          >
            <span v-if="patient">¡Bienvenida {{ fullName }}!</span>
            <span v-else>¡Bienvenida!</span>
            <span aria-hidden="true" class="text-amber-600 text-base">✨</span>
          </h1>
        </div>

        <!-- Perfil del afiliado -->
        <div class="flex items-center gap-3">
          <div
            v-if="isPending"
            role="status"
            class="flex items-center gap-3"
          >
            <div class="w-10 h-10 rounded-full bg-amber-200/70 animate-pulse" />
            <span class="sr-only">Cargando perfil…</span>
          </div>
          <div v-else-if="patient" class="flex items-center gap-3">
            <div
              aria-hidden="true"
              class="w-10 h-10 rounded-full bg-kenko-primary text-white font-bold flex items-center justify-center shadow-sm border-2 border-amber-300"
            >
              {{ patient.initials }}
            </div>
            <div class="hidden sm:flex flex-col text-right">
              <span class="text-xs font-bold text-slate-900 leading-tight">
                {{ patient.shortName }}
              </span>
              <span class="text-[10px] text-slate-500 font-mono">
                {{ patient.documentMasked }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
