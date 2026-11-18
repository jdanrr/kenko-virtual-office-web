import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "../store";
import LoginForm from "./LoginForm.vue";

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

async function fillAndSubmit(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('input[name="documentNumber"]').setValue(valid.documentNumber);
  await wrapper.find('input[name="password"]').setValue(valid.password);
  await wrapper.find("form").trigger("submit");
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

describe("LoginForm", () => {
  it("muestra errores por campo sin llamar a la red", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("$fetch", fetch);
    const wrapper = mount(LoginForm);

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(fetch).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Escribe tu número de documento");
    expect(wrapper.text()).toContain("Escribe tu contraseña.");
  });

  it("login exitoso autentica sin guardar nada en localStorage", async () => {
    vi.stubGlobal(
      "$fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ data: { accessToken: "jwt", expiresIn: 900 } })
        .mockResolvedValueOnce({
          data: { userId: "u1", firstName: "María", email: "m@x.co" },
        }),
    );
    const wrapper = mount(LoginForm);
    await fillAndSubmit(wrapper);

    expect(useAuthStore().isAuthenticated).toBe(true);
    expect(localStorage.getItem("kenko.auth.rememberedDocument")).toBeNull();
  });

  it("ofrece recuperar la contraseña con enlace visible a /recuperar-contrasena", async () => {
    vi.stubGlobal("$fetch", vi.fn());
    const wrapper = mount(LoginForm, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ["to"],
          },
        },
      },
    });

    expect(wrapper.text()).toContain("¿Olvidaste tu contraseña?");
    expect(wrapper.text()).toContain("Recupérala en un minuto");
    expect(wrapper.find('a[href="/recuperar-contrasena"]').exists()).toBe(true);
  });

  it("429 muestra cuenta regresiva que descuenta cada segundo", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(
          429,
          {
            error: {
              code: "RATE_LIMITED",
              message: "Demasiadas solicitudes.",
              correlationId: "ref-9",
            },
          },
          "45",
        ),
      ),
    );
    const wrapper = mount(LoginForm);
    await fillAndSubmit(wrapper);

    expect(wrapper.text()).toContain("Demasiados intentos");
    expect(wrapper.text()).toContain("45 segundos");

    await vi.advanceTimersByTimeAsync(2000);
    expect(wrapper.text()).toContain("43 segundos");
  });

  it("401 muestra error genérico con código de referencia", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(401, {
          error: {
            code: "UNAUTHORIZED",
            message: "Credenciales inválidas.",
            correlationId: "ref-7",
          },
        }),
      ),
    );
    const wrapper = mount(LoginForm);
    await fillAndSubmit(wrapper);

    expect(wrapper.text()).toContain("El documento o la contraseña no son correctos.");
    expect(wrapper.text()).toContain("ref-7");
  });
});
