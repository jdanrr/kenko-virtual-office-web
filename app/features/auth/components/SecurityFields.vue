<script setup lang="ts">
import PasswordChecklist from "./PasswordChecklist.vue";
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
  errors?: Partial<
    Record<"password" | "confirmPassword" | "ley1581", string>
  >;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:password": [value: string];
  "update:confirmPassword": [value: string];
  "update:ley1581": [value: boolean];
}>();
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

    <PasswordChecklist
      :password="props.password"
      :confirm-password="props.confirmPassword"
    />

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
  </div>
</template>
