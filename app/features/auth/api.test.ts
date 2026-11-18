import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AuthError,
  fetchMe,
  login,
  refreshSession,
  register,
  requestPasswordReset,
  resetPassword,
} from "./api";

const valid = {
  documentType: "CC",
  documentNumber: "12345678",
  password: "secreta-1",
} as const;

const validRegister = {
  documentType: "CC",
  documentNumber: "1020304050",
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
  ley1581: true,
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

  it("llamadas concurrentes comparten un único vuelo (no rota dos veces)", async () => {
    const fetch = vi
      .fn()
      .mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ data: { accessToken: "jwt2", expiresIn: 900 } }),
              20,
            ),
          ),
      );
    vi.stubGlobal("$fetch", fetch);

    const [first, second, third] = await Promise.all([
      refreshSession(),
      refreshSession(),
      refreshSession(),
    ]);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(first).toEqual({ accessToken: "jwt2", expiresIn: 900 });
    expect(second).toEqual(first);
    expect(third).toEqual(first);
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

describe("register", () => {
  it("valida en cliente sin llamar a la red", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("$fetch", fetch);
    const thrown = await register({ ...validRegister, city: "" }).catch((e) => e);
    expect(thrown).toBeInstanceOf(AuthError);
    expect(thrown.failure.kind).toBe("validation");
    expect(thrown.failure.fields).toMatchObject({ city: expect.any(String) });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("devuelve userId y maskedEmail en éxito (201)", async () => {
    const fetch = vi.fn().mockResolvedValue({
      data: { userId: "u1", maskedEmail: "m***@example.com" },
    });
    vi.stubGlobal("$fetch", fetch);
    await expect(register({ ...validRegister })).resolves.toEqual({
      userId: "u1",
      maskedEmail: "m***@example.com",
    });
    expect(fetch).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      body: expect.objectContaining({
        documentNumber: "1020304050",
        email: "maria.gomez@example.com",
      }),
    });
    const body = fetch.mock.calls[0]?.[1].body as Record<string, unknown>;
    expect(body).not.toHaveProperty("ley1581");
    expect(body).toHaveProperty("confirmPassword");
  });

  it("400 VALIDATION_ERROR mapea details por campo", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(400, {
          error: {
            code: "VALIDATION_ERROR",
            message: "Revisa.",
            correlationId: "ref-10",
            details: [{ field: "birthDate", message: "La fecha no puede ser futura." }],
          },
        }),
      ),
    );
    const thrown = await register({ ...validRegister }).catch((e) => e);
    expect(thrown.failure.kind).toBe("validation");
    expect(thrown.failure.fields).toEqual({
      birthDate: "La fecha no puede ser futura.",
    });
  });

  it("409 genérico sin revelar qué existe (anti-enumeración)", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(409, {
          error: {
            code: "REGISTER_CONFLICT",
            message: "No se pudo completar el registro.",
            correlationId: "ref-11",
          },
        }),
      ),
    );
    const thrown = await register({ ...validRegister }).catch((e) => e);
    expect(thrown.failure.kind).toBe("register-conflict");
    expect(thrown.failure.message).toContain("No pudimos crear tu cuenta");
    expect(thrown.failure.correlationId).toBe("ref-11");
  });

  it("429 expone segundos de Retry-After", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(
          429,
          {
            error: {
              code: "RATE_LIMITED",
              message: "Demasiadas solicitudes.",
              correlationId: "ref-12",
            },
          },
          "30",
        ),
      ),
    );
    const thrown = await register({ ...validRegister }).catch((e) => e);
    expect(thrown.failure.kind).toBe("rate-limited");
    expect(thrown.failure.retryAfterSeconds).toBe(30);
  });
});

describe("requestPasswordReset", () => {
  it("valida en cliente sin llamar a la red", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("$fetch", fetch);
    const thrown = await requestPasswordReset({
      documentType: "CC",
      documentNumber: "12",
    }).catch((e) => e);
    expect(thrown.failure.kind).toBe("validation");
    expect(thrown.failure.fields).toMatchObject({
      documentNumber: expect.any(String),
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("éxito 200 con el mismo mensaje exista o no la cuenta", async () => {
    const fetch = vi.fn().mockResolvedValue({ data: {} });
    vi.stubGlobal("$fetch", fetch);
    await expect(
      requestPasswordReset({ documentType: "CC", documentNumber: "1020304050" }),
    ).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith("/api/auth/password/forgot", {
      method: "POST",
      body: { documentType: "CC", documentNumber: "1020304050" },
    });
  });

  it("429 respeta el enfriamiento con cuenta regresiva", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(
          429,
          {
            error: {
              code: "RATE_LIMITED",
              message: "Demasiadas solicitudes.",
              correlationId: "ref-40",
            },
          },
          "60",
        ),
      ),
    );
    const thrown = await requestPasswordReset({
      documentType: "CC",
      documentNumber: "1020304050",
    }).catch((e) => e);
    expect(thrown.failure.kind).toBe("rate-limited");
    expect(thrown.failure.retryAfterSeconds).toBe(60);
  });
});

describe("resetPassword", () => {
  const validReset = {
    token: "opaco-del-fragmento",
    password: "Clave-nueva-1",
    confirmPassword: "Clave-nueva-1",
  } as const;

  it("envía el token solo en el body y acepta 200 vacío", async () => {
    const fetch = vi.fn().mockResolvedValue({ data: {} });
    vi.stubGlobal("$fetch", fetch);
    await expect(resetPassword({ ...validReset })).resolves.toBeUndefined();
    const body = fetch.mock.calls[0]?.[1].body as Record<string, unknown>;
    expect(body.token).toBe("opaco-del-fragmento");
    const url = String(fetch.mock.calls[0]?.[0] ?? "");
    expect(url).not.toContain("opaco-del-fragmento");
  });

  it("400 PASSWORD_RESET_INVALID pide uno nuevo", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(400, {
          error: {
            code: "PASSWORD_RESET_INVALID",
            message: "El enlace no es válido o ha expirado.",
            correlationId: "ref-41",
          },
        }),
      ),
    );
    const thrown = await resetPassword({ ...validReset }).catch((e) => e);
    expect(thrown.failure.kind).toBe("reset-invalid");
    expect(thrown.failure.message).toContain("Pide uno nuevo");
    expect(thrown.failure.correlationId).toBe("ref-41");
  });

  it("400 VALIDATION_ERROR mapea details por campo", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(400, {
          error: {
            code: "VALIDATION_ERROR",
            message: "Revisa.",
            correlationId: "ref-42",
            details: [{ field: "password", message: "La nueva no puede ser igual." }],
          },
        }),
      ),
    );
    const thrown = await resetPassword({ ...validReset }).catch((e) => e);
    expect(thrown.failure.kind).toBe("validation");
    expect(thrown.failure.fields).toEqual({
      password: "La nueva no puede ser igual.",
    });
  });
});
