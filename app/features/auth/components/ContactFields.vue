<script setup lang="ts">
import { useId } from "vue";

import { formatPhoneDisplay } from "../phoneFormat";

/**
 * Paso 3: contacto y residencia.
 * El teléfono se muestra agrupado (300 123 4567); el store lo normaliza
 * a E.164 al validar. Componente tonto: props + emits.
 */
const props = defineProps<{
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  errors?: Partial<Record<"email" | "phone" | "addressLine" | "city", string>>;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:email": [value: string];
  "update:phone": [value: string];
  "update:addressLine": [value: string];
  "update:city": [value: string];
}>();

const emailId = useId();
const phoneId = useId();
const addressId = useId();
const cityId = useId();

const describedBy = (field: keyof NonNullable<typeof props.errors>): string | undefined =>
  props.errors?.[field] ? `${field}-error` : undefined;

function onPhoneInput(event: Event): void {
  emit("update:phone", formatPhoneDisplay((event.target as HTMLInputElement).value));
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
    <div class="flex flex-col gap-1.5">
      <label class="font-display text-sm font-bold text-content" :for="emailId">
        Correo electrónico
      </label>
      <input
        :id="emailId"
        class="w-full h-12 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-content font-body text-sm placeholder:text-zinc-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
        :class="{ 'border-[#ba1a1a] focus:border-[#ba1a1a]': props.errors?.email }"
        type="email"
        name="email"
        autocomplete="email"
        maxlength="254"
        placeholder="ejemplo@correo.com"
        :value="props.email"
        :disabled="props.disabled"
        :aria-invalid="!!props.errors?.email"
        :aria-describedby="describedBy('email')"
        @input="emit('update:email', ($event.target as HTMLInputElement).value)"
      >
      <p
        v-if="props.errors?.email"
        id="email-error"
        class="text-xs font-semibold text-[#ba1a1a]"
      >
        {{ props.errors.email }}
      </p>
    </div>

    <div class="flex flex-col gap-1.5">
      <label class="font-display text-sm font-bold text-content" :for="phoneId">
        Teléfono móvil
      </label>
      <div class="flex">
        <span
          class="inline-flex items-center px-3 bg-zinc-100 border border-r-0 border-zinc-200 text-content font-medium text-sm rounded-l-xl select-none"
          aria-hidden="true"
        >
          +57
        </span>
        <input
          :id="phoneId"
          class="w-full h-12 px-4 rounded-r-xl bg-zinc-50 border border-zinc-200 text-content font-body text-sm placeholder:text-zinc-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
          :class="{ 'border-[#ba1a1a] focus:border-[#ba1a1a]': props.errors?.phone }"
          type="tel"
          name="phone"
          autocomplete="tel-national"
          inputmode="numeric"
          maxlength="12"
          placeholder="300 123 4567"
          :value="props.phone"
          :disabled="props.disabled"
          :aria-invalid="!!props.errors?.phone"
          :aria-describedby="describedBy('phone')"
          @input="onPhoneInput"
        >
      </div>
      <p v-if="!props.errors?.phone" class="text-xs text-zinc-500">
        Móvil Colombia de 10 dígitos (empieza por 3).
      </p>
      <p
        v-if="props.errors?.phone"
        id="phone-error"
        class="text-xs font-semibold text-[#ba1a1a]"
      >
        {{ props.errors.phone }}
      </p>
    </div>

    <div class="flex flex-col gap-1.5">
      <label class="font-display text-sm font-bold text-content" :for="cityId">
        Ciudad o municipio
      </label>
      <input
        :id="cityId"
        class="w-full h-12 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-content font-body text-sm placeholder:text-zinc-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
        :class="{ 'border-[#ba1a1a] focus:border-[#ba1a1a]': props.errors?.city }"
        type="text"
        name="city"
        autocomplete="address-level2"
        maxlength="100"
        placeholder="Ej. Bogotá D.C."
        :value="props.city"
        :disabled="props.disabled"
        :aria-invalid="!!props.errors?.city"
        :aria-describedby="describedBy('city')"
        @input="emit('update:city', ($event.target as HTMLInputElement).value)"
      >
      <p
        v-if="props.errors?.city"
        id="city-error"
        class="text-xs font-semibold text-[#ba1a1a]"
      >
        {{ props.errors.city }}
      </p>
    </div>

    <div class="flex flex-col gap-1.5">
      <label class="font-display text-sm font-bold text-content" :for="addressId">
        Dirección de residencia
      </label>
      <input
        :id="addressId"
        class="w-full h-12 px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-content font-body text-sm placeholder:text-zinc-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
        :class="{ 'border-[#ba1a1a] focus:border-[#ba1a1a]': props.errors?.addressLine }"
        type="text"
        name="addressLine"
        autocomplete="street-address"
        maxlength="200"
        placeholder="Ej. Calle 72 # 10-34 Apto 402"
        :value="props.addressLine"
        :disabled="props.disabled"
        :aria-invalid="!!props.errors?.addressLine"
        :aria-describedby="describedBy('addressLine')"
        @input="emit('update:addressLine', ($event.target as HTMLInputElement).value)"
      >
      <p
        v-if="props.errors?.addressLine"
        id="addressLine-error"
        class="text-xs font-semibold text-[#ba1a1a]"
      >
        {{ props.errors.addressLine }}
      </p>
    </div>
  </div>
</template>
