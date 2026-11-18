<script setup lang="ts">
import type { RegisterStep } from "../registerStore";

/**
 * Stepper del registro: 4 etapas clicables con estado visible.
 * Botones reales (no `li` con onclick): navegables por teclado.
 * Avanzar valida los pasos intermedios (lo aplica el store).
 */
const props = defineProps<{
  currentStep: RegisterStep;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  select: [step: RegisterStep];
}>();

const STEPS: Array<{ n: RegisterStep; stage: string; label: string }> = [
  { n: 1, stage: "Etapa 1", label: "Documento" },
  { n: 2, stage: "Etapa 2", label: "Datos personales" },
  { n: 3, stage: "Etapa 3", label: "Contacto y Residencia" },
  { n: 4, stage: "Etapa 4", label: "Seguridad y Ley 1581" },
];
</script>

<template>
  <nav aria-label="Progreso del registro">
    <ol class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <li v-for="step in STEPS" :key="step.n">
        <button
          class="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left min-h-[48px] cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60"
          :class="
            step.n === props.currentStep
              ? 'bg-primary text-on-primary shadow-sm'
              : step.n < props.currentStep
                ? 'bg-zinc-200 text-content hover:bg-zinc-300'
                : 'bg-zinc-100 hover:bg-zinc-200 text-content'
          "
          type="button"
          :aria-current="step.n === props.currentStep ? 'step' : undefined"
          :disabled="props.disabled"
          @click="emit('select', step.n)"
        >
          <span
            class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
            :class="
              step.n === props.currentStep
                ? 'bg-white text-primary shadow-sm'
                : step.n < props.currentStep
                  ? 'bg-primary text-on-primary'
                  : 'bg-white border border-zinc-200 text-zinc-600'
            "
            aria-hidden="true"
          >
            <svg
              v-if="step.n < props.currentStep"
              class="w-4 h-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"
                clip-rule="evenodd"
              />
            </svg>
            <span v-else>{{ step.n }}</span>
          </span>
          <span class="min-w-0">
            <span
              class="text-[11px] font-bold uppercase tracking-wider block"
              :class="step.n === props.currentStep ? 'opacity-85' : 'text-zinc-500'"
            >
              {{ step.stage }}
            </span>
            <span class="font-display font-semibold text-sm block truncate">
              {{ step.label }}
            </span>
          </span>
        </button>
      </li>
    </ol>
  </nav>
</template>
