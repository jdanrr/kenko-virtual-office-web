<script setup lang="ts">
// Encabezado del portal: saludo por género, avatar con menú de usuario.
// Emite `profile` (vista pendiente, TODO) y `logout` (lo conecta HomePage).
import { computed, onBeforeUnmount, ref } from "vue";

import type { SessionPatientView } from "~/features/home-page/types";

interface Props {
  patient: SessionPatientView | null;
  isPending?: boolean;
}

const props = withDefaults(defineProps<Props>(), { isPending: false });

const emit = defineEmits<{
  (e: "profile" | "logout"): void;
}>();

// Nombre completo sin espacios sobrantes (el apellido lo completará profile).
const fullName = computed(
  () => `${props.patient?.firstName ?? ""} ${props.patient?.lastName ?? ""}`.trim(),
);

// Saludo según género; "@" como neutro por defecto (decisión de equipo).
const welcomeWord = computed(() =>
  props.patient?.gender === "male"
    ? "Bienvenido"
    : props.patient?.gender === "female"
      ? "Bienvenida"
      : "Bienvenid@",
);

// Menú del avatar: se abre/cierra con clic, Escape o clic fuera.
const isOpen = ref(false);
const menuButtonRef = ref<HTMLButtonElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);

function closeMenu(): void {
  if (!isOpen.value) return;
  isOpen.value = false;
  document.removeEventListener("click", onDocumentClick);
  document.removeEventListener("keydown", onEscapeKey);
}

function onDocumentClick(event: MouseEvent): void {
  const target = event.target as Node | null;
  if (
    target &&
    !menuRef.value?.contains(target) &&
    !menuButtonRef.value?.contains(target)
  ) {
    closeMenu();
  }
}

function onEscapeKey(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    closeMenu();
    menuButtonRef.value?.focus();
  }
}

function toggleMenu(): void {
  if (!props.patient) return;
  if (isOpen.value) {
    closeMenu();
    return;
  }
  isOpen.value = true;
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onEscapeKey);
}

function onProfile(): void {
  closeMenu();
  emit("profile");
}

function onLogout(): void {
  closeMenu();
  emit("logout");
}

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
  document.removeEventListener("keydown", onEscapeKey);
});
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
            <span v-if="patient">¡{{ welcomeWord }} {{ fullName }}!</span>
            <span v-else>¡Bienvenida!</span>
            <span aria-hidden="true" class="text-amber-600 text-base">✨</span>
          </h1>
        </div>

        <!-- Perfil del afiliado con menú -->
        <div class="flex items-center gap-3">
          <div
            v-if="isPending"
            role="status"
            class="flex flex-col items-center gap-1"
          >
            <div class="w-10 h-10 rounded-full bg-amber-200/70 animate-pulse" />
            <span class="sr-only">Cargando perfil…</span>
          </div>
          <div v-else-if="patient" class="relative flex flex-col items-center gap-0.5">
            <button
              ref="menuButtonRef"
              type="button"
              :aria-expanded="isOpen"
              aria-haspopup="menu"
              aria-label="Abrir menú de usuario"
              title="Abrir menú de usuario"
              class="w-10 h-10 rounded-full bg-kenko-primary text-white font-bold flex items-center justify-center shadow-sm border-2 border-amber-300 cursor-pointer transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
              @click="toggleMenu"
            >
              <span aria-hidden="true">{{ patient.initials }}</span>
            </button>
            <span class="text-[10px] text-slate-500 font-mono leading-tight">
              {{ patient.email }}
            </span>
            <div
              v-if="isOpen"
              ref="menuRef"
              role="menu"
              aria-label="Menú de usuario"
              class="absolute right-0 top-full mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-lg p-1 z-50"
            >
              <button
                role="menuitem"
                type="button"
                class="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-500"
                @click="onProfile"
              >
                Perfil
              </button>
              <button
                role="menuitem"
                type="button"
                class="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-500"
                @click="onLogout"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
