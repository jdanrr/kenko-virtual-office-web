<script setup lang="ts">
import { ref } from "vue";

/**
 * Tarjeta 4: seguridad y acceso (delegada a Authentication).
 * Profile NUNCA guarda ni pide la contraseña (PATCH con `password` da 400).
 */
const emit = defineEmits<{
  "change-password": [];
}>();

const actionButton = ref<HTMLButtonElement | null>(null);

function focusAction(): void {
  actionButton.value?.focus();
}

defineExpose({ focusAction });
</script>

<template>
  <section
    aria-labelledby="profile-security-title"
    class="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200/80 shadow-sm flex flex-col gap-4"
  >
    <div class="flex items-center gap-3">
      <div
        aria-hidden="true"
        class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 018 0v3" stroke-linecap="round" />
        </svg>
      </div>
      <div>
        <h2 id="profile-security-title" class="font-display text-lg font-bold text-content leading-tight">
          Seguridad y acceso
        </h2>
        <p class="font-body text-xs text-zinc-500">Protección de credenciales</p>
      </div>
    </div>

    <p class="font-body text-xs text-zinc-600 leading-relaxed rounded-xl bg-zinc-50 border border-zinc-200/60 p-3">
      Kenko nunca te pedirá tu contraseña por correo, llamada ni mensajes.
      No compartas tus credenciales con terceros.
    </p>

    <button
      ref="actionButton"
      class="w-full min-h-[48px] rounded-xl bg-primary text-on-primary font-display text-sm font-bold transition-all flex items-center justify-center gap-2 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer"
      type="button"
      @click="emit('change-password')"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M15 7a4 4 0 10-8 0M12 11v9M8 17h8" stroke-linecap="round" />
      </svg>
      <span>Cambiar contraseña en Kenko Auth</span>
    </button>
  </section>
</template>
