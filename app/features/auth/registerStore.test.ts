import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRegisterStore } from "./registerStore";

const steps = {
  1: { documentType: "CC", documentNumber: "1020304050" },
  2: {
    firstName: "María Fernanda",
    lastName: "Gómez Rojas",
    birthDate: "1995-03-21",
    gender: "female",
  },
  3: {
    email: "maria.gomez@example.com",
    phone: "300 123 4567",
    addressLine: "Cra 15 # 93-60 Apto 402",
    city: "Bogotá D.C.",
  },
  4: {
    password: "Clave-segura-1",
    confirmPassword: "Clave-segura-1",
    ley1581: true,
  },
} as const;

function fail(status: number, data: unknown) {
  const error = new Error(`HTTP ${status}`) as Error & {
    response: { status: number; _data: unknown; headers: Headers };
  };
  error.response = { status, _data: data, headers: new Headers() };
  return error;
}

function fillAll(store: ReturnType<typeof useRegisterStore>): void {
  expect(store.updateStep(1, steps[1])).toEqual({ ok: true });
  expect(store.updateStep(2, steps[2])).toEqual({ ok: true });
  expect(store.updateStep(3, steps[3])).toEqual({ ok: true });
  expect(store.updateStep(4, steps[4])).toEqual({ ok: true });
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.unstubAllGlobals();
});

describe("useRegisterStore", () => {
  it("empieza en el paso 1 sin datos ni resultado", () => {
    const store = useRegisterStore();
    expect(store.currentStep).toBe(1);
    expect(store.isSucceeded).toBe(false);
    expect(store.result).toBeNull();
  });

  it("updateStep guarda normalizado o devuelve errores sin avanzar", () => {
    const store = useRegisterStore();
    expect(
      store.updateStep(1, { documentType: "CC", documentNumber: " 10.203-040 " }),
    ).toEqual({ ok: true });
    expect(store.data.documentNumber).toBe("10203040");

    const bad = store.updateStep(1, { documentType: "CC", documentNumber: "12" });
    expect(bad.ok).toBe(false);
    if (bad.ok) return;
    expect(bad.fields).toMatchObject({ documentNumber: expect.any(String) });
    expect(store.currentStep).toBe(1);
  });

  it("retroceder es libre; avanzar valida los intermedios", () => {
    const store = useRegisterStore();
    store.updateStep(1, steps[1]);

    expect(store.goToStep(3)).toBe(false);
    expect(store.currentStep).toBe(2);
    expect(store.lastFailure?.kind).toBe("validation");

    store.updateStep(2, steps[2]);
    expect(store.goToStep(3)).toBe(true);

    store.goToStep(1);
    expect(store.currentStep).toBe(1);
  });

  it("submit envía los 12 campos y guarda maskedEmail", async () => {
    const fetch = vi.fn().mockResolvedValue({
      data: { userId: "u1", maskedEmail: "m***@example.com" },
    });
    vi.stubGlobal("$fetch", fetch);

    const store = useRegisterStore();
    fillAll(store);
    store.goToStep(4);

    await expect(store.submit()).resolves.toBe(true);
    expect(store.isSucceeded).toBe(true);
    expect(store.result?.maskedEmail).toBe("m***@example.com");
    expect(fetch).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      body: expect.objectContaining({ city: "Bogotá D.C." }),
    });
  });

  it("409 deja register-conflict sin éxito", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(409, {
          error: {
            code: "REGISTER_CONFLICT",
            message: "No se pudo completar el registro.",
            correlationId: "ref-20",
          },
        }),
      ),
    );

    const store = useRegisterStore();
    fillAll(store);
    await expect(store.submit()).resolves.toBe(false);

    expect(store.isSucceeded).toBe(false);
    expect(store.lastFailure?.kind).toBe("register-conflict");
    expect(store.lastFailure?.correlationId).toBe("ref-20");
  });

  it("error de servidor por campo salta al primer paso con error", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(400, {
          error: {
            code: "VALIDATION_ERROR",
            message: "Revisa.",
            correlationId: "ref-21",
            details: [{ field: "phone", message: "Revisa el celular." }],
          },
        }),
      ),
    );

    const store = useRegisterStore();
    fillAll(store);
    store.goToStep(4);
    await expect(store.submit()).resolves.toBe(false);

    expect(store.currentStep).toBe(3);
    expect(store.stepFields).toEqual({ phone: "Revisa el celular." });
  });

  it("reset limpia el wizard completo", async () => {
    vi.stubGlobal("$fetch", vi.fn().mockResolvedValue({
      data: { userId: "u1", maskedEmail: "m***@example.com" },
    }));

    const store = useRegisterStore();
    fillAll(store);
    await store.submit();
    expect(store.isSucceeded).toBe(true);

    store.reset();
    expect(store.currentStep).toBe(1);
    expect(store.data).toEqual({});
    expect(store.result).toBeNull();
    expect(store.lastFailure).toBeNull();
  });
});
