import { describe, expect, it } from "vitest";

import { DOCUMENT_TYPES, isApiFailure } from "./types";

describe("DOCUMENT_TYPES", () => {
  it("contiene exactamente los 4 tipos del contrato (sin Otro/PPT)", () => {
    expect([...DOCUMENT_TYPES]).toEqual(["CC", "TI", "CE", "PA"]);
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
