import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import PersonalFields from "./PersonalFields.vue";

describe("PersonalFields", () => {
  it("emite cada campo y asocia errores con aria", async () => {
    const wrapper = mount(PersonalFields, {
      props: {
        firstName: "",
        lastName: "",
        birthDate: "",
        gender: "",
        errors: { firstName: "Escribe tu nombre." },
      },
    });

    await wrapper.find('input[name="firstName"]').setValue("María");
    expect(wrapper.emitted("update:firstName")).toEqual([["María"]]);

    await wrapper.find('input[value="female"]').setValue();
    expect(wrapper.emitted("update:gender")).toEqual([["female"]]);

    const input = wrapper.find('input[name="firstName"]');
    expect(input.attributes("aria-invalid")).toBe("true");
    expect(wrapper.find("#firstName-error").text()).toBe("Escribe tu nombre.");
  });

  it("limita la fecha entre hoy menos 120 años y hoy", () => {
    const wrapper = mount(PersonalFields, {
      props: { firstName: "", lastName: "", birthDate: "", gender: "" },
    });
    const input = wrapper.find('input[name="birthDate"]');
    const min = input.attributes("min") ?? "";
    const max = input.attributes("max") ?? "";
    expect(min).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(max).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number(max.slice(0, 4)) - Number(min.slice(0, 4))).toBe(120);
  });
});
