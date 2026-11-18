import { describe, expect, it } from "vitest";

import {
  contactStepSchema,
  documentStepSchema,
  isBlacklistedPassword,
  normalizePhone,
  personalStepSchema,
  registerPayloadSchema,
  securityStepSchema,
  toRegisterRequest,
  type RegisterFormValues,
} from "./registerSchemas";

const valid: RegisterFormValues = {
  documentType: "CC",
  documentNumber: " 10.203-040 ",
  firstName: "María Fernanda",
  lastName: "Gómez Rojas",
  birthDate: "1995-03-21",
  gender: "female",
  email: "  MARIA.Gomez@Example.COM ",
  phone: "300 123 4567",
  addressLine: "Cra 15 # 93-60 Apto 402",
  city: " Bogotá D.C. ",
  password: "Clave-segura-1",
  confirmPassword: "Clave-segura-1",
  ley1581: true,
};

describe("normalizePhone", () => {
  it("normaliza como el backend §3.1 (10 díg. 3… → +57)", () => {
    expect(normalizePhone("300 123 4567")).toBe("+573001234567");
    expect(normalizePhone("300-123-4567")).toBe("+573001234567");
    expect(normalizePhone("003001234567")).toBe("+3001234567");
    expect(normalizePhone("+573001234567")).toBe("+573001234567");
  });
});

describe("isBlacklistedPassword", () => {
  it("detecta la lista negra sin importar mayúsculas", () => {
    expect(isBlacklistedPassword("Colombia123")).toBe(true);
    expect(isBlacklistedPassword("KENKO1234")).toBe(true);
    expect(isBlacklistedPassword("Clave-segura-1")).toBe(false);
  });
});

describe("documentStepSchema", () => {
  it("acepta y normaliza el documento", () => {
    const parsed = documentStepSchema.safeParse({
      documentType: "CC",
      documentNumber: " 10.203-040 ",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.documentNumber).toBe("10203040");
  });

  it("rechaza tipos fuera del contrato", () => {
    const parsed = documentStepSchema.safeParse({
      documentType: "Otro",
      documentNumber: "12345678",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("personalStepSchema", () => {
  it("exige al menos una letra Unicode en nombres", () => {
    expect(
      personalStepSchema.safeParse({ ...valid, firstName: "123" }).success,
    ).toBe(false);
    expect(
      personalStepSchema.safeParse({ ...valid, firstName: "María" }).success,
    ).toBe(true);
  });

  it("rechaza fechas futuras, imposibles y mayores a 120 años", () => {
    expect(
      personalStepSchema.safeParse({ ...valid, birthDate: "2999-01-01" }).success,
    ).toBe(false);
    expect(
      personalStepSchema.safeParse({ ...valid, birthDate: "2024-02-30" }).success,
    ).toBe(false);
    expect(
      personalStepSchema.safeParse({ ...valid, birthDate: "1800-01-01" }).success,
    ).toBe(false);
    expect(
      personalStepSchema.safeParse({ ...valid, birthDate: "21/03/1995" }).success,
    ).toBe(false);
  });
});

describe("contactStepSchema", () => {
  it("normaliza email a minúsculas y teléfono a E.164", () => {
    const parsed = contactStepSchema.safeParse({
      email: "MARIA@Example.COM",
      phone: "300 123 4567",
      addressLine: "Cra 15",
      city: "Bogotá",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.email).toBe("maria@example.com");
    expect(parsed.data.phone).toBe("+573001234567");
  });

  it("rechaza celular que no sea móvil colombiano válido", () => {
    for (const phone of ["123", "2001234567", "300123"]) {
      const parsed = contactStepSchema.safeParse({
        email: "m@example.com",
        phone,
        addressLine: "Cra 15",
        city: "Bogotá",
      });
      expect(parsed.success).toBe(false);
    }
  });
});

describe("securityStepSchema", () => {
  it("exige 8–128, lista negra y confirmación idéntica", () => {
    expect(
      securityStepSchema.safeParse({
        password: "corta",
        confirmPassword: "corta",
        ley1581: true,
      }).success,
    ).toBe(false);
    expect(
      securityStepSchema.safeParse({
        password: "colombia123",
        confirmPassword: "colombia123",
        ley1581: true,
      }).success,
    ).toBe(false);
    const mismatch = securityStepSchema.safeParse({
      password: "Clave-segura-1",
      confirmPassword: "Otra-2",
      ley1581: true,
    });
    expect(mismatch.success).toBe(false);
    if (mismatch.success) return;
    expect(mismatch.error.issues[0]?.path).toEqual(["confirmPassword"]);
  });

  it("la casilla Ley 1581 es obligatoria", () => {
    const parsed = securityStepSchema.safeParse({
      password: "Clave-segura-1",
      confirmPassword: "Clave-segura-1",
      ley1581: false,
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues[0]?.message).toContain("datos");
  });
});

describe("registerSchema + toRegisterRequest", () => {
  it("un registro válido produce el RegisterRequest sin consentimientos UI", () => {
    const request = toRegisterRequest(valid);
    expect(request).toEqual({
      documentType: "CC",
      documentNumber: "10203040",
      firstName: "María Fernanda",
      lastName: "Gómez Rojas",
      birthDate: "1995-03-21",
      gender: "female",
      email: "maria.gomez@example.com",
      phone: "+573001234567",
      addressLine: "Cra 15 # 93-60 Apto 402",
      city: "Bogotá D.C.",
      password: "Clave-segura-1",
      confirmPassword: "Clave-segura-1",
    });
  });

  it("un registro inválido devuelve null", () => {
    expect(toRegisterRequest({ ...valid, city: "" })).toBeNull();
  });

  it("el formato de cable valida sin el consentimiento UI (lo que recibe el BFF)", () => {
    const { ley1581, ...wire } = valid;
    void ley1581;
    const parsed = registerPayloadSchema.safeParse(wire);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).not.toHaveProperty("ley1581");
    expect(parsed.data.confirmPassword).toBe("Clave-segura-1");
  });
});
