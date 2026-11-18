import { describe, expect, it } from "vitest";

import { isProfile, isProfileErrorBody } from "./types";
import type { PatchProfileRequest, Profile } from "./types";

/** Guardia del contrato `GET /profiles/{id}` (respuesta cruda, sin sobre). */

const profile: Profile = {
  id: "01951234-abcd-7000-8000-c0a80101b001",
  document_type: "CC",
  document_number: "1020304050",
  first_name: "Maria Fernanda",
  last_name: "Gomez Rojas",
  birth_date: "1995-03-21",
  gender: "female",
  email: "user@example.com",
  email_verified: false,
  phone: "+573001234567",
  address_line: "Cra 15 # 93-60",
  city: "Bogota",
  created_at: "2024-01-14T10:00:00Z",
  updated_at: "2026-03-15T10:00:00Z",
};

describe("isProfile", () => {
  it("acepta el perfil real del contrato", () => {
    expect(isProfile(profile)).toBe(true);
  });

  it("rechaza payloads incompletos o malformados sin lanzar", () => {
    expect(isProfile(null)).toBe(false);
    expect(isProfile({})).toBe(false);
    expect(isProfile({ ...profile, email_verified: "false" })).toBe(false);
    expect(isProfile({ ...profile, phone: null })).toBe(false);
  });
});

describe("isProfileErrorBody", () => {
  it('acepta `{"error": "texto"}` del backend', () => {
    expect(isProfileErrorBody({ error: "profile not found" })).toBe(true);
  });

  it("rechaza sobres `{ error: { ... } }` de otros contratos", () => {
    expect(isProfileErrorBody(null)).toBe(false);
    expect(isProfileErrorBody({})).toBe(false);
    expect(isProfileErrorBody({ error: { code: "X" } })).toBe(false);
  });
});

describe("PatchProfileRequest", () => {
  it("solo permite `phone` y `address.{line,city}`", () => {
    const onlyPhone: PatchProfileRequest = { phone: "+573009998877" };
    const full: PatchProfileRequest = {
      phone: "+573009998877",
      address: { line: "Calle 10 # 5-20", city: "Medellin" },
    };
    expect(onlyPhone.phone).toBe("+573009998877");
    expect(full.address).toEqual({ line: "Calle 10 # 5-20", city: "Medellin" });
  });
});
