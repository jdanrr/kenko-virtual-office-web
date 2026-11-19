<script setup lang="ts">
import { computed, ref } from "vue";

import type { Profile } from "../types";

/**
 * Tarjeta 3: cuenta y correo (solo lectura + delegación a Authentication).
 * El email NUNCA se edita aquí (PATCH con `email` da 400).
 * El correo MOSTRADO viene de Authentication (`/me`, inmediato); si no
 * llega, se usa el de Profile como respaldo.
 */
const props = defineProps<{ profile: Profile; email?: string }>();

const shownEmail = computed(() => props.email ?? props.profile.email);

const emit = defineEmits<{
  "change-email": [];
}>();

const actionButton = ref<HTMLButtonElement | null>(null);

function focusAction(): void {
  actionButton.value?.focus();
}

defineExpose({ focusAction });
</script>

<template>
  <section
    aria-labelledby="profile-account-title"
    class="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200/80 shadow-sm flex flex-col gap-4"
  >
    <div class="flex items-center gap-3">
      <div
        aria-hidden="true"
        class="w-10 h-10 rounded-xl bg-zinc-100 text-primary flex items-center justify-center"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <div>
        <h2 id="profile-account-title" class="font-display text-lg font-bold text-content leading-tight">
          Cuenta y correo
        </h2>
        <p class="font-body text-xs text-zinc-500">Sincronizado desde Authentication</p>
      </div>
    </div>

    <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/60">
      <p class="font-body text-xs text-zinc-500 font-medium">Correo electrónico actual</p>
      <p class="font-display text-base font-bold text-content mt-0.5 break-all">{{ shownEmail }}</p>
    </div>

    <p class="font-body text-xs text-zinc-600 leading-relaxed rounded-xl bg-zinc-50 border border-zinc-200/60 p-3">
      El cambio de correo se procesa en Authentication y se muestra aquí de inmediato.
    </p>

    <button
      ref="actionButton"
      class="w-full min-h-[48px] rounded-xl border-2 border-primary/20 hover:border-primary text-primary font-display text-sm font-bold transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer"
      type="button"
      @click="emit('change-email')"
    >
      <span>Gestionar cambio de correo</span>
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M7 17L17 7M9 7h8v8" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </section>
</template>
