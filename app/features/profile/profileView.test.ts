import { describe, expect, it } from "vitest";

import { ApiError } from "../../core/api/apiError";
import {
  formatAffiliationDate,
  formatBirthDate,
  formatDocument,
  formatFullName,
  formatGender,
  formatPhoneDisplayLocal,
  formatUpdatedAt,
  toProfilePageError,
} from "./profileView";

describe("formatFullName", () => {
  it("une nombres y apellidos sin espacios sobrantes", () => {
    expect(formatFullName("Maria Fernanda", "Gomez Rojas")).toBe(
      "Maria Fernanda Gomez Rojas",
    );
  });
});

describe("formatDocument", () => {
  it("agrupa miles solo visualmente", () => {
    expect(formatDocument("CC", "1020304050")).toBe("CC • 1.020.304.050");
  });
});

describe("formatBirthDate", () => {
  it("formatea en español sin correr el día", () => {
    expect(formatBirthDate("1995-03-21")).toBe("21 de marzo de 1995");
  });

  it("devuelve el crudo si es inválido", () => {
    expect(formatBirthDate("no-fecha")).toBe("no-fecha");
  });
});

describe("formatAffiliationDate", () => {
  it("formatea `created_at` RFC3339", () => {
    expect(formatAffiliationDate("2024-01-14T10:00:00Z")).toContain("2024");
  });
});

describe("formatUpdatedAt", () => {
  it("incluye fecha y hora", () => {
    expect(formatUpdatedAt("2026-03-15T10:00:00Z")).toContain("2026");
  });
});

describe("formatGender", () => {
  it("traduce los valores conocidos", () => {
    expect(formatGender("female")).toBe("Femenino");
    expect(formatGender("male")).toBe("Masculino");
    expect(formatGender("other")).toBe("Otro");
  });
});

describe("formatPhoneDisplayLocal", () => {
  it("agrupa 3-3-4", () => {
    expect(formatPhoneDisplayLocal("+573001234567")).toBe("300 123 4567");
    expect(formatPhoneDisplayLocal("3001234567")).toBe("300 123 4567");
  });
});

describe("toProfilePageError", () => {
  it("404 muestra el mensaje del retardo SQS", () => {
    const error = new ApiError({ status: 404, code: "NOT_FOUND", message: "x" });
    expect(toProfilePageError(error)?.kind).toBe("not-found");
    expect(toProfilePageError(error)?.message).toContain("se está creando");
  });

  it("400 conserva el mensaje del backend", () => {
    const error = new ApiError({ status: 400, code: "X", message: "patch contains" });
    const mapped = toProfilePageError(error);
    expect(mapped?.kind).toBe("validation");
    expect(mapped?.message).toBe("patch contains");
  });

  it("red y 500 usan mensajes genéricos sin PII", () => {
    expect(toProfilePageError(new ApiError({ status: 0, code: "NETWORK_ERROR", message: "x" }))?.kind).toBe("network");
    expect(toProfilePageError(new ApiError({ status: 500, code: "INTERNAL_ERROR", message: "x" }))?.message).toContain("más tarde");
    expect(toProfilePageError(null)).toBeNull();
  });
});
