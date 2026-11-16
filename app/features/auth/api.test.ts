import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthError, fetchMe, login, refreshSession } from "./api";

const valid = {
  documentType: "CC",
  documentNumber: "12345678",
  password: "secreta-1",
} as const;

function fail(status: number, data: unknown, retryAfter?: string) {
  const headers = new Headers();
  if (retryAfter !== undefined) headers.set("retry-after", retryAfter);
  const error = new Error(`HTTP ${status}`) as Error & {
    response: { status: number; _data: unknown; headers: Headers };
  };
  error.response = { status, _data: data, headers };
  return error;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("login", () => {
  it("valida en cliente sin llamar a la red", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("$fetch", fetch);
    const thrown = await login({ ...valid, documentNumber: "12" }).catch((e) => e);
    expect(thrown).toBeInstanceOf(AuthError);
    expect(thrown.failure.kind).toBe("validation");
    expect(thrown.failure.fields).toMatchObject({ documentNumber: expect.any(String) });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("devuelve accessToken y expiresIn en éxito", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockResolvedValue({ data: { accessToken: "jwt", expiresIn: 900 } }),
    );
    await expect(login({ ...valid })).resolves.toEqual({
      accessToken: "jwt",
      expiresIn: 900,
    });
  });

  it("401 genérico sin revelar si el documento existe (anti-enumeración)", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(401, {
          error: {
            code: "UNAUTHORIZED",
            message: "Credenciales inválidas.",
            correlationId: "ref-1",
          },
        }),
      ),
    );
    const thrown = await login({ ...valid }).catch((e) => e);
    expect(thrown.failure.kind).toBe("invalid-credentials");
    expect(thrown.failure.message).toBe(
      "El documento o la contraseña no son correctos.",
    );
    expect(thrown.failure.correlationId).toBe("ref-1");
  });

  it("400 VALIDATION_ERROR mapea details por campo", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(400, {
          error: {
            code: "VALIDATION_ERROR",
            message: "Revisa.",
            correlationId: "ref-2",
            details: [{ field: "documentNumber", message: "Revisa el número." }],
          },
        }),
      ),
    );
    const thrown = await login({ ...valid }).catch((e) => e);
    expect(thrown.failure.kind).toBe("validation");
    expect(thrown.failure.fields).toEqual({ documentNumber: "Revisa el número." });
  });

  it("429 expone segundos de Retry-After para la cuenta regresiva", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(
          429,
          {
            error: {
              code: "RATE_LIMITED",
              message: "Demasiadas solicitudes.",
              correlationId: "ref-3",
            },
          },
          "45",
        ),
      ),
    );
    const thrown = await login({ ...valid }).catch((e) => e);
    expect(thrown.failure.kind).toBe("rate-limited");
    expect(thrown.failure.retryAfterSeconds).toBe(45);
    expect(thrown.failure.message).toContain("45 segundos");
  });

  it("sin respuesta es error de red; cuerpo malformado es inesperado", async () => {
    vi.stubGlobal("$fetch", vi.fn().mockRejectedValue(new Error("down")));
    const network = await login({ ...valid }).catch((e) => e);
    expect(network.failure.kind).toBe("network");

    vi.stubGlobal("$fetch", vi.fn().mockResolvedValue({ nope: true }));
    const malformed = await login({ ...valid }).catch((e) => e);
    expect(malformed.failure.kind).toBe("unexpected");
  });
});

describe("refreshSession", () => {
  it("pide el par nuevo sin tocar el refresh token (cookie httpOnly)", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ data: { accessToken: "jwt2", expiresIn: 900 } });
    vi.stubGlobal("$fetch", fetch);

    await expect(refreshSession()).resolves.toEqual({
      accessToken: "jwt2",
      expiresIn: 900,
    });
    expect(fetch).toHaveBeenCalledWith("/api/auth/refresh", { method: "POST" });
  });

  it("401 se traduce a sesión terminada", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(401, {
          error: {
            code: "UNAUTHORIZED",
            message: "Credenciales inválidas.",
            correlationId: "ref-5",
          },
        }),
      ),
    );
    const thrown = await refreshSession().catch((e) => e);
    expect(thrown.failure.kind).toBe("session-expired");
  });
});

describe("fetchMe", () => {
  it("devuelve el usuario para el saludo", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockResolvedValue({
        data: { userId: "u1", firstName: "María", email: "m@x.co" },
      }),
    );
    await expect(fetchMe("jwt")).resolves.toEqual({
      userId: "u1",
      firstName: "María",
      email: "m@x.co",
    });
  });

  it("401 es sesión terminada (re-login en silencio)", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(401, {
          error: {
            code: "UNAUTHORIZED",
            message: "Credenciales inválidas.",
            correlationId: "ref-4",
          },
        }),
      ),
    );
    const thrown = await fetchMe("expired").catch((e) => e);
    expect(thrown.failure.kind).toBe("session-expired");
  });
});
