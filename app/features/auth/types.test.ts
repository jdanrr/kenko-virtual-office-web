import { describe, expect, it } from "vitest";

import {
  DOCUMENT_TYPES,
  GENDERS,
  isApiFailure,
  type RegisterRequest,
  type RegisterSuccess,
} from "./types";

describe("DOCUMENT_TYPES", () => {
  it("contiene exactamente los 4 tipos del contrato (sin Otro/PPT)", () => {
    expect([...DOCUMENT_TYPES]).toEqual(["CC", "TI", "CE", "PA"]);
  });
});

describe("GENDERS", () => {
  it("contiene exactamente los 3 del contrato", () => {
    expect([...GENDERS]).toEqual(["male", "female", "other"]);
  });
});

describe("register shapes", () => {
  it("RegisterRequest acepta los 12 campos del §3.1 (incluye confirmPassword)", () => {
    const request: RegisterRequest = {
      firstName: "María Fernanda",
      lastName: "Gómez Rojas",
      birthDate: "1995-03-21",
      gender: "female",
      email: "maria.gomez@example.com",
      phone: "+573001234567",
      addressLine: "Cra 15 # 93-60 Apto 402",
      city: "Bogotá D.C.",
      documentType: "CC",
      documentNumber: "1020304050",
      password: "Clave-segura-1",
      confirmPassword: "Clave-segura-1",
    };
    expect(request.confirmPassword).toBe(request.password);
  });

  it("RegisterSuccess trae userId y maskedEmail sin email completo", () => {
    const success: RegisterSuccess = {
      userId: "u1",
      maskedEmail: "m***@example.com",
    };
    expect(success.maskedEmail).toContain("***");
    expect(success.maskedEmail).not.toContain("maria");
  });
});

describe("isApiFailure", () => {
  it("reconoce el sobre de éxito { data }", () => {
    expect(
      isApiFailure({ data: { accessToken: "a", refreshToken: "r", expiresIn: 900 } }),
    ).toBe(false);
  });

  it("reconoce el sobre de error con details de VALIDATION_ERROR", () => {
    expect(
      isApiFailure({
        error: {
          code: "VALIDATION_ERROR",
          message: "Revisa los campos.",
          correlationId: "abc-123",
          details: [{ field: "documentNumber", message: "Revisa el número." }],
        },
      }),
    ).toBe(true);
  });

  it("rechaza payloads malformados sin lanzar", () => {
    expect(isApiFailure(null)).toBe(false);
    expect(isApiFailure(undefined)).toBe(false);
    expect(isApiFailure({})).toBe(false);
    expect(isApiFailure({ error: null })).toBe(false);
    expect(isApiFailure({ error: "UNAUTHORIZED" })).toBe(false);
    expect(isApiFailure({ error: { code: "UNAUTHORIZED" } })).toBe(false);
  });
});
