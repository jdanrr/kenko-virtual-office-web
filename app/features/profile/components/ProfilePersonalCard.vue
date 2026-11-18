<script setup lang="ts">
import type { Profile } from "../types";
import {
  formatAffiliationDate,
  formatBirthDate,
  formatDocument,
  formatFullName,
  formatGender,
} from "../profileView";

/** Tarjeta 1: datos personales (solo lectura, registro oficial). */
const props = defineProps<{ profile: Profile }>();
</script>

<template>
  <section
    aria-labelledby="profile-personal-title"
    class="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200/80 shadow-sm flex flex-col gap-4"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div
          aria-hidden="true"
          class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"
        >
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="8.5" cy="11" r="2" />
            <path d="M5.5 16.5c.6-1.4 1.6-2 3-2s2.4.6 3 2M14 9.5h4M14 13h4" stroke-linecap="round" />
          </svg>
        </div>
        <div>
          <h2 id="profile-personal-title" class="font-display text-lg font-bold text-content leading-tight">
            Datos personales
          </h2>
          <p class="font-body text-xs text-zinc-500">Registro oficial de afiliación</p>
        </div>
      </div>
      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 font-body text-[11px] font-bold text-zinc-500">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 018 0v3" stroke-linecap="round" />
        </svg>
        Solo lectura
      </span>
    </div>

    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div class="sm:col-span-2 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/60">
        <dt class="font-body text-xs text-zinc-500 font-medium">Nombres y apellidos</dt>
        <dd class="font-display text-base font-bold text-content mt-0.5">
          {{ formatFullName(props.profile.first_name, props.profile.last_name) }}
        </dd>
      </div>
      <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/60">
        <dt class="font-body text-xs text-zinc-500 font-medium">Documento de identidad</dt>
        <dd class="font-display text-base font-bold text-content mt-0.5">
          {{ formatDocument(props.profile.document_type, props.profile.document_number) }}
        </dd>
      </div>
      <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/60">
        <dt class="font-body text-xs text-zinc-500 font-medium">Fecha de nacimiento</dt>
        <dd class="font-display text-base font-bold text-content mt-0.5">
          {{ formatBirthDate(props.profile.birth_date) }}
        </dd>
      </div>
      <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/60">
        <dt class="font-body text-xs text-zinc-500 font-medium">Género registrado</dt>
        <dd class="font-display text-base font-bold text-content mt-0.5">
          {{ formatGender(props.profile.gender) }}
        </dd>
      </div>
      <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/60">
        <dt class="font-body text-xs text-zinc-500 font-medium">Fecha de afiliación</dt>
        <dd class="font-display text-base font-bold text-content mt-0.5">
          {{ formatAffiliationDate(props.profile.created_at) }}
        </dd>
      </div>
    </dl>

    <p class="font-body text-xs text-zinc-600 leading-relaxed rounded-xl bg-zinc-50 border border-zinc-200/60 p-3">
      Por seguridad, para cambiar nombres o documento debes pedir validación
      presencial en tu sede Kenko.
    </p>
  </section>
</template>
