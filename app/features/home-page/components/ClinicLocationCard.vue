<script setup lang="ts">
// Tarjeta de sede con mapa decorativo (maqueta sin lógica).
// TODO(appointments): cablear "Cómo llegar" y "Urgencias Kenko" a su destino real.
</script>

<template>
  <section
    aria-labelledby="sede-title"
    class="bg-white rounded-2xl p-5 shadow-sm border border-rose-100 flex flex-col"
  >
    <h2 id="sede-title" class="sr-only">Sede de atención</h2>

    <div
      class="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center mb-4"
      role="img"
      aria-label="Mapa de la Sede Chicó Kenko en Bogotá D.C."
    >
      <svg
        aria-hidden="true"
        class="absolute inset-0 w-full h-full opacity-65 object-cover"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="home-map-grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#cbd5e1"
              stroke-width="1.2"
            />
            <circle cx="20" cy="20" r="1.5" fill="#94a3b8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="#f8fafc" />
        <rect width="100%" height="100%" fill="url(#home-map-grid)" />
        <path
          d="M-20 60 Q 120 40, 240 100 T 450 80"
          fill="none"
          stroke="#cbd5e1"
          stroke-width="14"
        />
        <path
          d="M-20 60 Q 120 40, 240 100 T 450 80"
          fill="none"
          stroke="#ffffff"
          stroke-width="9"
        />
        <path
          d="M 170 -10 L 190 200"
          fill="none"
          stroke="#cbd5e1"
          stroke-width="10"
        />
        <path
          d="M 170 -10 L 190 200"
          fill="none"
          stroke="#ffffff"
          stroke-width="6"
        />
      </svg>

      <div class="relative z-10 flex flex-col items-center">
        <div
          class="bg-kenko-primary text-white p-2 rounded-full shadow-lg border-2 border-white flex items-center justify-center"
        >
          <Icon name="ph:hospital" class="text-xl text-amber-300" aria-hidden="true" />
        </div>
        <div
          class="bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-md mt-1 border border-white/20 whitespace-nowrap"
        >
          Sede Chicó Kenko
        </div>
      </div>

      <div
        class="absolute bottom-2 right-2 bg-white/95 px-2 py-1 rounded-md text-[10px] font-bold text-slate-700 shadow-sm border border-slate-200 flex items-center gap-1"
      >
        <Icon name="ph:compass" class="text-rose-500" aria-hidden="true" />
        Bogotá D.C.
      </div>
    </div>

    <div class="space-y-2 flex-1 text-xs">
      <div class="flex items-start gap-2.5">
        <Icon
          name="ph:map-pin"
          class="text-kenko-primary text-base mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <div>
          <p class="font-bold text-slate-800">Sede Principal Chicó - Bogotá</p>
          <p class="text-slate-600">Cra. 11 # 94-05, Chapinero Norte</p>
        </div>
      </div>
      <div class="flex items-center gap-2.5 text-slate-600">
        <Icon name="ph:clock" class="text-slate-400 text-base shrink-0" aria-hidden="true" />
        <span>Lunes a Viernes: 6:00 AM - 8:00 PM | Sáb: 7:00 AM - 1:00 PM</span>
      </div>
      <div class="flex items-center gap-2.5 text-slate-600">
        <Icon
          name="ph:phone-call"
          class="text-slate-400 text-base shrink-0"
          aria-hidden="true"
        />
        <span>Línea directa citas: (601) 745-9000 Ext. 102</span>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 mt-4 pt-2 border-t border-slate-100">
      <button
        class="w-full py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
        type="button"
      >
        <Icon name="ph:navigation-arrow" class="text-sm" aria-hidden="true" />
        Cómo llegar
      </button>
      <button
        class="w-full py-2 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-rose-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
        type="button"
      >
        <Icon name="ph:first-aid" class="text-sm" aria-hidden="true" />
        Urgencias Kenko
      </button>
    </div>
  </section>
</template>
