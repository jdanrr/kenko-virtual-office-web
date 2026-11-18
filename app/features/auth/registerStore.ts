import { defineStore } from "pinia";

import { failureFromUnknown, fieldsFromIssues, register } from "./api";
import type { AuthFailure, FieldErrors } from "./api";
import {
  contactStepSchema,
  documentStepSchema,
  personalStepSchema,
  securityStepSchema,
  type RegisterFormValues,
} from "./registerSchemas";
import type { RegisterSuccess } from "./types";

/**
 * Borrador y navegación del wizard de registro (4 pasos).
 * Fuente de verdad: `docs/auth-service.md` §3.1.
 *
 * - Vive **solo en memoria**: al recargar se pierde y se empieza de cero.
 * - Separado de `useAuthStore` (sesión): registrarse no inicia sesión.
 * - Avanzar valida cada paso intermedio; retroceder es siempre libre.
 * - Los errores `validation` (cliente o `details` del servidor) se pintan
 *   por campo; el wizard salta al primer paso con error.
 */
export type RegisterStep = 1 | 2 | 3 | 4;

export const REGISTER_STEPS: RegisterStep[] = [1, 2, 3, 4];

const STEP_FIELDS: Record<RegisterStep, string[]> = {
  1: ["documentType", "documentNumber"],
  2: ["firstName", "lastName", "birthDate", "gender"],
  3: ["email", "phone", "addressLine", "city"],
  4: ["password", "confirmPassword", "ley1581"],
};

const STEP_SCHEMAS = {
  1: documentStepSchema,
  2: personalStepSchema,
  3: contactStepSchema,
  4: securityStepSchema,
} as const;

type StepUpdate =
  | { ok: true }
  | { ok: false; fields: FieldErrors };

interface RegisterWizardState {
  currentStep: RegisterStep;
  data: Partial<RegisterFormValues>;
  lastFailure: AuthFailure | null;
  result: RegisterSuccess | null;
  submitting: boolean;
}

function pickStepValues(
  data: Partial<RegisterFormValues>,
  step: RegisterStep,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of STEP_FIELDS[step]) {
    values[field] = (data as Record<string, unknown>)[field];
  }
  return values;
}

function validationFailure(fields: FieldErrors): AuthFailure {
  return { kind: "validation", message: "Revisa los datos ingresados.", fields };
}

/** Primer paso (en orden) que tenga alguno de estos campos con error. */
function firstStepWithErrors(fields: FieldErrors): RegisterStep {
  for (const step of REGISTER_STEPS) {
    if (STEP_FIELDS[step].some((field) => field in fields)) return step;
  }
  return 1;
}

export const useRegisterStore = defineStore("register", {
  state: (): RegisterWizardState => ({
    currentStep: 1,
    data: {},
    lastFailure: null,
    result: null,
    submitting: false,
  }),
  getters: {
    isSucceeded: (state): boolean => state.result !== null,
    /** Errores del paso visible (cliente o servidor). */
    stepFields: (state): FieldErrors => {
      const fields = state.lastFailure?.fields ?? {};
      const visible: FieldErrors = {};
      for (const field of STEP_FIELDS[state.currentStep]) {
        if (field in fields) visible[field] = fields[field];
      }
      return visible;
    },
  },
  actions: {
    /** Guarda el paso si valida; si no, expone `fields` sin avanzar. */
    updateStep(step: RegisterStep, values: unknown): StepUpdate {
      const parsed = STEP_SCHEMAS[step].safeParse(values);
      if (!parsed.success) {
        const fields = fieldsFromIssues(parsed.error.issues);
        this.lastFailure = validationFailure(fields);
        return { ok: false, fields };
      }
      this.data = { ...this.data, ...parsed.data };
      this.clearStepErrors(step);
      return { ok: true };
    },
    /** Retroceder es libre; avanzar valida cada paso intermedio. */
    goToStep(target: RegisterStep): boolean {
      if (target === this.currentStep) return true;
      if (target < this.currentStep) {
        this.currentStep = target;
        return true;
      }
      for (let step = this.currentStep; step < target; step++) {
        const current = step as RegisterStep;
        const parsed = STEP_SCHEMAS[current].safeParse(
          pickStepValues(this.data, current),
        );
        if (!parsed.success) {
          const fields = fieldsFromIssues(parsed.error.issues);
          this.lastFailure = validationFailure(fields);
          this.currentStep = current;
          return false;
        }
        this.data = { ...this.data, ...parsed.data };
      }
      this.currentStep = target;
      return true;
    },
    next(): boolean {
      if (this.currentStep >= 4) return false;
      return this.goToStep((this.currentStep + 1) as RegisterStep);
    },
    prev(): void {
      if (this.currentStep > 1) {
        this.currentStep = (this.currentStep - 1) as RegisterStep;
      }
    },
    /** Envía solo desde el paso 4 con los 4 pasos válidos. */
    async submit(): Promise<boolean> {
      if (this.submitting || this.result) return false;
      this.submitting = true;
      this.lastFailure = null;
      try {
        const merged: Record<string, unknown> = {};
        for (const step of REGISTER_STEPS) {
          const parsed = STEP_SCHEMAS[step].safeParse(pickStepValues(this.data, step));
          if (!parsed.success) {
            const fields = fieldsFromIssues(parsed.error.issues);
            this.lastFailure = validationFailure(fields);
            this.currentStep = step;
            return false;
          }
          Object.assign(merged, parsed.data);
        }
        this.result = await register(merged as RegisterFormValues);
        return true;
      } catch (error) {
        const failure = failureFromUnknown(error);
        this.lastFailure = failure;
        if (failure.kind === "validation" && failure.fields) {
          this.currentStep = firstStepWithErrors(failure.fields);
        }
        return false;
      } finally {
        this.submitting = false;
      }
    },
    reset(): void {
      this.currentStep = 1;
      this.data = {};
      this.lastFailure = null;
      this.result = null;
      this.submitting = false;
    },
    clearStepErrors(step: RegisterStep): void {
      const fields = this.lastFailure?.fields;
      if (!fields) return;
      const remaining: FieldErrors = {};
      for (const [field, message] of Object.entries(fields)) {
        if (!STEP_FIELDS[step].includes(field)) remaining[field] = message;
      }
      this.lastFailure = { ...this.lastFailure, fields: remaining } as AuthFailure;
    },
  },
});
