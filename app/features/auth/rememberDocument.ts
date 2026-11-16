import { DOCUMENT_TYPES, type DocumentType } from "./types";

/**
 * "Recordar mi documento en este equipo de confianza".
 * Guarda SOLO tipo + número (nunca contraseña ni tokens) en `localStorage`,
 * únicamente con consentimiento explícito (checkbox). SSR-safe.
 */
export interface RememberedDocument {
  documentType: DocumentType;
  documentNumber: string;
}

const STORAGE_KEY = "kenko.auth.rememberedDocument";

function storage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function isDocumentType(value: unknown): value is DocumentType {
  return (
    typeof value === "string" &&
    (DOCUMENT_TYPES as ReadonlyArray<string>).includes(value)
  );
}

export function loadRememberedDocument(): RememberedDocument | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RememberedDocument>;
    if (!isDocumentType(parsed.documentType)) return null;
    if (typeof parsed.documentNumber !== "string" || parsed.documentNumber === "") {
      return null;
    }
    return {
      documentType: parsed.documentType,
      documentNumber: parsed.documentNumber,
    };
  } catch {
    return null;
  }
}

export function saveRememberedDocument(document: RememberedDocument): void {
  storage()?.setItem(STORAGE_KEY, JSON.stringify(document));
}

export function clearRememberedDocument(): void {
  storage()?.removeItem(STORAGE_KEY);
}
