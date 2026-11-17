import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "./apiError";
import { createServiceClient, normalizeBaseUrl, setAuthHooks, toApiError } from "./httpClient";

/**
 * Pruebas del cliente HTTP (sin servicios reales: respuestas simuladas).
 * Los textos esperados son los del contrato `docs/auth-service.md`.
 */

function fail(status: number, data: unknown, retryAfter: string | null = null) {
  const headers = new Headers();
  if (retryAfter !== null) headers.set("retry-after", retryAfter);
  const error = new Error(`HTTP ${status}`) as Error & {
    status: number;
    data: unknown;
    response: { status: number; headers: Headers };
  };
  error.status = status;
  error.data = data;
  error.response = { status, headers };
  return error;
}

const validationBody = {
  error: {
    code: "VALIDATION_ERROR",
    message: "Revisa los datos ingresados.",
    correlationId: "ref-1",
    details: [{ field: "documentNumber", message: "Formato inválido." }],
  },
};

beforeEach(() => {
  setAuthHooks(null);
  vi.unstubAllGlobals();
});

describe("normalizeBaseUrl", () => {
  it("quita barras finales y espacios", () => {
    expect(normalizeBaseUrl("http://localhost:8002/api/v1")).toBe(
      "http://localhost:8002/api/v1",
    );
    expect(normalizeBaseUrl("http://localhost:8002/api/v1/")).toBe(
      "http://localhost:8002/api/v1",
    );
    expect(normalizeBaseUrl("  http://localhost:8002/api/v1///  ")).toBe(
      "http://localhost:8002/api/v1",
    );
  });
});

describe("baseURL", () => {
  it("sin baseURL no llama a la red y pide revisar el .env", async () => {
    const fetchImpl = vi.fn(async () => ({ data: {} }));
    const client = createServiceClient({
      baseURL: "   ",
      fetchImpl: fetchImpl as never,
    });
    await expect(client.request("/certificates", { method: "POST" })).rejects.toMatchObject({
      status: 0,
      code: "CONFIG_ERROR",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("toApiError", () => {
  it("desenvuelve { data } en éxito a través del cliente", async () => {
    const client = createServiceClient({
      baseURL: "http://x",
      fetchImpl: (async () => ({ data: { ok: true } })) as never,
    });
    await expect(client.request("/sano")).resolves.toEqual({ ok: true });
  });

  it("convierte VALIDATION_ERROR con details por campo", () => {
    const error = toApiError(fail(400, validationBody));
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.correlationId).toBe("ref-1");
    expect(error.details).toEqual([
      { field: "documentNumber", message: "Formato inválido." },
    ]);
  });

  it("429 trae retryAfterSeconds desde Retry-After (respaldo 30 s)", () => {
    expect(toApiError(fail(429, { error: { code: "RATE_LIMITED", message: "x", correlationId: "c" } }, "45")).retryAfterSeconds).toBe(45);
    expect(toApiError(fail(429, { error: { code: "RATE_LIMITED", message: "x", correlationId: "c" } })).retryAfterSeconds).toBe(30);
  });

  it("413 se trata por estado con su código", () => {
    const error = toApiError(fail(413, { error: { code: "VALIDATION_ERROR", message: "Cuerpo demasiado grande.", correlationId: "c" } }));
    expect(error.status).toBe(413);
    expect(error.code).toBe("VALIDATION_ERROR");
  });

  it("el fallo de red es ApiError con código propio", () => {
    const error = toApiError(new Error("boom"));
    expect(error.status).toBe(0);
    expect(error.code).toBe("NETWORK_ERROR");
  });
});

describe("refresh reactivo ante 401", () => {
  it("un 401 provoca exactamente un refresh y un reintento", async () => {
    const refreshAccessToken = vi.fn().mockResolvedValue({ accessToken: "nuevo", expiresIn: 900 });
    const handleRefreshFailure = vi.fn();
    setAuthHooks({ refreshAccessToken, handleRefreshFailure });

    const seen: (string | null)[] = [];
    const fetchImpl = vi.fn(async (_path: string, options?: { headers?: Headers }) => {
      const auth = options?.headers instanceof Headers ? options.headers.get("authorization") : null;
      seen.push(auth);
      if (auth === "Bearer viejo") {
        throw fail(401, { error: { code: "UNAUTHORIZED", message: "x", correlationId: "c" } });
      }
      return { data: { ok: true } };
    });

    const client = createServiceClient({
      baseURL: "http://x",
      getAccessToken: () => (refreshAccessToken.mock.calls.length > 0 ? "nuevo" : "viejo"),
      fetchImpl: fetchImpl as never,
    });

    await expect(client.request("/recurso")).resolves.toEqual({ ok: true });
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(handleRefreshFailure).not.toHaveBeenCalled();
    expect(seen).toEqual(["Bearer viejo", "Bearer nuevo"]);
  });

  it("varias peticiones con 401 provocan UN solo refresh", async () => {
    const refreshAccessToken = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 10));
      return { accessToken: "nuevo", expiresIn: 900 };
    });
    setAuthHooks({ refreshAccessToken, handleRefreshFailure: vi.fn() });
    let token = "viejo";

    const fetchImpl = vi.fn(async () => {
      if (token === "viejo") {
        throw fail(401, { error: { code: "UNAUTHORIZED", message: "x", correlationId: "c" } });
      }
      return { data: { ok: true } };
    });
    refreshAccessToken.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 10));
      token = "nuevo";
      return { accessToken: "nuevo", expiresIn: 900 };
    });

    const client = createServiceClient({
      baseURL: "http://x",
      getAccessToken: () => token,
      fetchImpl: fetchImpl as never,
    });

    const results = await Promise.all([
      client.request("/a"),
      client.request("/b"),
      client.request("/c"),
    ]);
    expect(results).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
  });

  it("refresh fallido: limpia la sesión y lanza sin reintentar en bucle", async () => {
    const handleRefreshFailure = vi.fn();
    setAuthHooks({
      refreshAccessToken: vi.fn().mockRejectedValue(new Error("no")),
      handleRefreshFailure,
    });
    const fetchImpl = vi.fn(async () => {
      throw fail(401, { error: { code: "UNAUTHORIZED", message: "x", correlationId: "c" } });
    });
    const client = createServiceClient({ baseURL: "http://x", fetchImpl: fetchImpl as never });

    await expect(client.request("/recurso")).rejects.toMatchObject({ status: 401 });
    expect(handleRefreshFailure).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("reintento con 401: el error llega al llamador y la sesión se mantiene", async () => {
    const handleRefreshFailure = vi.fn();
    setAuthHooks({
      refreshAccessToken: vi.fn().mockResolvedValue({ accessToken: "nuevo", expiresIn: 900 }),
      handleRefreshFailure,
    });
    const fetchImpl = vi.fn(async () => {
      throw fail(401, { error: { code: "UNAUTHORIZED", message: "Contraseña actual incorrecta.", correlationId: "c" } });
    });
    const client = createServiceClient({ baseURL: "http://x", fetchImpl: fetchImpl as never });

    await expect(client.request("/auth/password/change")).rejects.toMatchObject({
      status: 401,
      message: "Contraseña actual incorrecta.",
    });
    expect(handleRefreshFailure).not.toHaveBeenCalled();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("/auth/login y /auth/refresh nunca disparan un refresh", async () => {
    const refreshAccessToken = vi.fn();
    setAuthHooks({ refreshAccessToken, handleRefreshFailure: vi.fn() });
    const fetchImpl = vi.fn(async () => {
      throw fail(401, { error: { code: "UNAUTHORIZED", message: "x", correlationId: "c" } });
    });
    const client = createServiceClient({ baseURL: "http://x", fetchImpl: fetchImpl as never });

    await expect(client.request("/auth/login", { method: "POST" })).rejects.toMatchObject({ status: 401 });
    await expect(client.request("/auth/refresh", { method: "POST" })).rejects.toMatchObject({ status: 401 });
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it("envelope:false devuelve la respuesta cruda (sin sobre {data})", async () => {
    const raw = [{ appointmentId: "a1" }];
    const client = createServiceClient({
      baseURL: "http://x",
      fetchImpl: (async () => raw) as never,
    });
    await expect(client.request("/appointments/me", { envelope: false })).resolves.toBe(raw);
  });

  it("error simple {error: texto} usa el estado HTTP como código", () => {
    const simple = (status: number, message: string) => {
      const error = new Error(`HTTP ${status}`) as Error & { status: number; data: unknown };
      error.status = status;
      error.data = { error: message };
      return toApiError(error);
    };
    expect(simple(401, "unauthorized")).toMatchObject({ status: 401, code: "UNAUTHORIZED", message: "unauthorized" });
    expect(simple(404, "profile not found")).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(simple(502, "event publish failed")).toMatchObject({ status: 502, code: "INTERNAL_ERROR" });
  });

  it("agrega Bearer y usa credentials include solo en auth directo", async () => {
    const seen: { auth: string | null; credentials: unknown }[] = [];
    const fetchImpl = vi.fn(async (_p: string, o?: { headers?: Headers; credentials?: unknown }) => {
      seen.push({
        auth: o?.headers instanceof Headers ? o.headers.get("authorization") : null,
        credentials: o?.credentials,
      });
      return { data: { ok: true } };
    });
    const authClient = createServiceClient({
      baseURL: "http://a",
      useCookies: true,
      getAccessToken: () => "jwt",
      fetchImpl: fetchImpl as never,
    });
    const otherClient = createServiceClient({
      baseURL: "http://b",
      getAccessToken: () => "jwt",
      fetchImpl: fetchImpl as never,
    });
    await authClient.request("/auth/me");
    await otherClient.request("/perfil");
    expect(seen[0]).toEqual({ auth: "Bearer jwt", credentials: "include" });
    expect(seen[1]).toEqual({ auth: "Bearer jwt", credentials: undefined });
  });
});
