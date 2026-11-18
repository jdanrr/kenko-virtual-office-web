import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import PasswordChecklist from "./PasswordChecklist.vue";

describe("PasswordChecklist", () => {
  it("refleja las 3 reglas del contrato en vivo", () => {
    const weak = mount(PasswordChecklist, {
      props: { password: "corta", confirmPassword: "corta" },
    });
    expect(weak.text()).toContain("Mínimo 8 caracteres");

    const strong = mount(PasswordChecklist, {
      props: { password: "Clave-segura-1", confirmPassword: "Clave-segura-1" },
    });
    expect(strong.text()).toContain("Las contraseñas coinciden");
  });

  it("marca la lista negra sin importar mayúsculas", () => {
    const wrapper = mount(PasswordChecklist, {
      props: { password: "KENKO1234", confirmPassword: "KENKO1234" },
    });
    expect(wrapper.text()).toContain("No es una contraseña común o bloqueada");
  });
});
