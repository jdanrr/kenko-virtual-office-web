import { describe, expect, it } from "vitest";

import {
  loginSchema,
  normalizeDocumentNumber,
  toLoginRequest,
  type LoginFormValues,
} from "./schemas";
import type { LoginRequest } from "./types";

const valid: LoginFormValues = {
  documentType: "CC",
  documentNumber: "12345678",
  password: "secreta-1",
};

describe("normalizeDocumentNumber", () => {
  it("mayúsculas y sin separadores (igual que el backend §3.1)", () => {
    expect(normalizeDocumentNumber(" 12.345-678,")).toBe("12345678");
    expect(normalizeDocumentNumber("ab 123")).toBe("AB123");
  });
});

describe("loginSchema", () => {
  it("acepta un payload válido y lo normaliza", () => {
    const parsed = loginSchema.safeParse({
      ...valid,
      documentNumber: " 12.345-678 ",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).toEqual({
      documentType: "CC",
      documentNumber: "12345678",
      password: "secreta-1",
    });
    const request: LoginRequest = toLoginRequest(parsed.data);
    expect(request.documentNumber).toBe("12345678");
  });

  it("rechaza tipos fuera del contrato", () => {
    for (const documentType of ["Otro", "XX", "cc"]) {
      const parsed = loginSchema.safeParse({ ...valid, documentType });
      expect(parsed.success).toBe(false);
      if (parsed.success) continue;
      expect(parsed.error.issues[0]?.path).toEqual(["documentType"]);
    }
  });

  it("explica cómo corregir el número por campo", () => {
    const cases: Array<[string, string]> = [
      ["", "Escribe tu número de documento"],
      ["123", "entre 4 y 20"],
      ["123456789012345678901", "entre 4 y 20"],
      ["AB#12", "solo letras y números"],
    ];
    for (const [documentNumber, hint] of cases) {
      const parsed = loginSchema.safeParse({ ...valid, documentNumber });
      expect(parsed.success).toBe(false);
      if (parsed.success) continue;
      expect(parsed.error.issues[0]?.path).toEqual(["documentNumber"]);
      expect(parsed.error.issues[0]?.message).toContain(hint);
    }
  });

  it("la contraseña solo debe ser no vacía (1–128, §3.2)", () => {
    expect(loginSchema.safeParse({ ...valid, password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ ...valid, password: "x".repeat(129) }).success).toBe(
      false,
    );
    expect(loginSchema.safeParse({ ...valid, password: "1" }).success).toBe(true);
  });
});
