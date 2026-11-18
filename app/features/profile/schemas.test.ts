import { describe, expect, it } from "vitest";

import { normalizeProfilePhone, profilePatchSchema, toPatchRequest } from "./schemas";

/** Espejo del backend: solo `phone` y `address.{line,city}` juntos. */

describe("normalizeProfilePhone", () => {
  it("normaliza igual que registro (10 díg. `3…` → `+57`)", () => {
    expect(normalizeProfilePhone("300 123 4567")).toBe("+573001234567");
    expect(normalizeProfilePhone("00300123456789")).toBe("+300123456789");
    expect(normalizeProfilePhone("  +573001234567 ")).toBe("+573001234567");
  });
});

describe("profilePatchSchema", () => {
  it("acepta solo `phone` normalizado", () => {
    const parsed = profilePatchSchema.safeParse({ phone: "300 123 4567" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toEqual({ phone: "+573001234567" });
  });

  it("acepta solo `address` completo", () => {
    const parsed = profilePatchSchema.safeParse({
      address: { line: "Calle 10 # 5-20", city: "Medellin" },
    });
    expect(parsed.success).toBe(true);
  });

  it("acepta `phone` + `address` juntos", () => {
    const parsed = profilePatchSchema.safeParse({
      phone: "+573009998877",
      address: { line: "Calle 10 # 5-20", city: "Medellin" },
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.phone).toBe("+573009998877");
      expect(parsed.data.address).toEqual({ line: "Calle 10 # 5-20", city: "Medellin" });
    }
  });

  it("rechaza body vacío (backend: `400`)", () => {
    expect(profilePatchSchema.safeParse({}).success).toBe(false);
  });

  it("rechaza `phone` vacío o con formato inválido", () => {
    expect(profilePatchSchema.safeParse({ phone: "   " }).success).toBe(false);
    expect(profilePatchSchema.safeParse({ phone: "123" }).success).toBe(false);
  });

  it("rechaza `address` incompleta (exige `line + city` juntos)", () => {
    expect(
      profilePatchSchema.safeParse({ address: { line: "Calle 10", city: "" } }).success,
    ).toBe(false);
    expect(
      profilePatchSchema.safeParse({ address: { line: "", city: "Medellin" } }).success,
    ).toBe(false);
    expect(profilePatchSchema.safeParse({ address: { line: "Calle 10" } }).success).toBe(
      false,
    );
  });

  it("rechaza campos inmutables/desconocidos (`email`, `password`)", () => {
    expect(
      profilePatchSchema.safeParse({ phone: "+573001234567", email: "a@b.co" }).success,
    ).toBe(false);
    expect(
      profilePatchSchema.safeParse({ password: "secreta123" }).success,
    ).toBe(false);
  });
});

describe("toPatchRequest", () => {
  it("normaliza y devuelve el contrato `PatchProfileRequest`", () => {
    expect(toPatchRequest({ phone: "300 123 4567" })).toEqual({
      phone: "+573001234567",
    });
  });

  it("devuelve `null` si no valida (sin lanzar)", () => {
    expect(toPatchRequest({})).toBeNull();
    expect(toPatchRequest({ email: "a@b.co" })).toBeNull();
  });
});
