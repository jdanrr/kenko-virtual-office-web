import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "./store";

const valid = {
  documentType: "CC",
  documentNumber: "12.345-678",
  password: "secreta-1",
} as const;

function fail(status: number, data: unknown) {
  const error = new Error(`HTTP ${status}`) as Error & {
    response: { status: number; _data: unknown; headers: Headers };
  };
  error.response = { status, _data: data, headers: new Headers() };
  return error;
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.unstubAllGlobals();
});

describe("useAuthStore", () => {
  it("empieza anónimo sin usuario ni token", () => {
    const store = useAuthStore();
    expect(store.status).toBe("anonymous");
    expect(store.isAuthenticated).toBe(false);
    expect(store.greeting).toBeNull();
    expect(store.accessToken).toBeNull();
  });

  it("logIn guarda token en memoria y saluda con /me", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ data: { accessToken: "jwt", expiresIn: 900 } })
      .mockResolvedValueOnce({
        data: { userId: "u1", firstName: "María", email: "m@x.co" },
      });
    vi.stubGlobal("$fetch", fetch);

    const store = useAuthStore();
    await store.logIn({ ...valid });

    expect(store.status).toBe("authenticated");
    expect(store.isAuthenticated).toBe(true);
    expect(store.accessToken).toBe("jwt");
    expect(store.greeting).toBe("Hola, María");
    expect(store.lastFailure).toBeNull();
    expect(store.lastLoginAt).toEqual(expect.any(Number));
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(1, "/api/auth/login", {
      method: "POST",
      body: { documentType: "CC", documentNumber: "12345678", password: "secreta-1" },
    });
    expect(fetch).toHaveBeenNthCalledWith(2, "/api/auth/me", {
      headers: { authorization: "Bearer jwt" },
    });
  });

  it("401 deja la sesión anónima con error genérico", async () => {
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

    const store = useAuthStore();
    await store.logIn({ ...valid });

    expect(store.status).toBe("anonymous");
    expect(store.isAuthenticated).toBe(false);
    expect(store.accessToken).toBeNull();
    expect(store.user).toBeNull();
    expect(store.lastFailure?.kind).toBe("invalid-credentials");
  });

  it("logOut limpia todo el estado local", async () => {
    vi.stubGlobal(
      "$fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ data: { accessToken: "jwt", expiresIn: 900 } })
        .mockResolvedValueOnce({
          data: { userId: "u1", firstName: "María", email: "m@x.co" },
        }),
    );

    const store = useAuthStore();
    await store.logIn({ ...valid });
    expect(store.isAuthenticated).toBe(true);

    store.logOut();
    expect(store.status).toBe("anonymous");
    expect(store.accessToken).toBeNull();
    expect(store.user).toBeNull();
    expect(store.lastFailure).toBeNull();
    expect(store.lastLoginAt).toBeNull();
    expect(store.expiresAt).toBeNull();
  });

  it("restoreSession recupera la sesión tras recargar (refresh silencioso)", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ data: { accessToken: "jwt2", expiresIn: 900 } })
      .mockResolvedValueOnce({
        data: { userId: "u1", firstName: "María", email: "m@x.co" },
      });
    vi.stubGlobal("$fetch", fetch);

    const store = useAuthStore();
    await store.restoreSession();

    expect(store.isAuthenticated).toBe(true);
    expect(store.greeting).toBe("Hola, María");
    expect(store.lastFailure).toBeNull();
    expect(fetch).toHaveBeenNthCalledWith(1, "/api/auth/refresh", {
      method: "POST",
    });
  });

  it("restoreSession sin cookie falla en silencio (sin error visible)", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(401, {
          error: {
            code: "UNAUTHORIZED",
            message: "Credenciales inválidas.",
            correlationId: "ref-2",
          },
        }),
      ),
    );

    const store = useAuthStore();
    await store.restoreSession();

    expect(store.status).toBe("anonymous");
    expect(store.lastFailure).toBeNull();
  });

  it("refreshNow con 401 cierra la sesión y pide login (§3.3)", async () => {
    vi.stubGlobal(
      "$fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ data: { accessToken: "jwt", expiresIn: 900 } })
        .mockResolvedValueOnce({
          data: { userId: "u1", firstName: "María", email: "m@x.co" },
        })
        .mockRejectedValueOnce(
          fail(401, {
            error: {
              code: "UNAUTHORIZED",
              message: "Credenciales inválidas.",
              correlationId: "ref-3",
            },
          }),
        ),
    );

    const store = useAuthStore();
    await store.logIn({ ...valid });
    expect(store.isAuthenticated).toBe(true);

    await store.refreshNow();

    expect(store.status).toBe("anonymous");
    expect(store.accessToken).toBeNull();
    expect(store.lastFailure?.kind).toBe("session-expired");
    expect(store.lastFailure?.message).toBe("Tu sesión terminó. Vuelve a entrar.");
  });

  it("no renueva por temporizador (solo reactiva ante 401 + arranque)", async () => {
    vi.useFakeTimers();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ data: { accessToken: "jwt", expiresIn: 900 } })
      .mockResolvedValueOnce({
        data: { userId: "u1", firstName: "María", email: "m@x.co" },
      });
    vi.stubGlobal("$fetch", fetch);

    const store = useAuthStore();
    await store.logIn({ ...valid });
    expect(store.accessToken).toBe("jwt");

    // Pasa el vencimiento completo: no debe haber refresh automático.
    await vi.advanceTimersByTimeAsync(900_000);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(store.accessToken).toBe("jwt");
    expect(store.isAuthenticated).toBe(true);

    store.logOut();
    vi.useRealTimers();
  });

  it("restoreSession marca bootstrapped aunque haya sesión o falle", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ data: { accessToken: "jwt", expiresIn: 900 } })
      .mockResolvedValueOnce({
        data: { userId: "u1", firstName: "María", email: "m@x.co" },
      })
      .mockRejectedValueOnce(
        fail(401, {
          error: { code: "UNAUTHORIZED", message: "x", correlationId: "r" },
        }),
      );
    vi.stubGlobal("$fetch", fetch);

    const store = useAuthStore();
    expect(store.bootstrapped).toBe(false);
    await store.restoreSession();
    expect(store.bootstrapped).toBe(true);
    expect(store.isAuthenticated).toBe(true);

    const other = useAuthStore();
    await other.restoreSession();
    expect(other.bootstrapped).toBe(true);
  });

  it("restoreSession sin cookie falla en silencio pero marca bootstrapped", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(401, {
          error: { code: "UNAUTHORIZED", message: "x", correlationId: "r" },
        }),
      ),
    );
    const store = useAuthStore();
    await store.restoreSession();
    expect(store.status).toBe("anonymous");
    expect(store.lastFailure).toBeNull();
    expect(store.bootstrapped).toBe(true);
  });

  it("logOutEverywhere avisa al servidor, limpia y redirige al login", async () => {
    const navigateToMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigateTo", navigateToMock);
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ data: { accessToken: "jwt", expiresIn: 900 } })
      .mockResolvedValueOnce({
        data: { userId: "u1", firstName: "María", email: "m@x.co" },
      })
      .mockResolvedValueOnce({ data: {} });
    vi.stubGlobal("$fetch", fetch);

    const store = useAuthStore();
    await store.logIn({ ...valid });
    expect(store.isAuthenticated).toBe(true);

    await store.logOutEverywhere();

    expect(fetch).toHaveBeenNthCalledWith(3, "/api/auth/logout", {
      method: "POST",
    });
    expect(store.status).toBe("anonymous");
    expect(store.accessToken).toBeNull();
    expect(navigateToMock).toHaveBeenCalledWith("/iniciar-sesion");
  });
});
