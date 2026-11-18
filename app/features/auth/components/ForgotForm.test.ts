import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

import ForgotForm from "./ForgotForm.vue";

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

describe("ForgotForm", () => {
  it("valida el documento sin llamar a la red", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("$fetch", fetch);
    const wrapper = mount(ForgotForm);

    await wrapper.find('input[name="documentNumber"]').setValue("12");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(fetch).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("El número debe tener entre 4 y 20");
  });

  it("muestra el mismo mensaje exista o no la cuenta (anti-enumeración)", async () => {
    vi.stubGlobal("$fetch", vi.fn().mockResolvedValue({ data: {} }));
    const wrapper = mount(ForgotForm);

    await wrapper.find('input[name="documentNumber"]').setValue("1020304050");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("Si tus datos corresponden a una cuenta activa");
    expect(wrapper.text()).toContain("vence en 30 minutos");
  });

  it("429 muestra cuenta regresiva del enfriamiento", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(
          429,
          {
            error: {
              code: "RATE_LIMITED",
              message: "Demasiadas solicitudes.",
              correlationId: "ref-50",
            },
          },
          "60",
        ),
      ),
    );
    const wrapper = mount(ForgotForm);

    await wrapper.find('input[name="documentNumber"]').setValue("1020304050");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("Ya pediste un enlace hace poco");
    expect(wrapper.text()).toContain("60 segundos");
    vi.useRealTimers();
  });
});
