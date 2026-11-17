<script setup lang="ts">
// Pie del portal (maqueta sin lógica).
</script>

<template>
  <footer class="mt-auto bg-slate-900 text-slate-300 py-6 border-t border-slate-800">
    <div
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs"
    >
      <!-- Marca y derechos -->
      <div class="flex items-center gap-3">
        <div
          aria-hidden="true"
          class="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-amber-400 font-bold text-xs"
        >
          K
        </div>
        <div>
          <p class="font-medium text-white">
            © 2026 Kenko EPS S.A.S. - Todos los derechos reservados.
          </p>
          <p class="text-slate-400 text-[11px]">
            Vigilado por la Superintendencia Nacional de Salud de Colombia
          </p>
        </div>
      </div>

      <!-- Líneas de atención -->
      <div class="flex flex-wrap items-center gap-4 sm:gap-6 text-slate-300 font-medium">
        <div class="flex items-center gap-1.5 text-amber-400">
          <Icon name="ph:phone-call" class="text-base" aria-hidden="true" />
          <span>Línea Gratuita Nacional: <strong>01 8000 954 321</strong></span>
        </div>
        <div class="flex items-center gap-1.5 text-emerald-400">
          <Icon name="ph:first-aid" class="text-base" aria-hidden="true" />
          <span>Urgencias Médicas: <strong>123 / #745</strong></span>
        </div>
        <a
          class="hover:text-white underline underline-offset-4 transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 rounded"
          href="#soporte"
        >
          Soporte Técnico Portal
        </a>
      </div>
    </div>
  </footer>
</template>
