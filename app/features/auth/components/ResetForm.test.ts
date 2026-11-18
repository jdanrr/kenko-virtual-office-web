import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

import ResetForm from "./ResetForm.vue";

const stubs = {
  NuxtLink: { template: '<a :href="to"><slot /></a>', props: ["to"] },
};

function fail(status: number, data: unknown) {
  const error = new Error(`HTTP ${status}`) as Error & {
    response: { status: number; _data: unknown; headers: Headers };
  };
  error.response = { status, _data: data, headers: new Headers() };
  return error;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ResetForm", () => {
  it("valida sin llamar a la red y nunca expone el token", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("$fetch", fetch);
    const wrapper = mount(ResetForm, {
      props: { token: "opaco-del-fragmento" },
      global: { stubs },
    });

    await wrapper.find('input[name="password"]').setValue("corta");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(fetch).not.toHaveBeenCalled();
    expect(wrapper.html()).not.toContain("opaco-del-fragmento");
  });

  it("éxito muestra confirmación con enlace a entrar", async () => {
    vi.stubGlobal("$fetch", vi.fn().mockResolvedValue({ data: {} }));
    const wrapper = mount(ResetForm, {
      props: { token: "opaco-del-fragmento" },
      global: { stubs },
    });

    await wrapper.find('input[name="password"]').setValue("Clave-nueva-1");
    await wrapper.find('input[name="confirmPassword"]').setValue("Clave-nueva-1");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("Tu contraseña cambió");
    expect(wrapper.find("a").attributes("href")).toBe("/iniciar-sesion");
  });

  it("token inválido muestra banner con pedir nuevo enlace", async () => {
    vi.stubGlobal(
      "$fetch",
      vi.fn().mockRejectedValue(
        fail(400, {
          error: {
            code: "PASSWORD_RESET_INVALID",
            message: "El enlace no es válido o ha expirado.",
            correlationId: "ref-51",
          },
        }),
      ),
    );
    const wrapper = mount(ResetForm, {
      props: { token: "usado-o-vencido" },
      global: { stubs },
    });

    await wrapper.find('input[name="password"]').setValue("Clave-nueva-1");
    await wrapper.find('input[name="confirmPassword"]').setValue("Clave-nueva-1");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("Enlace no válido o expirado");
    expect(wrapper.text()).toContain("ref-51");
    const links = wrapper.findAll("a");
    expect(links.some((a) => a.attributes("href") === "/recuperar-contrasena")).toBe(true);
  });
});
