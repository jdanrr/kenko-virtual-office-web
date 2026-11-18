import { z } from "zod";

import { normalizeDocumentNumber } from "./schemas";
import { DOCUMENT_TYPES, GENDERS, type RegisterRequest } from "./types";

/**
 * Validación del registro, un schema por paso del wizard.
 * Fuente de verdad: `docs/auth-service.md` §3.1 + análisis del backend
 * (nombres solo `trim`, normalización explícita de documento/email/teléfono).
 * Debe seguir siendo server-safe (sin APIs de navegador): lo importa el BFF.
 * Los mensajes explican cómo corregirlo (contrato §4, accesibilidad).
 */

/** §3.1 lista negra de contraseñas (comparación insensible a mayúsculas). */
export const PASSWORD_BLACKLIST = [
  "password",
  "password123",
  "12345678",
  "123456789",
  "qwerty123",
  "colombia123",
  "kenko1234",
] as const;

export function isBlacklistedPassword(password: string): boolean {
  return (PASSWORD_BLACKLIST as ReadonlyArray<string>).includes(
    password.toLowerCase(),
  );
}

/** §3.1 normalización a E.164: sin separadores, `00`→`+`, 10 díg. `3…`→`+57`. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[\s\-.,()]/g, "");
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (/^3\d{9}$/.test(digits)) return `+57${digits}`;
  return digits;
}

/** Fecha ISO `YYYY-MM-DD` de hoy en UTC (comparación lexicográfica segura). */
function todayIsoUtc(): string {
  const now = new Date();
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
}

/** Límites del input de fecha (misma fuente que la validación). */
export function birthDateLimits(): { min: string; max: string } {
  return { min: minBirthDateIso(), max: todayIsoUtc() };
}

/** `YYYY-MM-DD` hace 120 años (límite del contrato §3.1). */
function minBirthDateIso(): string {
  const now = new Date();
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${now.getUTCFullYear() - 120}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
}

/** Rechaza fechas inexistentes como `2024-02-30`. */
function isRealCalendarDate(iso: string): boolean {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
  );
}

const personName = (label: string): z.ZodType<string, string> =>
  z
    .string({ error: `Escribe tu ${label}.` })
    .trim()
    .min(1, `Escribe tu ${label}.`)
    .max(100, `Tu ${label} no puede tener más de 100 caracteres.`)
    .refine((value) => /\p{L}/u.test(value), `Tu ${label} debe tener al menos una letra.`);

export const documentStepSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES, { error: "Elige tu tipo de documento." }),
  documentNumber: z
    .string({ error: "Escribe tu número de documento, sin puntos ni guiones." })
    .transform(normalizeDocumentNumber)
    .pipe(
      z
        .string()
        .min(1, "Escribe tu número de documento, sin puntos ni guiones.")
        .min(4, "El número debe tener entre 4 y 20 letras o números.")
        .max(20, "El número debe tener entre 4 y 20 letras o números.")
        .regex(/^[A-Z0-9]+$/, "Usa solo letras y números, sin puntos ni guiones."),
    ),
});

export const personalStepSchema = z.object({
  firstName: personName("nombre"),
  lastName: personName("apellido"),
  birthDate: z
    .string({ error: "Escribe tu fecha de nacimiento." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Usa el formato año-mes-día (por ejemplo, 1995-03-21).")
    .refine(isRealCalendarDate, "Esa fecha no existe en el calendario. Revísala.")
    .refine(
      (value) => value <= todayIsoUtc(),
      "La fecha no puede ser futura.",
    )
    .refine(
      (value) => value >= minBirthDateIso(),
      "La fecha no puede ser de hace más de 120 años.",
    ),
  gender: z.enum(GENDERS, { error: "Elige tu género registrado." }),
});

export const contactStepSchema = z.object({
  email: z
    .string({ error: "Escribe tu correo electrónico." })
    .trim()
    .toLowerCase()
    .pipe(
      z
        .string()
        .min(1, "Escribe tu correo electrónico.")
        .max(254, "El correo no puede tener más de 254 caracteres.")
        .email("Revisa el correo: debe tener un formato válido (nombre@dominio.com)."),
    ),
  phone: z
    .string({ error: "Escribe tu número de celular de 10 dígitos." })
    .transform(normalizePhone)
    .pipe(
      z
        .string()
        .regex(
          /^\+[1-9]\d{7,14}$/,
          "Revisa el celular: usa 10 dígitos que empiecen por 3 (por ejemplo, 300 123 4567).",
        ),
    ),
  addressLine: z
    .string({ error: "Escribe tu dirección de residencia." })
    .trim()
    .min(1, "Escribe tu dirección de residencia.")
    .max(200, "La dirección no puede tener más de 200 caracteres."),
  city: z
    .string({ error: "Escribe tu ciudad o municipio." })
    .trim()
    .min(1, "Escribe tu ciudad o municipio.")
    .max(100, "La ciudad no puede tener más de 100 caracteres."),
});

const passwordSchema = z
  .string({ error: "Crea una contraseña." })
  .min(8, "La contraseña debe tener mínimo 8 caracteres (máximo 128).")
  .max(128, "La contraseña debe tener mínimo 8 caracteres (máximo 128).")
  .refine(
    (value) => !isBlacklistedPassword(value),
    "Esa contraseña es muy común. Elige otra más difícil de adivinar.",
  );

/** Política de contraseña §3.1 (reutilizable: register, change, reset). */
export { passwordSchema };

/** Par contraseña + confirmación (política §3.1, reutilizable en reset §3.6). */
export const passwordFieldsSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string({ error: "Repite la contraseña para confirmarla." }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden.",
  });

const consentSchema = z.object({
  ley1581: z.literal(true, {
    error: "Debes aceptar el tratamiento de tus datos para continuar.",
  }),
});

export const securityStepSchema = z.intersection(passwordFieldsSchema, consentSchema);

/** Los 4 pasos juntos (validación de la UI, incluye consentimientos). */
export const registerSchema = z.intersection(
  z.intersection(documentStepSchema, personalStepSchema),
  z.intersection(contactStepSchema, securityStepSchema),
);

/** Valores del wizard (entrada sin normalizar). */
export type RegisterFormValues = z.input<typeof registerSchema>;

/**
 * Formato de cable: los 12 campos que viajan al BFF/microservicio.
 * Sin el consentimiento de la UI (`ley1581`); con
 * `confirmPassword` (el backend la exige idéntica). Zod descarta
 * las claves desconocidas, así que acepta los valores del wizard tal cual.
 */
export const registerPayloadSchema = z.intersection(
  z.intersection(documentStepSchema, personalStepSchema),
  z.intersection(contactStepSchema, passwordFieldsSchema),
);

/**
 * Puente explícito al contrato: normaliza y deja solo los 12 campos.
 * Lo usan el cliente y el BFF (misma fuente, imposible que diverjan).
 * Si deja de compilar, el schema divergió del contrato.
 */
export function toRegisterRequest(values: RegisterFormValues): RegisterRequest | null {
  const parsed = registerPayloadSchema.safeParse(values);
  return parsed.success ? parsed.data : null;
}
