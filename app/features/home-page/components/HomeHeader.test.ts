import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import type { SessionPatientView } from "../types";
import HomeHeader from "./HomeHeader.vue";

/** Pruebas del encabezado: saludo por género y menú del avatar. */

const base: SessionPatientView = {
  id: "u1",
  firstName: "Alex",
  lastName: "Rivera",
  shortName: "Alex R.",
  documentMasked: "CC 1.020.485.***",
  initials: "A",
  gender: null,
  email: "alex@example.com",
};

function mountHeader(patient: SessionPatientView | null = { ...base, gender: "female" }) {
  return mount(HomeHeader, {
    props: { patient },
    global: { stubs: { Icon: true } },
    attachTo: document.body,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("saludo por género", () => {
  it.each([
    ["male", "¡Bienvenido Alex Rivera!"],
    ["female", "¡Bienvenida Alex Rivera!"],
    ["other", "¡Bienvenid@ Alex Rivera!"],
    [null, "¡Bienvenid@ Alex Rivera!"],
  ] as const)("género %s saluda %s", (gender, expected) => {
    const wrapper = mountHeader({ ...base, gender });
    expect(wrapper.find("h1").text()).toContain(expected);
    wrapper.unmount();
  });
});

describe("avatar y correo", () => {
  it("muestra el correo debajo del círculo y sin nombre", () => {
    const wrapper = mountHeader();
    expect(wrapper.text()).toContain("alex@example.com");
    expect(wrapper.text()).not.toContain("Alex R.");
    expect(wrapper.find("button[aria-haspopup='menu']").exists()).toBe(true);
    expect(wrapper.find("button[aria-haspopup='menu']").classes()).toContain("cursor-pointer");
    wrapper.unmount();
  });
});

describe("menú desplegable", () => {
  it("abre con clic y ofrece Perfil y Cerrar sesión", async () => {
    const wrapper = mountHeader();
    expect(wrapper.find("[role='menu']").exists()).toBe(false);
    await wrapper.find("button[aria-haspopup='menu']").trigger("click");
    const menu = wrapper.find("[role='menu']");
    expect(menu.exists()).toBe(true);
    expect(wrapper.find("button[aria-haspopup='menu']").attributes("aria-expanded")).toBe("true");
    expect(menu.text()).toContain("Perfil");
    expect(menu.text()).toContain("Cerrar sesión");
    wrapper.unmount();
  });

  it("Cerrar sesión emite logout y cierra; Perfil emite profile", async () => {
    const wrapper = mountHeader();
    await wrapper.find("button[aria-haspopup='menu']").trigger("click");
    const items = wrapper.findAll("[role='menuitem']");
    await items[1]?.trigger("click");
    expect(wrapper.emitted("logout")).toHaveLength(1);
    expect(wrapper.find("[role='menu']").exists()).toBe(false);

    await wrapper.find("button[aria-haspopup='menu']").trigger("click");
    await wrapper.findAll("[role='menuitem']")[0]?.trigger("click");
    expect(wrapper.emitted("profile")).toHaveLength(1);
    expect(wrapper.find("[role='menu']").exists()).toBe(false);
    wrapper.unmount();
  });

  it("Escape cierra el menú", async () => {
    const wrapper = mountHeader();
    await wrapper.find("button[aria-haspopup='menu']").trigger("click");
    expect(wrapper.find("[role='menu']").exists()).toBe(true);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await nextTick();
    expect(wrapper.find("[role='menu']").exists()).toBe(false);
    wrapper.unmount();
  });

  it("clic fuera cierra el menú", async () => {
    const wrapper = mountHeader();
    await wrapper.find("button[aria-haspopup='menu']").trigger("click");
    expect(wrapper.find("[role='menu']").exists()).toBe(true);
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();
    expect(wrapper.find("[role='menu']").exists()).toBe(false);
    wrapper.unmount();
  });
});
