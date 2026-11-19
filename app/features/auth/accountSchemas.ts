import { z } from "zod";

import { passwordSchema } from "./registerSchemas";
import type {
  ChangeEmailRequest,
  ChangePasswordRequest,
} from "./types";

/**
 * Cambio autenticado de contraseña y correo (microservicio Auth, vía BFF).
 * Fuente de verdad: guía del equipo Auth (`password/change`, `email/change`).
 * Debe seguir siendo server-safe (sin APIs de navegador): lo importa el BFF.
 * La `confirmNewPassword` solo existe en la UI (el backend no la recibe);
 * los puentes `toXRequest()` fallan en compilación si divergen del contrato.
 */

/** La contraseña actual solo se exige no vacía (la verifica el backend). */
const currentPasswordField = z
  .string({ error: "Escribe tu contraseña actual." })
  .min(1, "Escribe tu contraseña actual.")
  .max(128, "La contraseña actual no puede tener más de 128 caracteres.");

/** Formato de cable (sin la confirmación de la UI; lo valida el BFF). */
export const changePasswordPayloadSchema = z.object({
  currentPassword: currentPasswordField,
  /** Misma política §3.1 (8–128 + lista negra, reutilizada, no duplicada). */
  newPassword: passwordSchema,
});

/** Formulario de cambio de contraseña (confirmación solo en UI). */
export const changePasswordFormSchema = z
  .object({
    currentPassword: currentPasswordField,
    newPassword: passwordSchema,
    confirmNewPassword: z.string({ error: "Repite la nueva contraseña para confirmarla." }),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "Las contraseñas no coinciden.",
  });

/** Valores del formulario (entrada sin normalizar). */
export type ChangePasswordFormValues = z.input<typeof changePasswordFormSchema>;

/**
 * Puente explícito al contrato: valida la forma de cable y deja fuera
 * la confirmación de la UI. Si deja de compilar, el schema divergió.
 */
export function toChangePasswordRequest(
  values: ChangePasswordFormValues,
): ChangePasswordRequest | null {
  const parsed = changePasswordPayloadSchema.safeParse(values);
  if (!parsed.success) return null;
  const payload: ChangePasswordRequest = parsed.data;
  return payload;
}

const newEmailField = z
  .string({ error: "Escribe tu nuevo correo electrónico." })
  .trim()
  .toLowerCase()
  .pipe(
    z
      .string()
      .min(1, "Escribe tu nuevo correo electrónico.")
      .max(254, "El correo no puede tener más de 254 caracteres.")
      .email("Revisa el correo: debe tener un formato válido (nombre@dominio.com)."),
  );

/** Formulario y cuerpo de cambio de correo (misma forma que el cable). */
export const changeEmailSchema = z.object({
  newEmail: newEmailField,
  currentPassword: currentPasswordField,
});

/** Valores del formulario (entrada sin normalizar). */
export type ChangeEmailFormValues = z.input<typeof changeEmailSchema>;

/**
 * Puente explícito al contrato: normaliza igual que el backend
 * (`trim` + minúsculas). Si deja de compilar, el schema divergió.
 */
export function toChangeEmailRequest(
  values: ChangeEmailFormValues,
): ChangeEmailRequest | null {
  const parsed = changeEmailSchema.safeParse(values);
  if (!parsed.success) return null;
  const payload: ChangeEmailRequest = parsed.data;
  return payload;
}
