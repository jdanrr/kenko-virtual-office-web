import { z } from "zod";

import { DOCUMENT_TYPES, type LoginRequest } from "./types";

/**
 * Validación del formulario de login.
 * Fuente de verdad: `docs/auth-service.md` §3.2.
 * Debe seguir siendo server-safe (sin APIs de navegador): lo importa el BFF.
 * Reglas: tipo en `CC|TI|CE|PA`, número normalizado `^[A-Z0-9]{4,20}$`,
 * contraseña solo "no vacía" (1–128, sin reglas de complejidad al validar).
 * Los mensajes explican cómo corregirlo (contrato §4, accesibilidad).
 */

/**
 * Normaliza igual que el backend (§3.1–§3.2):
 * mayúsculas, sin espacios/puntos/guiones/comas/paréntesis.
 */
export function normalizeDocumentNumber(raw: string): string {
  return raw.toUpperCase().replace(/[\s.,\-()]/g, "");
}

const documentNumberMessage = {
  empty: "Escribe tu número de documento, sin puntos ni guiones.",
  length: "El número debe tener entre 4 y 20 letras o números.",
  charset: "Usa solo letras y números, sin puntos ni guiones.",
} as const;

export const loginSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES, {
    error: "Elige tu tipo de documento.",
  }),
  documentNumber: z
    .string({ error: documentNumberMessage.empty })
    .transform(normalizeDocumentNumber)
    .pipe(
      z
        .string()
        .min(1, documentNumberMessage.empty)
        .min(4, documentNumberMessage.length)
        .max(20, documentNumberMessage.length)
        .regex(/^[A-Z0-9]+$/, documentNumberMessage.charset),
    ),
  password: z
    .string({ error: "Escribe tu contraseña." })
    .min(1, "Escribe tu contraseña.")
    .max(128, "La contraseña no puede tener más de 128 caracteres."),
});

/** Valores del formulario (entrada sin normalizar). */
export type LoginFormValues = z.input<typeof loginSchema>;

/**
 * Payload normalizado listo para la API.
 * Es asignable a `LoginRequest` del contrato.
 */
export type LoginPayload = z.output<typeof loginSchema>;

/**
 * Puente explícito al contrato: el payload normalizado cumple `LoginRequest`.
 * Si esta función deja de compilar, el schema divergió del contrato.
 */
export function toLoginRequest(payload: LoginPayload): LoginRequest {
  return payload;
}
