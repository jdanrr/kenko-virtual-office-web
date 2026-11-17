<script setup lang="ts">
/**
 * Modal de éxito del registro: muestra el `maskedEmail` tal cual lo envía
 * la API (nunca reconstruye el email completo).
 */
const props = defineProps<{
  maskedEmail: string;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
    role="dialog"
    aria-modal="true"
    aria-labelledby="register-success-title"
  >
    <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center">
      <p
        class="w-16 h-16 rounded-full bg-secondary/20 text-primary flex items-center justify-center mx-auto mb-4 font-display font-extrabold text-3xl"
        aria-hidden="true"
      >
        ✓
      </p>
      <h2
        id="register-success-title"
        class="text-primary font-display font-extrabold text-2xl mb-2"
      >
        ¡Registro exitoso!
      </h2>
      <div class="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 text-content text-sm mb-6">
        <p>
          Te enviamos un correo de bienvenida a
          <strong class="text-primary font-semibold">{{ props.maskedEmail }}</strong
          >. Revisa tu bandeja de entrada o spam para activar tu cuenta Kenko EPS.
        </p>
      </div>
      <div class="flex flex-col gap-3">
        <NuxtLink
          class="w-full min-h-[48px] px-6 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary/90 font-display font-bold text-sm shadow flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-secondary"
          to="/iniciar-sesion"
        >
          Ir a Iniciar Sesión
        </NuxtLink>
        <button
          class="w-full py-2.5 font-display text-sm text-zinc-600 hover:text-content font-medium rounded focus:outline-none focus:ring-2 focus:ring-secondary"
          type="button"
          @click="emit('close')"
        >
          Permanecer en esta página
        </button>
      </div>
    </div>
  </div>
</template>
