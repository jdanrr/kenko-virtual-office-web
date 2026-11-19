<script setup lang="ts">
import { nextTick, ref, useId, watch } from "vue";

import ProfileAlert from "./ProfileAlert.vue";

/**
 * Modal tonto de cambio de correo (solo props + emits).
 * La validación y el envío viven en la página (`auth/api` + BFF).
 * Pide la contraseña actual: el backend la exige para autorizar el cambio.
 */
const props = withDefaults(
  defineProps<{
    open: boolean;
    pending: boolean;
    currentEmail: string;
    newEmail: string;
    currentPassword: string;
    errors?: Partial<Record<"newEmail" | "currentPassword", string>>;
    serverError?: { title: string; message: string; correlationId?: string } | null;
    rateSeconds?: number;
  }>(),
  { errors: () => ({}), serverError: null, rateSeconds: 0 },
);

const emit = defineEmits<{
  "update:newEmail": [value: string];
  "update:currentPassword": [value: string];
  submit: [];
  close: [];
}>();

const titleId = useId();
const newEmailId = useId();
const passwordId = useId();
const firstInput = ref<HTMLInputElement | null>(null);

watch(
  () => props.open,
  (open) => {
    if (open) void nextTick(() => firstInput.value?.focus());
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
        Cambiar correo electrónico
      </h2>

      <p class="font-body text-sm text-zinc-600">
        Actual: <span class="font-semibold text-content break-all">{{ props.currentEmail }}</span>
      </p>

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
          <label class="font-display text-sm font-bold text-content" :for="newEmailId">
            Nuevo correo electrónico
          </label>
          <input
            :id="newEmailId"
            ref="firstInput"
            class="w-full h-12 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-content font-body text-sm placeholder:text-zinc-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
            :class="{ 'border-[#ba1a1a] focus:border-[#ba1a1a]': props.errors.newEmail }"
            type="email"
            name="newEmail"
            autocomplete="email"
            maxlength="254"
            placeholder="nombre@dominio.com"
            :value="props.newEmail"
            :disabled="props.pending"
            :aria-invalid="!!props.errors.newEmail"
            :aria-describedby="props.errors.newEmail ? `${newEmailId}-error` : undefined"
            @input="emit('update:newEmail', ($event.target as HTMLInputElement).value)"
          >
          <p v-if="props.errors.newEmail" :id="`${newEmailId}-error`" class="text-xs font-semibold text-[#ba1a1a]">
            {{ props.errors.newEmail }}
          </p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-display text-sm font-bold text-content" :for="passwordId">
            Contraseña actual
          </label>
          <input
            :id="passwordId"
            class="w-full h-12 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-content font-body text-sm placeholder:text-zinc-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
            :class="{ 'border-[#ba1a1a] focus:border-[#ba1a1a]': props.errors.currentPassword }"
            type="password"
            name="currentPassword"
            autocomplete="current-password"
            placeholder="Tu contraseña de inicio de sesión"
            :value="props.currentPassword"
            :disabled="props.pending"
            :aria-invalid="!!props.errors.currentPassword"
            :aria-describedby="props.errors.currentPassword ? `${passwordId}-error` : undefined"
            @input="emit('update:currentPassword', ($event.target as HTMLInputElement).value)"
          >
          <p v-if="props.errors.currentPassword" :id="`${passwordId}-error`" class="text-xs font-semibold text-[#ba1a1a]">
            {{ props.errors.currentPassword }}
          </p>
        </div>

        <p class="font-body text-xs text-zinc-600 leading-relaxed rounded-xl bg-zinc-50 border border-zinc-200/60 p-3">
          Se aplicará de inmediato en tu cuenta y se mostrará aquí al guardar.
        </p>

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
            {{ props.pending ? "Guardando…" : "Cambiar correo" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
