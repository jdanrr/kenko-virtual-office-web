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
    class="w-full bg-white border-b border-content/10 shadow-[0_1px_2px_rgba(24,24,27,0.06)] sticky top-0 z-50"
  >
    <!-- Nivel institucional: línea primaria, sin ruido -->
    <div class="h-1 w-full bg-primary" aria-hidden="true" />
    <div class="px-4 sm:px-8">
      <div
        class="max-w-7xl mx-auto flex items-center justify-between gap-5 md:gap-8 min-h-[72px] py-2"
      >
        <!-- Marca -->
        <div class="flex items-center gap-3 shrink-0">
          <img
            alt="Logo Kenko EPS"
            class="h-12 w-auto object-contain shrink-0"
            src="/logos/kenko-logo.svg"
          >
          <span class="font-display font-black text-xl tracking-tight text-primary leading-none">
            KENKO EPS
          </span>
          <span
            class="hidden lg:inline-flex font-body text-xs font-semibold bg-secondary text-on-secondary px-2.5 py-0.5 rounded-full shrink-0"
          >
            Portal oficial
          </span>
        </div>

        <!-- Separador entre marca y saludo -->
        <div aria-hidden="true" class="hidden sm:block w-px h-8 bg-content/10 shrink-0" />

        <!-- Saludo + contexto -->
        <div class="flex-1 min-w-0 text-left">
          <div
            v-if="isPending"
            role="status"
            class="flex flex-col gap-1.5"
          >
            <div class="h-6 w-48 max-w-full animate-pulse rounded bg-content/10" />
            <div class="hidden sm:block h-3.5 w-32 animate-pulse rounded bg-content/10" />
            <span class="sr-only">Cargando saludo…</span>
          </div>
          <div v-else>
            <h1
              class="text-[18px] md:text-xl font-extrabold text-content tracking-tight font-display truncate leading-tight"
            >
              <span v-if="patient">¡{{ welcomeWord }} {{ fullName }}!</span>
              <span v-else>¡Bienvenida!</span>
            </h1>
            <p class="hidden sm:block font-body text-[13px] font-medium text-content/70 leading-tight truncate mt-0.5">
              Portal del paciente
            </p>
          </div>
        </div>

        <!-- Perfil del afiliado: chip único de 44px -->
        <div class="flex items-center gap-3 shrink-0">
          <div
            v-if="isPending"
            role="status"
            class="flex items-center gap-2.5 rounded-full border border-content/10 py-1 pl-1 pr-3"
          >
            <div class="w-9 h-9 rounded-full bg-content/10 animate-pulse" />
            <div class="hidden min-[400px]:block h-3.5 w-28 animate-pulse rounded bg-content/10" />
            <span class="sr-only">Cargando perfil…</span>
          </div>
          <div v-else-if="patient" class="relative">
            <button
              ref="menuButtonRef"
              type="button"
              :aria-expanded="isOpen"
              aria-haspopup="menu"
              :aria-label="patient ? `Abrir menú de usuario, ${fullName}` : 'Abrir menú de usuario'"
              :title="patient ? `Abrir menú de usuario, ${fullName}` : 'Abrir menú de usuario'"
              class="flex items-center gap-2.5 rounded-full border border-content/10 bg-white py-1 pl-1 pr-3 min-h-11 cursor-pointer transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
              @click="toggleMenu"
            >
              <span
                aria-hidden="true"
                class="w-9 h-9 rounded-full bg-primary text-on-primary text-sm font-bold flex items-center justify-center shadow-sm border-2 border-secondary shrink-0"
              >{{ patient.initials }}</span>
              <span class="hidden min-[400px]:block text-left leading-tight min-w-0">
                <span class="block text-[13px] font-body font-semibold text-content truncate max-w-[160px]">
                  {{ patient.email }}
                </span>
              </span>
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                class="text-content/60 transition-[transform] duration-150 shrink-0 motion-reduce:transition-none"
                :class="isOpen ? 'rotate-180' : ''"
              >
                <path
                  d="M4 6l4 4 4-4"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <div
              v-if="isOpen"
              ref="menuRef"
              role="menu"
              aria-label="Menú de usuario"
              class="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-content/10 bg-white shadow-lg p-1.5 z-50 origin-top-right transition-[opacity,transform] duration-150 motion-reduce:transition-none"
            >
              <button
                role="menuitem"
                type="button"
                class="w-full flex items-center gap-2.5 text-left px-3 py-2.5 text-sm font-body font-semibold text-content rounded-xl hover:bg-background active:bg-content/5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-secondary"
                @click="onProfile"
              >
                <Icon name="ph:user-circle" aria-hidden="true" class="text-xl text-primary shrink-0" />
                Perfil
              </button>
              <div aria-hidden="true" class="h-px bg-content/10 my-1 mx-2" />
              <button
                role="menuitem"
                type="button"
                class="w-full flex items-center gap-2.5 text-left px-3 py-2.5 text-sm font-body font-semibold text-rose-700 rounded-xl hover:bg-rose-50 active:bg-rose-100 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-secondary"
                @click="onLogout"
              >
                <Icon name="ph:sign-out" aria-hidden="true" class="text-xl shrink-0" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
