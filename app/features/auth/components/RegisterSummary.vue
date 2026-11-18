<script setup lang="ts">
import { computed } from "vue";

/**
 * Resumen en vivo del registro: refleja lo digitado o "pendiente".
 * Presentacional: la página le pasa los valores del store.
 * Las filas completas destacan (borde dorado + check); las pendientes
 * quedan tenues. Mismo contenido y comportamiento de siempre.
 */
const props = withDefaults(
  defineProps<{
    document?: string;
    holder?: string;
    contact?: string;
  }>(),
  { document: undefined, holder: undefined, contact: undefined },
);

const filledDocument = computed(() => props.document !== undefined);
const filledHolder = computed(() => props.holder !== undefined);
const filledContact = computed(() => props.contact !== undefined);
</script>

<template>
  <div
    class="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-4 sm:p-6 flex flex-col gap-4"
  >
    <div class="flex items-center gap-3 pb-4 border-b border-zinc-100">
      <span
        aria-hidden="true"
        class="w-10 h-10 rounded-xl bg-secondary text-content flex items-center justify-center shrink-0"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" stroke-linejoin="round" />
        </svg>
      </span>
      <div class="flex-1">
        <h2 class="font-display font-bold text-lg text-primary leading-tight">Resumen en Vivo</h2>
        <span class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
          Paso a Paso
        </span>
      </div>
    </div>
    <div class="flex flex-col gap-3">
      <div
        class="p-3 rounded-xl border border-l-4 transition-colors"
        :class="filledDocument ? 'bg-secondary/10 border-secondary/60 border-l-secondary' : 'bg-zinc-50 border-zinc-100 border-l-zinc-200'"
      >
        <span
class="text-[11px] font-bold block uppercase tracking-wider"
          :class="filledDocument ? 'text-[#8a5e00]' : 'text-zinc-500'">
          Identificación
        </span>
        <p
class="font-display font-bold text-sm mt-0.5"
          :class="filledDocument ? 'text-content' : 'text-zinc-500 italic'">
          {{ props.document ?? "Pendiente de ingreso" }}
        </p>
      </div>
      <div
        class="p-3 rounded-xl border border-l-4 transition-colors"
        :class="filledHolder ? 'bg-secondary/10 border-secondary/60 border-l-secondary' : 'bg-zinc-50 border-zinc-100 border-l-zinc-200'"
      >
        <span
class="text-[11px] font-bold block uppercase tracking-wider"
          :class="filledHolder ? 'text-[#8a5e00]' : 'text-zinc-500'">
          Afiliado Principal
        </span>
        <p
class="font-display font-bold text-sm mt-0.5"
          :class="filledHolder ? 'text-content' : 'text-zinc-500 italic'">
          {{ props.holder ?? "Pendiente de ingreso" }}
        </p>
      </div>
      <div
        class="p-3 rounded-xl border border-l-4 transition-colors"
        :class="filledContact ? 'bg-secondary/10 border-secondary/60 border-l-secondary' : 'bg-zinc-50 border-zinc-100 border-l-zinc-200'"
      >
        <span
class="text-[11px] font-bold block uppercase tracking-wider"
          :class="filledContact ? 'text-[#8a5e00]' : 'text-zinc-500'">
          Ubicación y Contacto
        </span>
        <p
class="font-display font-bold text-sm mt-0.5"
          :class="filledContact ? 'text-content' : 'text-zinc-500 italic'">
          {{ props.contact ?? "Pendiente de ingreso" }}
        </p>
      </div>
    </div>
    <div class="pt-4 border-t border-zinc-100 text-zinc-600 text-xs leading-relaxed">
      Afiliación directa con validación inmediata de tu cobertura en salud.
    </div>
  </div>
</template>
