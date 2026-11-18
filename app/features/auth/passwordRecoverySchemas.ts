import { z } from "zod";

import {
  documentStepSchema,
  passwordFieldsSchema,
} from "./registerSchemas";
import type {
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "./types";

/**
 * Validación de recuperación de contraseña (§3.5 forgot, §3.6 reset).
 * Fuente de verdad: `docs/auth-service.md`.
 * Debe seguir siendo server-safe (sin APIs de navegador): lo importa el BFF.
 * La política de contraseña es la misma §3.1 (8–128 + lista negra);
 * el "nueva ≠ actual" lo valida el backend (no tenemos la actual).
 */

/** §3.5: mismo documento normalizado que login/registro. */
export const forgotPasswordSchema = documentStepSchema;

/** Valores del formulario de solicitud (entrada sin normalizar). */
export type ForgotPasswordFormValues = z.input<typeof forgotPasswordSchema>;

export function toForgotRequest(
  values: ForgotPasswordFormValues,
): ForgotPasswordRequest | null {
  const parsed = forgotPasswordSchema.safeParse(values);
  return parsed.success ? parsed.data : null;
}

export const resetPasswordSchema = z.intersection(
  z.object({
    token: z
      .string({ error: "El enlace no es válido. Pide uno nuevo." })
      .min(1, "El enlace no es válido. Pide uno nuevo."),
  }),
  passwordFieldsSchema,
);

/** Valores del formulario de restablecimiento (token ya extraído). */
export type ResetPasswordFormValues = z.input<typeof resetPasswordSchema>;

export function toResetRequest(
  values: ResetPasswordFormValues,
): ResetPasswordRequest | null {
  const parsed = resetPasswordSchema.safeParse(values);
  return parsed.success ? parsed.data : null;
}

/**
 * Extrae el token opaco del fragmento del enlace (`#token=…`).
 * Pura y testeable: la página le pasa `window.location.hash`.
 * El fragmento nunca sale del navegador salvo en el body del reset.
 */
export function tokenFromFragment(hash: string): string | null {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  const token = new URLSearchParams(fragment).get("token");
  return token !== null && token.length > 0 ? token : null;
}
