import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useRegisterStore } from "../registerStore";
import RegisterForm from "./RegisterForm.vue";

const stubs = {
  NuxtLink: { template: '<a :href="to"><slot /></a>', props: ["to"] },
};

function fail(status: number, data: unknown, retryAfter?: string) {
  const headers = new Headers();
  if (retryAfter !== undefined) headers.set("retry-after", retryAfter);
  const error = new Error(`HTTP ${status}`) as Error & {
    response: { status: number; _data: unknown; headers: Headers };
  };
  error.response = { status, _data: data, headers };
  return error;
}

async function fillStep1(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('input[name="documentNumber"]').setValue("1020304050");
  await wrapper.find('form').trigger("submit");
  await flushPromises();
}

async function fillStep2(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('input[name="firstName"]').setValue("María Fernanda");
  await wrapper.find('input[name="lastName"]').setValue("Gómez Rojas");
  await wrapper.find('input[name="birthDate"]').setValue("1995-03-21");
  await wrapper.find('input[value="female"]').setValue();
  await wrapper.find('form').trigger("submit");
  await flushPromises();
}

async function fillStep3(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('input[name="email"]').setValue("maria.gomez@example.com");
  await wrapper.find('input[name="phone"]').setValue("3001234567");
  await wrapper.find('input[name="city"]').setValue("Bogotá D.C.");
  await wrapper.find('input[name="addressLine"]').setValue("Cra 15 # 93-60 Apto 402");
  await wrapper.find('form').trigger("submit");
  await flushPromises();
}

async function fillStep4(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('input[name="password"]').setValue("Clave-segura-1");
  await wrapper.find('input[name="confirmPassword"]').setValue("Clave-segura-1");
  await wrapper.find("#register-ley1581").setValue(true);
  await wrapper.find('form').trigger("submit");
  await flushPromises();
}

beforeEach(() => {
  setActivePinia(createPinia());
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("RegisterForm", () => {
  it("no avanza con el paso inválido y muestra errores por campo", async () => {
    vi.stubGlobal("$fetch", vi.fn());
    const wrapper = mount(RegisterForm, { global: { stubs } });

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(useRegisterStore().currentStep).toBe(1);
    expect(wrapper.text()).toContain("Escribe tu número de documento");
  });

  it("completa los 4 pasos y crea la cuenta", async () => {
    const fetch = vi.fn().mockResolvedValue({
      data: { userId: "u1", maskedEmail: "m***@example.com" },
    });
    vi.stubGlobal("$fetch", fetch);
    const wrapper = mount(RegisterForm, { global: { stubs } });

    await fillStep1(wrapper);
    expect(useRegisterStore().currentStep).toBe(2);

    await fillStep2(wrapper);
    expect(useRegisterStore().currentStep).toBe(3);

    await fillStep3(wrapper);
    expect(useRegisterStore().currentStep).toBe(4);

    await fillStep4(wrapper);
    const store = useRegisterStore();
    expect(store.isSucceeded).toBe(true);
    expect(store.result?.maskedEmail).toBe("m***@example.com");
    expect(fetch).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      body: expect.objectContaining({ documentNumber: "1020304050" }),
    });
  });

  it("409 muestra aviso genérico sin avanzar al éxito", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(409, {
          error: {
            code: "REGISTER_CONFLICT",
            message: "No se pudo completar el registro.",
            correlationId: "ref-30",
          },
        }),
      ),
    );
    const wrapper = mount(RegisterForm, { global: { stubs } });

    await fillStep1(wrapper);
    await fillStep2(wrapper);
    await fillStep3(wrapper);
    await fillStep4(wrapper);

    expect(useRegisterStore().isSucceeded).toBe(false);
    expect(wrapper.text()).toContain("No pudimos crear tu cuenta");
    expect(wrapper.text()).toContain("ref-30");
  });

  it("429 muestra cuenta regresiva", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(
          429,
          {
            error: {
              code: "RATE_LIMITED",
              message: "Demasiadas solicitudes.",
              correlationId: "ref-31",
            },
          },
          "20",
        ),
      ),
    );
    const wrapper = mount(RegisterForm, { global: { stubs } });

    await fillStep1(wrapper);
    await fillStep2(wrapper);
    await fillStep3(wrapper);
    await fillStep4(wrapper);

    expect(wrapper.text()).toContain("Demasiados intentos");
    await vi.advanceTimersByTimeAsync(1000);
    expect(wrapper.text()).toContain("19 segundos");
  });
});
