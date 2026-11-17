import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import PasswordField from "./PasswordField.vue";

describe("PasswordField", () => {
  it("empieza oculta y alterna con botón accesible", async () => {
    const wrapper = mount(PasswordField, { props: { modelValue: "" } });
    const input = wrapper.find("input");
    const toggle = wrapper.find("button");

    expect(input.attributes("type")).toBe("password");
    expect(toggle.attributes("aria-label")).toBe("Mostrar contraseña");

    await toggle.trigger("click");
    expect(input.attributes("type")).toBe("text");
    expect(toggle.attributes("aria-pressed")).toBe("true");
    expect(toggle.attributes("aria-label")).toBe("Ocultar contraseña");
  });

  it("emite lo digitado y muestra el error asociado", async () => {
    const wrapper = mount(PasswordField, {
      props: { modelValue: "", error: "Escribe tu contraseña." },
    });
    await wrapper.find("input").setValue("x");
    expect(wrapper.emitted("update:modelValue")).toEqual([["x"]]);
    expect(wrapper.find("input").attributes("aria-invalid")).toBe("true");
    expect(wrapper.text()).toContain("Escribe tu contraseña.");
  });
});
