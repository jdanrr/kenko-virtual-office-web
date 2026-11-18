import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  downloadAuthorizationPdf,
  generateCertificate,
  generateMedicalHistory,
  getProfile,
  listAuthorizations,
  newCorrelationId,
  notifyAuthorization,
  patchProfile,
} from "./api";

/** Pruebas de profile con respuestas simuladas (sin backend real). */

const certificate = {
  certificateId: "c1",
  issuedAt: "2026-03-15T10:00:00Z",
  affiliationStartDate: "2021-02-01T00:00:00Z",
};

const history = {
  pdfId: "p1",
  generatedAt: "2026-03-14T10:00:00Z",
  recordCount: 3,
};

const authorization = {
  authorizationId: "a1",
  type: "BLOOD_TEST",
  typeLabel: "Examen de sangre",
  status: "APPROVED",
  statusLabel: "Aprobada",
  createdAt: "2026-03-12T10:00:00Z",
  appointment: {
    appointmentId: "x1",
    date: "2026-05-10",
    appointmentType: "MEDICINA_GENERAL",
    physicianName: "Nombre Apellido",
  },
};

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("generateCertificate", () => {
  it("hace POST /certificates con Bearer y devuelve el JSON", async () => {
    const seen: { path: unknown; options: unknown }[] = [];
    const { createServiceClient } = await import("../../core/api/httpClient");
    const client = createServiceClient({
      baseURL: "http://127.0.0.1:8080",
      getAccessToken: () => "jwt",
      fetchImpl: (async (path: string, options: Record<string, unknown>) => {
        seen.push({ path, options });
        return certificate;
      }) as never,
    });
    await expect(generateCertificate(client)).resolves.toEqual(certificate);
    expect(seen[0]).toMatchObject({
      path: "/certificates",
      options: { method: "POST" },
    });
    const headers = (seen[0] as { options: { headers: Headers } }).options.headers;
    expect(headers.get("authorization")).toBe("Bearer jwt");
  });

  it("404 con mensaje simple se mapea a NOT_FOUND", async () => {
    const { createServiceClient } = await import("../../core/api/httpClient");
    const fail = new Error("HTTP 404") as Error & { status: number; data: unknown };
    fail.status = 404;
    fail.data = { error: "profile not found" };
    const client = createServiceClient({
      baseURL: "http://x",
      fetchImpl: (() => Promise.reject(fail)) as never,
    });
    await expect(generateCertificate(client)).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
      message: "profile not found",
    });
  });
});

describe("generateMedicalHistory", () => {
  it("hace POST /medical-history y devuelve el JSON", async () => {
    const { createServiceClient } = await import("../../core/api/httpClient");
    const client = createServiceClient({
      baseURL: "http://x",
      fetchImpl: (async () => history) as never,
    });
    await expect(generateMedicalHistory(client)).resolves.toEqual(history);
  });
});

describe("listAuthorizations", () => {
  it("hace GET /authorizations y devuelve la lista", async () => {
    const { createServiceClient } = await import("../../core/api/httpClient");
    const client = createServiceClient({
      baseURL: "http://x",
      fetchImpl: (async () => [authorization]) as never,
    });
    await expect(listAuthorizations(client)).resolves.toEqual([authorization]);
  });
});

describe("notifyAuthorization", () => {
  it("hace POST /authorizations/:id/notify", async () => {
    const seen: string[] = [];
    const { createServiceClient } = await import("../../core/api/httpClient");
    const client = createServiceClient({
      baseURL: "http://x",
      fetchImpl: (async (path: string) => {
        seen.push(path);
        return { authorizationId: "a1", status: "IN_PROGRESS" };
      }) as never,
    });
    await expect(notifyAuthorization(client, "a1")).resolves.toEqual({
      authorizationId: "a1",
      status: "IN_PROGRESS",
    });
    expect(seen).toEqual(["/authorizations/a1/notify"]);
  });
});

describe("downloadAuthorizationPdf", () => {
  it("descarga el blob con responseType blob y dispara la descarga", async () => {
    const blob = new Blob(["%PDF"], { type: "application/pdf" });
    const seen: { path: unknown; options: unknown }[] = [];
    const { createServiceClient } = await import("../../core/api/httpClient");
    const client = createServiceClient({
      baseURL: "http://x",
      fetchImpl: (async (path: string, options: Record<string, unknown>) => {
        seen.push({ path, options });
        return blob;
      }) as never,
    });

    const createObjectURL = vi.fn(() => "blob:fake");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const click = vi.fn();
    const appendChild = vi.fn();
    const remove = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      click,
      remove,
      set href(_: string) {},
      set download(_: string) {},
    } as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, "appendChild").mockImplementation(appendChild as never);

    await downloadAuthorizationPdf(client, "a1");

    expect(seen[0]).toMatchObject({
      path: "/authorizations/a1/pdf",
      options: { responseType: "blob" },
    });
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake");
  });
});

const profile = {
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

describe("newCorrelationId", () => {
  it("genera un uuid por petición (sin PII)", () => {
    const first = newCorrelationId();
    const second = newCorrelationId();
    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(first).not.toBe(second);
  });
});

describe("getProfile", () => {
  it("hace GET /profiles/{id} con Bearer y X-Correlation-Id", async () => {
    const seen: { path: unknown; options: unknown }[] = [];
    const { createServiceClient } = await import("../../core/api/httpClient");
    const client = createServiceClient({
      baseURL: "http://127.0.0.1:8080",
      getAccessToken: () => "jwt",
      fetchImpl: (async (path: string, options: Record<string, unknown>) => {
        seen.push({ path, options });
        return profile;
      }) as never,
    });
    await expect(getProfile(client, profile.id, "corr-1")).resolves.toEqual(profile);
    expect(seen[0]).toMatchObject({ path: `/profiles/${profile.id}` });
    const headers = (seen[0] as { options: { headers: Headers } }).options.headers;
    expect(headers.get("authorization")).toBe("Bearer jwt");
    expect(headers.get("x-correlation-id")).toBe("corr-1");
  });

  it("404 con mensaje simple se mapea a NOT_FOUND (caso SQS)", async () => {
    const { createServiceClient } = await import("../../core/api/httpClient");
    const fail = new Error("HTTP 404") as Error & { status: number; data: unknown };
    fail.status = 404;
    fail.data = { error: "profile not found" };
    const client = createServiceClient({
      baseURL: "http://x",
      fetchImpl: (() => Promise.reject(fail)) as never,
    });
    await expect(getProfile(client, profile.id, "corr-1")).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
      message: "profile not found",
    });
  });

  it("rechaza id vacío sin llamar al backend", async () => {
    const { createServiceClient } = await import("../../core/api/httpClient");
    const fetchImpl = vi.fn(async () => profile);
    const client = createServiceClient({
      baseURL: "http://x",
      fetchImpl: fetchImpl as never,
    });
    await expect(getProfile(client, "   ")).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rechaza payload inesperado sin lanzar el crudo", async () => {
    const { createServiceClient } = await import("../../core/api/httpClient");
    const client = createServiceClient({
      baseURL: "http://x",
      fetchImpl: (async () => ({ raro: true })) as never,
    });
    await expect(getProfile(client, profile.id)).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
    });
  });
});

describe("patchProfile", () => {
  it("hace PATCH /profiles/{id} solo con `phone` y trazabilidad", async () => {
    const seen: { path: unknown; options: unknown }[] = [];
    const { createServiceClient } = await import("../../core/api/httpClient");
    const client = createServiceClient({
      baseURL: "http://127.0.0.1:8080",
      getAccessToken: () => "jwt",
      fetchImpl: (async (path: string, options: Record<string, unknown>) => {
        seen.push({ path, options });
        return { ...profile, phone: "+573009998877" };
      }) as never,
    });
    const body = { phone: "+573009998877" };
    await expect(patchProfile(client, profile.id, body, "corr-2")).resolves.toMatchObject({
      phone: "+573009998877",
    });
    expect(seen[0]).toMatchObject({
      path: `/profiles/${profile.id}`,
      options: { method: "PATCH", body },
    });
    const headers = (seen[0] as { options: { headers: Headers } }).options.headers;
    expect(headers.get("x-correlation-id")).toBe("corr-2");
  });

  it("hace PATCH con `address` completo (line + city)", async () => {
    const seen: { path: unknown; options: unknown }[] = [];
    const { createServiceClient } = await import("../../core/api/httpClient");
    const client = createServiceClient({
      baseURL: "http://x",
      fetchImpl: (async (path: string, options: Record<string, unknown>) => {
        seen.push({ path, options });
        return profile;
      }) as never,
    });
    const body = { address: { line: "Calle 10 # 5-20", city: "Medellin" } };
    await expect(patchProfile(client, profile.id, body)).resolves.toEqual(profile);
    expect(seen[0]).toMatchObject({
      options: { method: "PATCH", body },
    });
  });

  it("rechaza body vacío sin llamar al backend", async () => {
    const { createServiceClient } = await import("../../core/api/httpClient");
    const fetchImpl = vi.fn(async () => profile);
    const client = createServiceClient({
      baseURL: "http://x",
      fetchImpl: fetchImpl as never,
    });
    await expect(patchProfile(client, profile.id, {})).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("400 del backend conserva el mensaje (`email` inmutable, etc.)", async () => {
    const { createServiceClient } = await import("../../core/api/httpClient");
    const fail = new Error("HTTP 400") as Error & { status: number; data: unknown };
    fail.status = 400;
    fail.data = { error: 'patch contains immutable or unknown fields: "email"' };
    const client = createServiceClient({
      baseURL: "http://x",
      fetchImpl: (() => Promise.reject(fail)) as never,
    });
    await expect(
      patchProfile(client, profile.id, { phone: "+573001234567" }),
    ).rejects.toMatchObject({
      status: 400,
      message: 'patch contains immutable or unknown fields: "email"',
    });
  });
});