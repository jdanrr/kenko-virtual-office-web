<script setup lang="ts">
/**
 * Resumen en vivo del registro: refleja lo digitado o "pendiente".
 * Presentacional: la página le pasa los valores del store.
 */
const props = withDefaults(
  defineProps<{
    document?: string;
    holder?: string;
    contact?: string;
  }>(),
  { document: undefined, holder: undefined, contact: undefined },
);
</script>

<template>
  <div
    class="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-4 sm:p-6 flex flex-col gap-4"
  >
    <div class="flex items-center justify-between pb-4 border-b border-zinc-100">
      <h2 class="font-display font-bold text-lg text-primary">Resumen en Vivo</h2>
      <span class="text-xs font-semibold text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-full">
        Paso a Paso
      </span>
    </div>
    <div class="flex flex-col gap-4">
      <div class="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
        <span class="text-[11px] font-bold text-zinc-500 block uppercase tracking-wider">
          Identificación
        </span>
        <p class="font-display font-semibold text-sm text-content mt-0.5">
          {{ props.document ?? "Pendiente de ingreso" }}
        </p>
      </div>
      <div class="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
        <span class="text-[11px] font-bold text-zinc-500 block uppercase tracking-wider">
          Afiliado Principal
        </span>
        <p class="font-display font-semibold text-sm text-content mt-0.5">
          {{ props.holder ?? "Pendiente de ingreso" }}
        </p>
      </div>
      <div class="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
        <span class="text-[11px] font-bold text-zinc-500 block uppercase tracking-wider">
          Ubicación y Contacto
        </span>
        <p class="font-display font-semibold text-sm text-content mt-0.5">
          {{ props.contact ?? "Pendiente de ingreso" }}
        </p>
      </div>
    </div>
    <div class="pt-4 border-t border-zinc-100 text-zinc-600 text-xs leading-relaxed">
      Afiliación directa con validación inmediata de tu cobertura en salud.
    </div>
  </div>
</template>
