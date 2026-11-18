<script setup lang="ts">
import { computed } from "vue";

/**
 * Panel central de estado vacío/error (tonto: props + emits).
 * Centrado vertical, iconografía suave y botón grande: no se ve vacío
 * y es legible para personas mayores. El reintento trae pausa de 5 s.
 */
const props = withDefaults(
  defineProps<{
    variant: "not-found" | "error";
    title: string;
    message: string;
    correlationId?: string | null;
    pending?: boolean;
    cooldownSeconds?: number;
  }>(),
  { correlationId: null, pending: false, cooldownSeconds: 0 },
);

const emit = defineEmits<{
  retry: [];
}>();

const blocked = computed(() => props.pending || props.cooldownSeconds > 0);
const buttonLabel = computed(() => {
  if (props.pending) return "Reintentando…";
  if (props.cooldownSeconds > 0) return `Reintentar en ${props.cooldownSeconds} s`;
  return "Reintentar consulta";
});
</script>

<template>
  <section
    aria-labelledby="profile-state-title"
    class="bg-white rounded-2xl border border-zinc-200/80 shadow-sm px-6 py-10 sm:p-12 text-center flex flex-col items-center gap-4 min-h-[50vh] justify-center"
  >
    <div
      aria-hidden="true"
      class="w-20 h-20 rounded-full flex items-center justify-center"
      :class="props.variant === 'not-found' ? 'bg-secondary/20 text-[#8a5e00]' : 'bg-[#ba1a1a]/10 text-[#ba1a1a]'"
    >
      <svg v-if="props.variant === 'not-found'" class="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <svg v-else class="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M6 17a4.5 4.5 0 01-.7-8.95A6 6 0 0117 8.5 4.25 4.25 0 0117.5 17H6z" stroke-linejoin="round" />
        <path d="M4 4l16 16" stroke-linecap="round" />
      </svg>
    </div>

    <div role="alert" class="flex flex-col items-center gap-2 max-w-xl">
      <h2 id="profile-state-title" class="font-display text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
        {{ props.title }}
      </h2>
      <p class="font-body text-base sm:text-lg text-zinc-600 leading-relaxed">
        {{ props.message }}
      </p>
      <p v-if="props.correlationId" class="font-body text-xs text-zinc-500">
        Código de referencia:
        <span class="font-mono font-bold">{{ props.correlationId }}</span>
      </p>
    </div>

    <button
      class="inline-flex items-center justify-center gap-2 px-8 min-h-[56px] rounded-xl bg-primary text-on-primary font-display text-base sm:text-lg font-bold shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
      type="button"
      :disabled="blocked"
      :aria-busy="props.pending"
      aria-describedby="profile-state-hint"
      @click="emit('retry')"
    >
      {{ buttonLabel }}
    </button>
    <p id="profile-state-hint" class="font-body text-xs sm:text-sm text-zinc-500 max-w-md">
      Espera unos segundos entre intentos para no saturar el servicio.
    </p>
  </section>
</template>
