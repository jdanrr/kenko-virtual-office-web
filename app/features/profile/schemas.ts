import { z } from "zod";

import type { PatchProfileRequest } from "./types";

/**
 * Validación del PATCH de profile (`PATCH /profiles/{id}`).
 * Fuente de verdad: equipo backend Profile (solo `phone` y
 * `address.{line,city}`; `address` exige `line + city` juntos;
 * body vacío e inmutables/desconocidos como `email`/`password` dan `400`).
 * Debe seguir siendo server-safe (sin APIs de navegador).
 * Los mensajes explican cómo corregirlo (contrato §4, accesibilidad).
 */

/**
 * Normalización a E.164, igual que registro (`registerSchemas`).
 * Sin separadores, `00`→`+`, 10 díg. `3…`→`+57`.
 * Local a profile para no importar otra feature.
 */
export function normalizeProfilePhone(raw: string): string {
  const digits = raw.trim().replace(/[\s\-.,()]/g, "");
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (/^3\d{9}$/.test(digits)) return `+57${digits}`;
  return digits;
}

const phoneField = z
  .string({ error: "Escribe tu número de celular de 10 dígitos." })
  .transform(normalizeProfilePhone)
  .pipe(
    z
      .string()
      .regex(
        /^\+[1-9]\d{7,14}$/,
        "Revisa el celular: usa 10 dígitos que empiecen por 3 (por ejemplo, 300 123 4567).",
      ),
  );

const addressLineField = z
  .string({ error: "Escribe tu dirección de residencia." })
  .trim()
  .min(1, "Escribe tu dirección de residencia.")
  .max(200, "La dirección no puede tener más de 200 caracteres.");

const cityField = z
  .string({ error: "Escribe tu ciudad o municipio." })
  .trim()
  .min(1, "Escribe tu ciudad o municipio.")
  .max(100, "La ciudad no puede tener más de 100 caracteres.");

const addressPatchSchema = z.strictObject({
  line: addressLineField,
  city: cityField,
});

/**
 * Cuerpo PATCH: solo `phone` y/o `address` completo.
 * `.strict()` rechaza inmutables/desconocidos (`email`, `password`, …)
 * igual que el backend (`400 patch contains immutable or unknown fields`).
 */
export const profilePatchSchema = z
  .strictObject({
    phone: phoneField.optional(),
    address: addressPatchSchema.optional(),
  })
  .refine((value) => value.phone !== undefined || value.address !== undefined, {
    message: "No hay cambios para guardar.",
  });

/** Valores del formulario (entrada sin normalizar). */
export type ProfilePatchFormValues = z.input<typeof profilePatchSchema>;

/** Payload normalizado listo para la API. */
export type ProfilePatchPayload = z.output<typeof profilePatchSchema>;

/**
 * Puente explícito al contrato: normaliza y deja solo `phone`/`address`.
 * Si esta función deja de compilar, el schema divergió del contrato.
 */
export function toPatchRequest(values: ProfilePatchFormValues): PatchProfileRequest | null {
  const parsed = profilePatchSchema.safeParse(values);
  if (!parsed.success) return null;
  const payload: ProfilePatchPayload = parsed.data;
  return payload;
}
