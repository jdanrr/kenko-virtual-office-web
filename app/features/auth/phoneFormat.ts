/**
 * Formato visual del celular colombiano (300 123 4567).
 * Solo presentación: la normalización a E.164 vive en `registerSchemas`.
 */

/** Agrupa los 10 dígitos para lectura (300 123 4567). */
export function formatPhoneDisplay(value: string): string {
  const raw = value.replace(/\D/g, "");
  const digits = raw.length === 12 && raw.startsWith("57") ? raw.slice(2) : raw;
  const ten = digits.slice(0, 10);
  if (ten.length > 6) return `${ten.slice(0, 3)} ${ten.slice(3, 6)} ${ten.slice(6)}`;
  if (ten.length > 3) return `${ten.slice(0, 3)} ${ten.slice(3)}`;
  return ten;
}
