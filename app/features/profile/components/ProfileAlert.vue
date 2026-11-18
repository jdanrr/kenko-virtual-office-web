<script setup lang="ts">
/**
 * Aviso de formulario profile: errores de PATCH o mensajes informativos.
 * `role="alert"` anuncia el error; muestra el código de referencia, nunca PII.
 */
const props = withDefaults(
  defineProps<{
    message: string;
    title?: string;
    correlationId?: string;
    variant?: "error" | "info" | "success";
  }>(),
  { variant: "error", title: undefined, correlationId: undefined },
);
</script>

<template>
  <div
    :role="props.variant === 'error' ? 'alert' : 'status'"
    class="rounded-xl border p-3.5 flex items-start gap-2.5"
    :class="
      props.variant === 'error'
        ? 'border-[#ba1a1a]/30 bg-[#ba1a1a]/5'
        : props.variant === 'success'
          ? 'border-emerald-600/30 bg-emerald-50'
          : 'border-secondary/50 bg-secondary/10'
    "
  >
    <svg
      class="w-5 h-5 flex-shrink-0 mt-0.5"
      :class="
        props.variant === 'error'
          ? 'text-[#ba1a1a]'
          : props.variant === 'success'
            ? 'text-emerald-700'
            : 'text-[#8a5e00]'
      "
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fill-rule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
        clip-rule="evenodd"
      />
    </svg>
    <div class="flex-1">
      <p v-if="props.title" class="font-display text-sm font-bold text-content">
        {{ props.title }}
      </p>
      <p class="font-body text-sm text-content">{{ props.message }}</p>
      <p v-if="props.correlationId" class="mt-1 font-body text-xs text-zinc-600">
        Código de referencia:
        <span class="font-mono font-bold">{{ props.correlationId }}</span>
      </p>
    </div>
  </div>
</template>
