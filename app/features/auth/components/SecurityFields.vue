<script setup lang="ts">
import { computed } from "vue";

import { isBlacklistedPassword } from "../registerSchemas";
import PasswordField from "./PasswordField.vue";

/**
 * Paso 4: contraseña, confirmación y consentimientos.
 * El checklist refleja SOLO las reglas del contrato §3.1
 * (8–128, no común, coinciden). Reutiliza `PasswordField`.
 */
const props = defineProps<{
  password: string;
  confirmPassword: string;
  ley1581: boolean;
  notifications: boolean;
  errors?: Partial<
    Record<"password" | "confirmPassword" | "ley1581", string>
  >;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:password": [value: string];
  "update:confirmPassword": [value: string];
  "update:ley1581": [value: boolean];
  "update:notifications": [value: boolean];
}>();

const lengthOk = computed(
  () => props.password.length >= 8 && props.password.length <= 128,
);
const commonOk = computed(
  () => props.password.length > 0 && !isBlacklistedPassword(props.password),
);
const matchOk = computed(
  () => props.confirmPassword.length > 0 && props.password === props.confirmPassword,
);

const CHECKS = computed(() => [
  { ok: lengthOk.value, label: "Mínimo 8 caracteres (máximo 128)" },
  { ok: commonOk.value, label: "No es una contraseña común o bloqueada" },
  { ok: matchOk.value, label: "Las contraseñas coinciden" },
]);
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <PasswordField
        :model-value="props.password"
        label="Contraseña de acceso"
        input-name="password"
        autocomplete="new-password"
        placeholder="8 a 128 caracteres"
        :error="props.errors?.password"
        :disabled="props.disabled"
        @update:model-value="emit('update:password', $event)"
      />
      <div class="flex flex-col gap-1.5">
        <PasswordField
          :model-value="props.confirmPassword"
          label="Confirmar contraseña"
          input-name="confirmPassword"
          autocomplete="new-password"
          placeholder="Repite la contraseña"
          :error="props.errors?.confirmPassword"
          :disabled="props.disabled"
          @update:model-value="emit('update:confirmPassword', $event)"
        />
      </div>
    </div>

    <ul aria-label="Requisitos de la contraseña" class="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <li
        v-for="check in CHECKS"
        :key="check.label"
        class="flex items-center gap-1.5 text-xs"
        :class="check.ok ? 'text-primary font-medium' : 'text-zinc-600'"
      >
        <svg
          class="w-4 h-4 flex-shrink-0"
          :class="check.ok ? 'text-primary' : 'text-zinc-400'"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            v-if="check.ok"
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
            clip-rule="evenodd"
          />
          <path
            v-else
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
            clip-rule="evenodd"
          />
        </svg>
        {{ check.label }}
      </li>
    </ul>

    <div class="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80">
      <div class="flex items-start gap-3">
        <input
          id="register-ley1581"
          class="w-5 h-5 rounded text-primary border-zinc-300 focus:ring-secondary cursor-pointer mt-0.5"
          type="checkbox"
          name="ley1581"
          :checked="props.ley1581"
          :disabled="props.disabled"
          :aria-invalid="!!props.errors?.ley1581"
          :aria-describedby="props.errors?.ley1581 ? 'ley1581-error' : undefined"
          @change="emit('update:ley1581', ($event.target as HTMLInputElement).checked)"
        >
        <label
          for="register-ley1581"
          class="font-body text-xs sm:text-sm text-content cursor-pointer select-none"
        >
          <strong class="block mb-1 text-primary">
            Autorizo el tratamiento de mis datos personales (Ley 1581 de 2012)
          </strong>
          Acepto de manera previa, expresa e informada el tratamiento de mis datos
          personales y de salud por parte de <strong>Kenko EPS</strong> para la gestión
          de mi aseguramiento en salud.
        </label>
      </div>
      <p
        v-if="props.errors?.ley1581"
        id="ley1581-error"
        class="mt-2 pl-8 text-xs font-semibold text-[#ba1a1a]"
      >
        {{ props.errors.ley1581 }}
      </p>
    </div>

    <div class="flex items-start gap-3">
      <input
        id="register-notifications"
        class="w-5 h-5 rounded text-primary border-zinc-300 focus:ring-secondary cursor-pointer mt-0.5"
        type="checkbox"
        name="notifications"
        :checked="props.notifications"
        :disabled="props.disabled"
        @change="emit('update:notifications', ($event.target as HTMLInputElement).checked)"
      >
      <label
        for="register-notifications"
        class="font-body text-xs sm:text-sm text-zinc-600 cursor-pointer select-none"
      >
        Deseo recibir recordatorios de citas y autorizaciones por SMS y WhatsApp. (Opcional)
      </label>
    </div>
  </div>
</template>
