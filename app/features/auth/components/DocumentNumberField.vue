<script setup lang="ts">
import { useId } from "vue";

/** Campo de número de documento (alfanumérico: cubre CC/TI/CE/PA). */
const props = defineProps<{
  modelValue: string;
  error?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const inputId = useId();
const errorId = useId();

function onInput(event: Event): void {
  emit("update:modelValue", (event.target as HTMLInputElement).value);
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label class="font-display text-sm font-bold text-content" :for="inputId">
      Número de documento
    </label>
    <div class="relative flex items-center">
      <svg
        class="absolute left-3.5 w-6 h-6 text-zinc-400 pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8.5" cy="11" r="2" />
        <path d="M5.5 16.5c.6-1.4 1.6-2 3-2s2.4.6 3 2M14 9.5h4M14 13h4" stroke-linecap="round" />
      </svg>
      <input
        :id="inputId"
        class="w-full pl-12 pr-4 py-3.5 min-h-[50px] bg-zinc-50 border rounded-xl text-content font-body text-base placeholder:text-zinc-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
        :class="
          props.error
            ? 'border-[#ba1a1a] focus:border-[#ba1a1a]'
            : 'border-zinc-200 focus:border-primary'
        "
        type="text"
        name="documentNumber"
        autocomplete="username"
        autocapitalize="characters"
        spellcheck="false"
        placeholder="Escribe tu número sin puntos ni comas"
        :value="props.modelValue"
        :disabled="props.disabled"
        :aria-invalid="!!props.error"
        :aria-describedby="props.error ? errorId : undefined"
        @input="onInput"
      >
    </div>
    <p v-if="props.error" :id="errorId" class="text-sm font-semibold text-[#ba1a1a]">
      {{ props.error }}
    </p>
    <p v-else class="text-xs text-zinc-500">Sin puntos, guiones ni espacios.</p>
  </div>
</template>
