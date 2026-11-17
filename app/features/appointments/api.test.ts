import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cancelAppointment,
  listAvailableAppointments,
  listMedicalCenters,
  listMyAppointments,
  listPhysicians,
  rescheduleAppointment,
  scheduleAppointment,
} from "./api";

/** Pruebas de appointments con respuestas simuladas (sin backend real). */

const appointment = {
  appointmentId: "a1",
  type: "ODONTOLOGIA",
  date: "2026-11-20",
  weekday: "JUEVES",
  startTime: "08:00:00",
  endTime: "08:30:00",
  physician: { physicianId: "p1", name: "Nombre Apellido" },
  medicalCenter: { medicalCenterId: "m1", name: "Kenko Norte", location: "Bogotá" },
};

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("listMyAppointments", () => {
  it("pide /appointments/me con Bearer y sin cookies ni sobre", async () => {
    const seen: { path: unknown; options: unknown }[] = [];
    const fetchImpl = vi.fn(async (path: unknown, options: unknown) => {
      seen.push({ path, options });
      return [appointment];
    });
    const { createServiceClient } = await import("../../core/api/httpClient");
    const client = createServiceClient({
      baseURL: "http://localhost:8002/api/v1",
      getAccessToken: () => "jwt",
      fetchImpl: fetchImpl as never,
    });

    await expect(listMyAppointments(client)).resolves.toEqual([appointment]);
    const call = seen[0] as { path: unknown; options: { headers: Headers } };
    expect(call.path).toBe("/appointments/me");
    expect(call.options.headers.get("authorization")).toBe("Bearer jwt");
    expect("credentials" in call.options).toBe(false);
  });

  it("propaga include_past=true cuando se pide", async () => {
    const seen: string[] = [];
    const { createServiceClient } = await import("../../core/api/httpClient");
    const client = createServiceClient({
      baseURL: "http://x",
      fetchImpl: (async (path: string) => {
        seen.push(path);
        return [];
      }) as never,
    });
    await listMyAppointments(client, true);
    expect(seen).toEqual(["/appointments/me?include_past=true"]);
  });
});

describe("acciones y catálogos", () => {
  it("schedule y cancel son POST sin body", async () => {
    const seen: { path: unknown; options: unknown }[] = [];
    const { createServiceClient } = await import("../../core/api/httpClient");
    const client = createServiceClient({
      baseURL: "http://x",
      fetchImpl: (async (path: string, options: Record<string, unknown>) => {
        seen.push({ path, options });
        return appointment;
      }) as never,
    });
    await scheduleAppointment(client, "a1");
    await cancelAppointment(client, "a1");
    expect(seen[0]).toMatchObject({ path: "/appointments/a1/schedule", options: { method: "POST" } });
    expect(seen[1]).toMatchObject({ path: "/appointments/a1/cancel", options: { method: "POST" } });
  });

  it("reschedule envía newAppointmentId en el body", async () => {
    const seen: { path: unknown; options: unknown }[] = [];
    const { createServiceClient } = await import("../../core/api/httpClient");
    const client = createServiceClient({
      baseURL: "http://x",
      fetchImpl: (async (path: string, options: Record<string, unknown>) => {
        seen.push({ path, options });
        return appointment;
      }) as never,
    });
    await rescheduleAppointment(client, "a1", { newAppointmentId: "a2" });
    expect(seen[0]).toMatchObject({
      path: "/appointments/a1/reschedule",
      options: { method: "POST", body: { newAppointmentId: "a2" } },
    });
  });

  it("available arma query params y catálogos piden sus rutas", async () => {
    const seen: string[] = [];
    const { createServiceClient } = await import("../../core/api/httpClient");
    const client = createServiceClient({
      baseURL: "http://x",
      fetchImpl: (async (path: string) => {
        seen.push(path);
        return path.startsWith("/appointments/available")
          ? { page: 1, pageSize: 20, total: 0, items: [] }
          : [];
      }) as never,
    });
    await listAvailableAppointments(client, { type: "ODONTOLOGIA", pageSize: 5 });
    await listPhysicians(client);
    await listMedicalCenters(client);
    expect(seen[0]).toContain("/appointments/available?");
    expect(seen[0]).toContain("type=ODONTOLOGIA");
    expect(seen[0]).toContain("page_size=5");
    expect(seen[1]).toBe("/catalog/physicians");
    expect(seen[2]).toBe("/catalog/medical-centers");
  });

  it("propaga el código del backend (409 ya ocupada, 403 desconocido)", async () => {
    const { createServiceClient } = await import("../../core/api/httpClient");
    const fail = (status: number, code: string) => {
      const error = new Error(`HTTP ${status}`) as Error & { status: number; data: unknown };
      error.status = status;
      error.data = { error: { code, message: "x", correlationId: "c" } };
      return error;
    };
    const conflict = createServiceClient({
      baseURL: "http://x",
      fetchImpl: (() => Promise.reject(fail(409, "conflict"))) as never,
    });
    await expect(scheduleAppointment(conflict, "a1")).rejects.toMatchObject({
      status: 409,
      code: "conflict",
    });
    const forbidden = createServiceClient({
      baseURL: "http://x",
      fetchImpl: (() => Promise.reject(fail(403, "forbidden"))) as never,
    });
    await expect(listMyAppointments(forbidden)).rejects.toMatchObject({
      status: 403,
      code: "forbidden",
    });
  });
});
