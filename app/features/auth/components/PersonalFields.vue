<script setup lang="ts">
import { computed, useId } from "vue";

import { birthDateLimits } from "../registerSchemas";
import type { Gender } from "../types";

/**
 * Paso 2: nombres, fecha de nacimiento y género.
 * Componente tonto: valida el store; aquí solo props + emits.
 */
const props = defineProps<{
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: Gender | "";
  errors?: Partial<Record<"firstName" | "lastName" | "birthDate" | "gender", string>>;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:firstName": [value: string];
  "update:lastName": [value: string];
  "update:birthDate": [value: string];
  "update:gender": [value: Gender];
}>();

const GENDERS: Array<{ value: Gender; label: string }> = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Femenino" },
  { value: "other", label: "Otro" },
];

const firstNameId = useId();
const lastNameId = useId();
const birthDateId = useId();
const limits = birthDateLimits();

const describedBy = (field: keyof NonNullable<typeof props.errors>): string | undefined =>
  props.errors?.[field] ? `${field}-error` : undefined;

const genderDescribedBy = computed(() => describedBy("gender"));
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
    <div class="flex flex-col gap-1.5">
      <label class="font-display text-sm font-bold text-content" :for="firstNameId">
        Nombres
      </label>
      <input
        :id="firstNameId"
        class="w-full h-12 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-content font-body text-sm placeholder:text-zinc-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
        :class="{ 'border-[#ba1a1a] focus:border-[#ba1a1a]': props.errors?.firstName }"
        type="text"
        name="firstName"
        autocomplete="given-name"
        maxlength="100"
        placeholder="Ej. Carlos Alberto"
        :value="props.firstName"
        :disabled="props.disabled"
        :aria-invalid="!!props.errors?.firstName"
        :aria-describedby="describedBy('firstName')"
        @input="emit('update:firstName', ($event.target as HTMLInputElement).value)"
      >
      <p
        v-if="props.errors?.firstName"
        id="firstName-error"
        class="text-xs font-semibold text-[#ba1a1a]"
      >
        {{ props.errors.firstName }}
      </p>
    </div>

    <div class="flex flex-col gap-1.5">
      <label class="font-display text-sm font-bold text-content" :for="lastNameId">
        Apellidos
      </label>
      <input
        :id="lastNameId"
        class="w-full h-12 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-content font-body text-sm placeholder:text-zinc-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
        :class="{ 'border-[#ba1a1a] focus:border-[#ba1a1a]': props.errors?.lastName }"
        type="text"
        name="lastName"
        autocomplete="family-name"
        maxlength="100"
        placeholder="Ej. Gómez Restrepo"
        :value="props.lastName"
        :disabled="props.disabled"
        :aria-invalid="!!props.errors?.lastName"
        :aria-describedby="describedBy('lastName')"
        @input="emit('update:lastName', ($event.target as HTMLInputElement).value)"
      >
      <p
        v-if="props.errors?.lastName"
        id="lastName-error"
        class="text-xs font-semibold text-[#ba1a1a]"
      >
        {{ props.errors.lastName }}
      </p>
    </div>

    <div class="flex flex-col gap-1.5">
      <label class="font-display text-sm font-bold text-content" :for="birthDateId">
        Fecha de nacimiento
      </label>
      <input
        :id="birthDateId"
        class="w-full h-12 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-content font-body text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
        :class="{ 'border-[#ba1a1a] focus:border-[#ba1a1a]': props.errors?.birthDate }"
        type="date"
        name="birthDate"
        autocomplete="bday"
        :min="limits.min"
        :max="limits.max"
        :value="props.birthDate"
        :disabled="props.disabled"
        :aria-invalid="!!props.errors?.birthDate"
        :aria-describedby="describedBy('birthDate')"
        @input="emit('update:birthDate', ($event.target as HTMLInputElement).value)"
      >
      <p v-if="!props.errors?.birthDate" class="text-xs text-zinc-500">
        Formato año-mes-día. No acepta fechas futuras ni mayores a 120 años.
      </p>
      <p
        v-if="props.errors?.birthDate"
        id="birthDate-error"
        class="text-xs font-semibold text-[#ba1a1a]"
      >
        {{ props.errors.birthDate }}
      </p>
    </div>

    <fieldset :aria-describedby="genderDescribedBy ?? undefined">
      <legend class="font-display text-sm font-bold text-content mb-1.5">
        Género registrado
      </legend>
      <div class="grid grid-cols-3 gap-2" role="radiogroup">
        <label
          v-for="option in GENDERS"
          :key="option.value"
          class="cursor-pointer min-h-[48px] focus-within:ring-2 focus-within:ring-secondary rounded-xl"
        >
          <input
            class="sr-only"
            type="radio"
            name="gender"
            :value="option.value"
            :checked="props.gender === option.value"
            :disabled="props.disabled"
            @change="emit('update:gender', option.value)"
          >
          <span
            class="py-3 px-2 rounded-xl text-center text-xs sm:text-sm font-semibold border transition-all flex flex-col items-center justify-center gap-1 min-h-[48px]"
            :class="
              props.gender === option.value
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-zinc-50 text-zinc-600 border-zinc-200'
            "
          >
            {{ option.label }}
          </span>
        </label>
      </div>
      <p
        v-if="props.errors?.gender"
        id="gender-error"
        class="mt-1 text-xs font-semibold text-[#ba1a1a]"
      >
        {{ props.errors.gender }}
      </p>
    </fieldset>
  </div>
</template>
