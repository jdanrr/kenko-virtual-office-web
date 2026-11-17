<script setup lang="ts">
import { computed, useId } from "vue";

import { DOCUMENT_TYPES, type DocumentType } from "../types";

/**
 * Selector de tipo de documento (radiogroup en tarjetas).
 * Solo los 4 tipos del contrato; sin "Otro/PPT" (decisión de alcance).
 */
const props = defineProps<{
  modelValue: DocumentType;
  error?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: DocumentType];
}>();

const DESCRIPTIONS: Record<DocumentType, string> = {
  CC: "Cédula Ciudadanía",
  TI: "Tarjeta Identidad",
  CE: "Cédula Extranjería",
  PA: "Pasaporte",
};

const errorId = useId();
const describedBy = computed(() => (props.error ? errorId : undefined));

function isSelected(value: DocumentType): boolean {
  return props.modelValue === value;
}
</script>

<template>
  <fieldset :aria-describedby="describedBy" :aria-invalid="!!props.error">
    <legend class="font-display text-sm font-bold text-content mb-1">
      Tipo de Documento
    </legend>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup">
      <label
        v-for="value in DOCUMENT_TYPES"
        :key="value"
        class="cursor-pointer relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all min-h-[48px] text-center focus-within:ring-2 focus-within:ring-secondary"
        :class="
          isSelected(value)
            ? 'border-primary bg-primary text-on-primary shadow-sm'
            : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700'
        "
      >
        <input
          class="sr-only"
          type="radio"
          name="documentType"
          :value="value"
          :checked="isSelected(value)"
          :disabled="props.disabled"
          @change="emit('update:modelValue', value)"
        >
        <span class="flex items-center gap-1 font-display text-sm font-bold">
          {{ value }}
          <svg
            v-if="isSelected(value)"
            class="w-4 h-4 text-secondary"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
        </span>
        <span
          class="font-body text-[11px] leading-tight"
          :class="isSelected(value) ? 'text-zinc-100' : 'text-zinc-500'"
        >
          {{ DESCRIPTIONS[value] }}
        </span>
      </label>
    </div>
    <p v-if="props.error" :id="errorId" class="mt-1.5 text-sm font-semibold text-[#ba1a1a]">
      {{ props.error }}
    </p>
  </fieldset>
</template>
