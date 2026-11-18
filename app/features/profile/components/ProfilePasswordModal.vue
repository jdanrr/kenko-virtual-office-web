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
const firstInput = ref<HTMLInputElement | null>(null);

watch(
  () => props.open,
  (open) => {
    if (open) {
      showCurrent.value = false;
      showNext.value = false;
      void nextTick(() => firstInput.value?.focus());
    }
  },
);

function onOverlay(event: MouseEvent): void {
  if (event.target === event.currentTarget && !props.pending) emit("close");
}
</script>

<template>
  <div
    v-if="props.open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    @click="onOverlay"
    @keydown.escape="emit('close')"
  >
    <div class="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl flex flex-col gap-4">
      <h2 :id="titleId" class="font-display text-lg font-bold text-content">
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
          <label class="font-display text-sm font-bold text-content" :for="currentId">
            Contraseña actual
          </label>
          <div class="relative flex items-center">
            <input
              :id="currentId"
              ref="firstInput"
              class="w-full h-12 px-4 pr-14 rounded-xl bg-zinc-50 border border-zinc-200 text-content font-body text-sm placeholder:text-zinc-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
              :class="{ 'border-[#ba1a1a] focus:border-[#ba1a1a]': props.errors.currentPassword }"
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
              class="absolute right-2 p-2 rounded-lg text-zinc-500 hover:text-content min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-secondary"
              type="button"
              :aria-pressed="showCurrent"
              :aria-label="showCurrent ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'"
              :disabled="props.pending"
              @click="showCurrent = !showCurrent"
            >
              {{ showCurrent ? "Ocultar" : "Ver" }}
            </button>
          </div>
          <p v-if="props.errors.currentPassword" :id="`${currentId}-error`" class="text-xs font-semibold text-[#ba1a1a]">
            {{ props.errors.currentPassword }}
          </p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-display text-sm font-bold text-content" :for="nextId">
            Nueva contraseña
          </label>
          <div class="relative flex items-center">
            <input
              :id="nextId"
              class="w-full h-12 px-4 pr-14 rounded-xl bg-zinc-50 border border-zinc-200 text-content font-body text-sm placeholder:text-zinc-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
              :class="{ 'border-[#ba1a1a] focus:border-[#ba1a1a]': props.errors.newPassword }"
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
              class="absolute right-2 p-2 rounded-lg text-zinc-500 hover:text-content min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-secondary"
              type="button"
              :aria-pressed="showNext"
              :aria-label="showNext ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'"
              :disabled="props.pending"
              @click="showNext = !showNext"
            >
              {{ showNext ? "Ocultar" : "Ver" }}
            </button>
          </div>
          <p v-if="!props.errors.newPassword" :id="`${nextId}-hint`" class="text-xs text-zinc-500">
            Mínimo 8 caracteres, distinta a la actual; evita contraseñas comunes y tu nombre o correo.
          </p>
          <p v-if="props.errors.newPassword" :id="`${nextId}-error`" class="text-xs font-semibold text-[#ba1a1a]">
            {{ props.errors.newPassword }}
          </p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-display text-sm font-bold text-content" :for="confirmId">
            Repetir nueva contraseña
          </label>
          <input
            :id="confirmId"
            class="w-full h-12 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-content font-body text-sm placeholder:text-zinc-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
            :class="{ 'border-[#ba1a1a] focus:border-[#ba1a1a]': props.errors.confirmNewPassword }"
            type="password"
            name="confirmNewPassword"
            autocomplete="new-password"
            placeholder="Repite la nueva contraseña"
            :value="props.confirmNewPassword"
            :disabled="props.pending"
            :aria-invalid="!!props.errors.confirmNewPassword"
            :aria-describedby="props.errors.confirmNewPassword ? `${confirmId}-error` : undefined"
            @input="emit('update:confirmNewPassword', ($event.target as HTMLInputElement).value)"
          >
          <p v-if="props.errors.confirmNewPassword" :id="`${confirmId}-error`" class="text-xs font-semibold text-[#ba1a1a]">
            {{ props.errors.confirmNewPassword }}
          </p>
        </div>

        <div class="flex items-center justify-end gap-2.5">
          <button
            class="px-4 min-h-[48px] rounded-xl text-content font-display text-sm font-bold hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            :disabled="props.pending"
            @click="emit('close')"
          >
            Cancelar
          </button>
          <button
            class="px-5 min-h-[48px] rounded-xl bg-primary text-on-primary font-display text-sm font-bold focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
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
