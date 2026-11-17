import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import SecurityFields from "./SecurityFields.vue";

describe("SecurityFields", () => {
  it("emite contraseña, confirmación y consentimientos", async () => {
    const wrapper = mount(SecurityFields, {
      props: { password: "", confirmPassword: "", ley1581: false, notifications: true },
    });

    await wrapper.find('input[name="password"]').setValue("Clave-segura-1");
    expect(wrapper.emitted("update:password")).toEqual([["Clave-segura-1"]]);

    await wrapper.find("#register-ley1581").setValue(true);
    expect(wrapper.emitted("update:ley1581")).toEqual([[true]]);
  });

  it("el checklist refleja las reglas del contrato (sin mayúscula obligatoria)", () => {
    const weak = mount(SecurityFields, {
      props: { password: "corta", confirmPassword: "corta", ley1581: true, notifications: true },
    });
    // "corta": 5 chars → longitud mal; común ok; coinciden ok.
    expect(weak.text()).toContain("Mínimo 8 caracteres");

    const common = mount(SecurityFields, {
      props: {
        password: "colombia123",
        confirmPassword: "colombia123",
        ley1581: true,
        notifications: true,
      },
    });
    expect(common.text()).toContain("No es una contraseña común o bloqueada");

    const mismatch = mount(SecurityFields, {
      props: {
        password: "clave-minuscula-1",
        confirmPassword: "otra-2",
        ley1581: true,
        notifications: true,
      },
    });
    // Sin mayúscula ni símbolo: el contrato la acepta; solo falla coincidencia.
    expect(mismatch.emitted()).toEqual({});
    expect(mismatch.text()).toContain("Las contraseñas coinciden");
  });

  it("muestra el error de Ley 1581 asociado", () => {
    const wrapper = mount(SecurityFields, {
      props: {
        password: "Clave-segura-1",
        confirmPassword: "Clave-segura-1",
        ley1581: false,
        notifications: true,
        errors: { ley1581: "Debes aceptar el tratamiento de tus datos para continuar." },
      },
    });
    expect(wrapper.find("#ley1581-error").text()).toContain(
      "Debes aceptar el tratamiento de tus datos",
    );
    expect(wrapper.find("#register-ley1581").attributes("aria-invalid")).toBe("true");
  });
});
