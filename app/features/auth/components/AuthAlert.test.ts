import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import AuthAlert from "./AuthAlert.vue";

describe("AuthAlert", () => {
  it("anuncia el error con role=alert y código de referencia", () => {
    const wrapper = mount(AuthAlert, {
      props: {
        message: "El documento o la contraseña no son correctos.",
        correlationId: "ref-1",
      },
    });
    expect(wrapper.attributes("role")).toBe("alert");
    expect(wrapper.text()).toContain("El documento o la contraseña no son correctos.");
    expect(wrapper.text()).toContain("Código de referencia:");
    expect(wrapper.text()).toContain("ref-1");
  });

  it("omite la referencia cuando no hay correlationId", () => {
    const wrapper = mount(AuthAlert, { props: { message: "Revisa tu conexión." } });
    expect(wrapper.text()).not.toContain("Código de referencia");
  });
});
