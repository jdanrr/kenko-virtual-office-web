<script setup lang="ts">
import { ref, useId } from "vue";

import type { Profile } from "../types";
import { formatPhoneDisplayLocal } from "../profileView";

/**
 * Tarjeta 2: contacto y residencia (única editable vía `PATCH`).
 * Componente tonto: recibe el borrador por props y emite cada cambio.
 * La validación y el guardado viven en la página (`schemas.ts` + mutation).
 */
const props = defineProps<{
  profile: Profile;
  editing: boolean;
  phone: string;
  addressLine: string;
  city: string;
  errors: Partial<Record<"phone" | "addressLine" | "city", string>>;
  pending: boolean;
  canSave: boolean;
}>();

const emit = defineEmits<{
  "update:phone": [value: string];
  "update:addressLine": [value: string];
  "update:city": [value: string];
  edit: [];
  cancel: [];
}>();

const phoneId = useId();
const addressLineId = useId();
const cityId = useId();

const phoneInput = ref<HTMLInputElement | null>(null);
const editButton = ref<HTMLButtonElement | null>(null);
const cancelButton = ref<HTMLButtonElement | null>(null);

function focusPhone(): void {
  phoneInput.value?.focus();
}

function focusEdit(): void {
  editButton.value?.focus();
}

function focusCancel(): void {
  cancelButton.value?.focus();
}

defineExpose({ focusPhone, focusEdit, focusCancel });
</script>

<template>
  <section
    aria-labelledby="profile-contact-title"
    class="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200/80 shadow-sm flex flex-col gap-4"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div
          aria-hidden="true"
          class="w-10 h-10 rounded-xl bg-secondary/20 text-[#8a5e00] flex items-center justify-center"
        >
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M5 4h4l2 5-2.5 1.5a12 12 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" stroke-linejoin="round" />
          </svg>
        </div>
        <div>
          <h2 id="profile-contact-title" class="font-display text-lg font-bold text-content leading-tight">
            Contacto y residencia
          </h2>
          <p class="font-body text-xs text-zinc-500">Teléfono y dirección para notificaciones</p>
        </div>
      </div>
      <span
        role="status"
        class="inline-flex items-center px-2.5 py-1 rounded-full font-body text-[11px] font-bold"
        :class="props.editing ? 'bg-secondary/20 text-[#8a5e00]' : 'bg-zinc-100 text-zinc-500'"
      >
        {{ props.editing ? "Editando" : "Lectura" }}
      </span>
    </div>

    <!-- Modo lectura -->
    <div v-if="!props.editing" class="flex flex-col gap-3">
      <div class="grid grid-cols-1 gap-3">
        <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/60 flex items-center justify-between gap-3">
          <div>
            <p class="font-body text-xs text-zinc-500 font-medium">Teléfono móvil</p>
            <p class="font-display text-base font-bold text-content mt-0.5 font-mono">
              +57 {{ formatPhoneDisplayLocal(props.profile.phone) }}
            </p>
          </div>
        </div>
        <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/60">
          <p class="font-body text-xs text-zinc-500 font-medium">Dirección de residencia</p>
          <p class="font-display text-base font-bold text-content mt-0.5">{{ props.profile.address_line }}</p>
          <p class="font-body text-sm text-zinc-600 mt-0.5">{{ props.profile.city }}</p>
        </div>
      </div>
      <button
        ref="editButton"
        class="w-full inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl bg-primary text-on-primary font-display text-sm font-bold shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer"
        type="button"
        @click="emit('edit')"
      >
        Editar información
      </button>
    </div>

    <!-- Modo edición -->
    <div v-else class="grid grid-cols-1 gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="font-display text-sm font-bold text-content" :for="phoneId">
          Teléfono móvil (Colombia)
        </label>
        <div class="flex">
          <span
            class="inline-flex items-center px-3 bg-zinc-100 border border-r-0 border-zinc-200 text-content font-medium text-sm rounded-l-xl select-none"
            aria-hidden="true"
          >
            +57
          </span>
          <input
            :id="phoneId"
            ref="phoneInput"
            class="w-full h-12 px-4 rounded-r-xl bg-zinc-50 border border-zinc-200 text-content font-body text-sm font-mono placeholder:text-zinc-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
            :class="{ 'border-[#ba1a1a] focus:border-[#ba1a1a]': props.errors.phone }"
            type="tel"
            name="phone"
            autocomplete="tel-national"
            inputmode="numeric"
            maxlength="12"
            placeholder="300 123 4567"
            :value="props.phone"
            :disabled="props.pending"
            :aria-invalid="!!props.errors.phone"
            :aria-describedby="props.errors.phone ? `${phoneId}-error` : undefined"
            @input="emit('update:phone', ($event.target as HTMLInputElement).value)"
          >
        </div>
        <p v-if="!props.errors.phone" class="text-xs text-zinc-500">
          Móvil Colombia de 10 dígitos (empieza por 3).
        </p>
        <p v-if="props.errors.phone" :id="`${phoneId}-error`" class="text-xs font-semibold text-[#ba1a1a]">
          {{ props.errors.phone }}
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="font-display text-sm font-bold text-content" :for="addressLineId">
            Dirección de residencia
          </label>
          <input
            :id="addressLineId"
            class="w-full h-12 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-content font-body text-sm placeholder:text-zinc-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
            :class="{ 'border-[#ba1a1a] focus:border-[#ba1a1a]': props.errors.addressLine }"
            type="text"
            name="addressLine"
            autocomplete="street-address"
            maxlength="200"
            placeholder="Ej. Calle 72 # 10-34 Apto 402"
            :value="props.addressLine"
            :disabled="props.pending"
            :aria-invalid="!!props.errors.addressLine"
            :aria-describedby="props.errors.addressLine ? `${addressLineId}-error` : undefined"
            @input="emit('update:addressLine', ($event.target as HTMLInputElement).value)"
          >
          <p v-if="props.errors.addressLine" :id="`${addressLineId}-error`" class="text-xs font-semibold text-[#ba1a1a]">
            {{ props.errors.addressLine }}
          </p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-display text-sm font-bold text-content" :for="cityId">
            Ciudad o municipio
          </label>
          <input
            :id="cityId"
            class="w-full h-12 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-content font-body text-sm placeholder:text-zinc-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
            :class="{ 'border-[#ba1a1a] focus:border-[#ba1a1a]': props.errors.city }"
            type="text"
            name="city"
            autocomplete="address-level2"
            maxlength="100"
            placeholder="Ej. Bogotá D.C."
            :value="props.city"
            :disabled="props.pending"
            :aria-invalid="!!props.errors.city"
            :aria-describedby="props.errors.city ? `${cityId}-error` : undefined"
            @input="emit('update:city', ($event.target as HTMLInputElement).value)"
          >
          <p v-if="props.errors.city" :id="`${cityId}-error`" class="text-xs font-semibold text-[#ba1a1a]">
            {{ props.errors.city }}
          </p>
        </div>
      </div>

      <p class="font-body text-xs text-zinc-600 leading-relaxed rounded-xl bg-primary/5 border border-primary/20 p-3">
        Si cambias la dirección, escribe la nomenclatura y la ciudad (el
        backend exige ambas juntas).
      </p>

      <div class="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-2.5 pt-1">
        <button
          ref="cancelButton"
          class="inline-flex items-center justify-center gap-1.5 px-4 min-h-[48px] rounded-xl border-2 border-zinc-200 hover:border-zinc-300 text-content font-display text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          :disabled="props.pending"
          @click="emit('cancel')"
        >
          Cancelar
        </button>
        <button
          id="profile-save-button"
          class="inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl bg-secondary text-content font-display text-sm font-bold shadow-sm transition-all hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          :disabled="!props.canSave || props.pending"
          :aria-busy="props.pending"
          aria-describedby="profile-save-hint"
        >
          {{ props.pending ? "Guardando…" : "Guardar cambios" }}
        </button>
      </div>
      <p id="profile-save-hint" class="font-body text-xs text-zinc-500 sm:text-right">
        El botón se activa cuando cambias el teléfono o la dirección.
      </p>
    </div>
  </section>
</template>
