<script setup lang="ts">
import { ref, useId } from "vue";

/** Campo de contraseña con mostrar/ocultar accesible. */
const props = withDefaults(
  defineProps<{
    modelValue: string;
    error?: string;
    disabled?: boolean;
    /** Etiqueta visible (login usa "Contraseña"). */
    label?: string;
    /** Nombre del input y autocomplete según el flujo. */
    inputName?: string;
    autocomplete?: string;
    placeholder?: string;
  }>(),
  {
    label: "Contraseña",
    inputName: "password",
    autocomplete: "current-password",
    placeholder: "Ingresa tu contraseña",
    error: undefined,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const inputId = useId();
const errorId = useId();
const visible = ref(false);

function onInput(event: Event): void {
  emit("update:modelValue", (event.target as HTMLInputElement).value);
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label class="font-display text-sm font-bold text-content" :for="inputId">
      {{ props.label }}
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
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 018 0v3" stroke-linecap="round" />
      </svg>
      <input
        :id="inputId"
        class="w-full pl-12 pr-14 py-3.5 min-h-[50px] bg-zinc-50 border rounded-xl text-content font-body text-base placeholder:text-zinc-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
        :class="
          props.error
            ? 'border-[#ba1a1a] focus:border-[#ba1a1a]'
            : 'border-zinc-200 focus:border-primary'
        "
        :type="visible ? 'text' : 'password'"
        :name="props.inputName"
        :autocomplete="props.autocomplete"
        :placeholder="props.placeholder"
        :value="props.modelValue"
        :disabled="props.disabled"
        :aria-invalid="!!props.error"
        :aria-describedby="props.error ? errorId : undefined"
        @input="onInput"
      >
      <button
        class="absolute right-2 p-2 rounded-lg text-zinc-500 hover:text-content hover:bg-zinc-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-secondary"
        type="button"
        :aria-pressed="visible"
        :aria-label="visible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        :disabled="props.disabled"
        @click="visible = !visible"
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
            v-if="visible"
            d="M3 3l18 18M10.5 5.2A9.8 9.8 0 0112 5c5 0 9 4.5 10 7-.4 1-1.3 2.4-2.7 3.7M6.6 6.6C4 8.2 2.5 10.4 2 12c1 2.5 5 7 10 7 1.5 0 2.9-.4 4.1-1"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            v-else
            d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7s-9-4.5-10-7z"
            stroke-linejoin="round"
          />
          <circle v-if="!visible" cx="12" cy="12" r="3" />
        </svg>
      </button>
    </div>
    <p v-if="props.error" :id="errorId" class="text-sm font-semibold text-[#ba1a1a]">
      {{ props.error }}
    </p>
  </div>
</template>
