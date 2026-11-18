<script setup lang="ts">
/**
 * Layout de acceso: header institucional + contenido + footer legal.
 * Los controles globales (tamaño de texto, contraste) y el chat pertenecen
 * a otro alcance: aquí solo se renderiza lo estático de la marca.
 */
</script>

<template>
  <div class="bg-background font-body text-content min-h-screen flex flex-col">
    <header class="w-full py-3.5 px-5 lg:px-8 bg-white border-b border-zinc-200/80 shadow-sm">
      <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <img src="/logos/kenko-logo.svg" alt="Kenko EPS" class="h-9 w-auto" >
            <span class="font-display font-extrabold text-xl tracking-tight text-primary">
              KENKO EPS
            </span>
          </div>
          <span
            class="hidden sm:inline-flex font-body text-xs font-bold bg-secondary text-content px-2.5 py-0.5 rounded-full uppercase tracking-wide"
          >
            Portal Oficial
          </span>
        </div>
      </div>
    </header>

    <main class="w-full flex-1 flex flex-col items-center justify-center p-5 lg:p-8">
      <div class="w-full max-w-7xl mx-auto">
        <slot />
      </div>
    </main>

    <footer
      class="w-full py-3.5 px-5 lg:px-8 bg-white border-t border-zinc-200 font-body text-xs text-zinc-500"
    >
      <div
        class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-zinc-600"
      >
        <div class="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1">
          <span><strong>Vigilado Supersalud</strong></span>
          <span>Ministerio de Salud y Protección Social de Colombia</span>
          <span>Ley Estatutaria 1581 de 2012 (Habeas Data)</span>
        </div>
        <div class="flex items-center gap-4 font-semibold">
          <button
            class="hover:underline rounded p-1 disabled:opacity-60"
            type="button"
            disabled
            title="Disponible próximamente"
          >
            Política de Tratamiento de Datos
          </button>
          <button
            class="hover:underline rounded p-1 disabled:opacity-60"
            type="button"
            disabled
            title="Disponible próximamente"
          >
            Términos y Condiciones
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>
