import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ContactFields from "./ContactFields.vue";

describe("ContactFields", () => {
  it("emite el teléfono ya agrupado y asocia errores", async () => {
    const wrapper = mount(ContactFields, {
      props: {
        email: "",
        phone: "",
        addressLine: "",
        city: "",
        errors: { phone: "Revisa el celular." },
      },
    });

    await wrapper.find('input[name="phone"]').setValue("3001234567");
    expect(wrapper.emitted("update:phone")).toEqual([["300 123 4567"]]);

    await wrapper.find('input[name="email"]').setValue("m@example.com");
    expect(wrapper.emitted("update:email")).toEqual([["m@example.com"]]);

    const phone = wrapper.find('input[name="phone"]');
    expect(phone.attributes("aria-invalid")).toBe("true");
    expect(wrapper.find("#phone-error").text()).toBe("Revisa el celular.");
  });

  it("muestra ayuda de formato cuando no hay error", () => {
    const wrapper = mount(ContactFields, {
      props: { email: "", phone: "", addressLine: "", city: "" },
    });
    expect(wrapper.text()).toContain("10 dígitos");
  });
});
