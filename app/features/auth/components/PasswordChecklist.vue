<script setup lang="ts">
import { computed } from "vue";

import { isBlacklistedPassword } from "../registerSchemas";

/**
 * Checklist en vivo de la política §3.1 (8–128, no común, coinciden).
 * Compartido por registro (paso 4) y restablecimiento de contraseña.
 */
const props = defineProps<{
  password: string;
  confirmPassword: string;
}>();

const CHECKS = computed(() => {
  const lengthOk = props.password.length >= 8 && props.password.length <= 128;
  return [
    { ok: lengthOk, label: "Mínimo 8 caracteres (máximo 128)" },
    {
      ok: props.password.length > 0 && !isBlacklistedPassword(props.password),
      label: "No es una contraseña común o bloqueada",
    },
    {
      ok: props.confirmPassword.length > 0 && props.password === props.confirmPassword,
      label: "Las contraseñas coinciden",
    },
  ];
});
</script>

<template>
  <ul aria-label="Requisitos de la contraseña" class="grid grid-cols-1 sm:grid-cols-3 gap-2">
    <li
      v-for="check in CHECKS"
      :key="check.label"
      class="flex items-center gap-1.5 text-xs"
      :class="check.ok ? 'text-primary font-medium' : 'text-zinc-600'"
    >
      <svg
        class="w-4 h-4 flex-shrink-0"
        :class="check.ok ? 'text-primary' : 'text-zinc-400'"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          v-if="check.ok"
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
          clip-rule="evenodd"
        />
        <path
          v-else
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
          clip-rule="evenodd"
        />
      </svg>
      {{ check.label }}
    </li>
  </ul>
</template>
