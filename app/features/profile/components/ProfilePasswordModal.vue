<script setup lang="ts">
import { nextTick, ref, useId, watch } from "vue";

import ProfileAlert from "./ProfileAlert.vue";

/**
 * Modal tonto de cambio de contraseña (solo props + emits).
 * La validación y el envío viven en la página (`auth/api` + BFF).
 * Sin medidor de fuerza ni checklist inventados: la política real es
 * mínimo 8, máximo 128, no común y distinta a la actual (los mensajes
 * de cada campo la explican).
 */
const props = withDefaults(
  defineProps<{
    open: boolean;
    pending: boolean;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    errors?: Partial<
      Record<"currentPassword" | "newPassword" | "confirmNewPassword", string>
    >;
    serverError?: { title: string; message: string; correlationId?: string } | null;
    rateSeconds?: number;
  }>(),
  { errors: () => ({}), serverError: null, rateSeconds: 0 },
);

const emit = defineEmits<{
  "update:currentPassword": [value: string];
  "update:newPassword": [value: string];
  "update:confirmNewPassword": [value: string];
  submit: [];
  close: [];
}>();

const titleId = useId();
const currentId = useId();
const nextId = useId();
const confirmId = useId();
const showCurrent = ref(false);
const showNext = ref(false);
const showConfirm = ref(false);
const firstInput = ref<HTMLInputElement | null>(null);
const dialogRef = ref<HTMLElement | null>(null);

watch(
  () => props.open,
  (open) => {
    if (open) {
      showCurrent.value = false;
      showNext.value = false;
      showConfirm.value = false;
      void nextTick(() => firstInput.value?.focus());
    }
  },
);

function onOverlay(event: MouseEvent): void {
  if (event.target === event.currentTarget && !props.pending) emit("close");
}

function onEscape(): void {
  if (!props.pending) emit("close");
}

// Trampa de foco: el Tab circula solo entre los controles del modal.
function onTabKey(event: KeyboardEvent): void {
  if (event.key !== "Tab") return;
  const container = dialogRef.value;
  if (!container) return;
  const focusable = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  const first = focusable.item(0);
  const last = focusable.item(focusable.length - 1);
  if (!first || !last) return;
  const active = document.activeElement;
  if (!container.contains(active)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
    return;
  }
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}
</script>

<template>
  <div
    v-if="props.open"
    ref="dialogRef"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    @click="onOverlay"
    @keydown.escape="onEscape"
    @keydown.tab="onTabKey"
  >
    <div class="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl flex flex-col gap-4">
      <h2 :id="titleId" class="font-display text-xl font-extrabold text-content">
        Cambiar contraseña
      </h2>

      <ProfileAlert
        v-if="props.serverError"
        variant="error"
        :title="props.serverError.title"
        :message="props.serverError.message"
        :correlation-id="props.serverError.correlationId"
      />
      <ProfileAlert
        v-else-if="props.rateSeconds > 0"
        variant="info"
        title="Demasiados intentos"
        :message="`Espera ${props.rateSeconds} segundos e intenta de nuevo.`"
      />

      <form class="flex flex-col gap-4" novalidate @submit.prevent="emit('submit')">
        <div class="flex flex-col gap-1.5">
          <label class="font-display text-[15px] font-bold text-content" :for="currentId">
            Contraseña actual
          </label>
          <div class="relative flex items-center">
            <input
              :id="currentId"
              ref="firstInput"
              class="w-full h-12 px-4 pr-14 rounded-xl bg-zinc-50 border border-zinc-200 text-content font-body text-base placeholder:text-zinc-500 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
              :class="{ 'border-rose-700 focus:border-rose-700': props.errors.currentPassword }"
              :type="showCurrent ? 'text' : 'password'"
              name="currentPassword"
              autocomplete="current-password"
              placeholder="Tu contraseña actual"
              :value="props.currentPassword"
              :disabled="props.pending"
              :aria-invalid="!!props.errors.currentPassword"
              :aria-describedby="props.errors.currentPassword ? `${currentId}-error` : undefined"
              @input="emit('update:currentPassword', ($event.target as HTMLInputElement).value)"
            >
            <button
              class="absolute right-2 p-2 rounded-lg text-zinc-500 hover:text-content hover:bg-zinc-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-secondary"
              type="button"
              :aria-pressed="showCurrent"
              :aria-label="showCurrent ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'"
              :disabled="props.pending"
              @click="showCurrent = !showCurrent"
            >
              <svg
                class="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                aria-hidden="true"
              >
                <path
                  v-if="showCurrent"
                  d="M3 3l18 18M10.5 5.2A9.8 9.8 0 0112 5c5 0 9 4.5 10 7-.4 1-1.3 2.4-2.7 3.7M6.6 6.6C4 8.2 2.5 10.4 2 12c1 2.5 5 7 10 7 1.5 0 2.9-.4 4.1-1"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  v-else
                  d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7s-9-4.5-10-7z"
                  stroke-linejoin="round"
                />
                <circle v-if="!showCurrent" cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
          <p v-if="props.errors.currentPassword" :id="`${currentId}-error`" class="text-sm font-semibold text-rose-700">
            {{ props.errors.currentPassword }}
          </p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-display text-[15px] font-bold text-content" :for="nextId">
            Nueva contraseña
          </label>
          <div class="relative flex items-center">
            <input
              :id="nextId"
              class="w-full h-12 px-4 pr-14 rounded-xl bg-zinc-50 border border-zinc-200 text-content font-body text-base placeholder:text-zinc-500 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
              :class="{ 'border-rose-700 focus:border-rose-700': props.errors.newPassword }"
              :type="showNext ? 'text' : 'password'"
              name="newPassword"
              autocomplete="new-password"
              placeholder="Mínimo 8 caracteres"
              :value="props.newPassword"
              :disabled="props.pending"
              :aria-invalid="!!props.errors.newPassword"
              :aria-describedby="props.errors.newPassword ? `${nextId}-error` : `${nextId}-hint`"
              @input="emit('update:newPassword', ($event.target as HTMLInputElement).value)"
            >
            <button
              class="absolute right-2 p-2 rounded-lg text-zinc-500 hover:text-content hover:bg-zinc-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-secondary"
              type="button"
              :aria-pressed="showNext"
              :aria-label="showNext ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'"
              :disabled="props.pending"
              @click="showNext = !showNext"
            >
              <svg
                class="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                aria-hidden="true"
              >
                <path
                  v-if="showNext"
                  d="M3 3l18 18M10.5 5.2A9.8 9.8 0 0112 5c5 0 9 4.5 10 7-.4 1-1.3 2.4-2.7 3.7M6.6 6.6C4 8.2 2.5 10.4 2 12c1 2.5 5 7 10 7 1.5 0 2.9-.4 4.1-1"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  v-else
                  d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7s-9-4.5-10-7z"
                  stroke-linejoin="round"
                />
                <circle v-if="!showNext" cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
          <p v-if="!props.errors.newPassword" :id="`${nextId}-hint`" class="text-sm text-content/70">
            Mínimo 8 caracteres, distinta a la actual; evita contraseñas comunes y tu nombre o correo.
          </p>
          <p v-if="props.errors.newPassword" :id="`${nextId}-error`" class="text-sm font-semibold text-rose-700">
            {{ props.errors.newPassword }}
          </p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-display text-[15px] font-bold text-content" :for="confirmId">
            Repetir nueva contraseña
          </label>
          <div class="relative flex items-center">
            <input
              :id="confirmId"
              class="w-full h-12 px-4 pr-14 rounded-xl bg-zinc-50 border border-zinc-200 text-content font-body text-base placeholder:text-zinc-500 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
              :class="{ 'border-rose-700 focus:border-rose-700': props.errors.confirmNewPassword }"
              :type="showConfirm ? 'text' : 'password'"
              name="confirmNewPassword"
              autocomplete="new-password"
              placeholder="Repite la nueva contraseña"
              :value="props.confirmNewPassword"
              :disabled="props.pending"
              :aria-invalid="!!props.errors.confirmNewPassword"
              :aria-describedby="props.errors.confirmNewPassword ? `${confirmId}-error` : undefined"
              @input="emit('update:confirmNewPassword', ($event.target as HTMLInputElement).value)"
            >
            <button
              class="absolute right-2 p-2 rounded-lg text-zinc-500 hover:text-content hover:bg-zinc-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-secondary"
              type="button"
              :aria-pressed="showConfirm"
              :aria-label="showConfirm ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'"
              :disabled="props.pending"
              @click="showConfirm = !showConfirm"
            >
              <svg
                class="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                aria-hidden="true"
              >
                <path
                  v-if="showConfirm"
                  d="M3 3l18 18M10.5 5.2A9.8 9.8 0 0112 5c5 0 9 4.5 10 7-.4 1-1.3 2.4-2.7 3.7M6.6 6.6C4 8.2 2.5 10.4 2 12c1 2.5 5 7 10 7 1.5 0 2.9-.4 4.1-1"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  v-else
                  d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7s-9-4.5-10-7z"
                  stroke-linejoin="round"
                />
                <circle v-if="!showConfirm" cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
          <p v-if="props.errors.confirmNewPassword" :id="`${confirmId}-error`" class="text-sm font-semibold text-rose-700">
            {{ props.errors.confirmNewPassword }}
          </p>
        </div>

        <div class="flex items-center justify-end gap-2.5">
          <button
            class="px-4 min-h-[48px] rounded-xl text-content font-display text-[15px] font-bold hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            :disabled="props.pending"
            @click="emit('close')"
          >
            Cancelar
          </button>
          <button
            class="px-5 min-h-[48px] rounded-xl bg-primary text-on-primary font-display text-[15px] font-bold focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            :disabled="props.pending || props.rateSeconds > 0"
            :aria-busy="props.pending"
          >
            {{ props.pending ? "Guardando…" : "Cambiar contraseña" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
