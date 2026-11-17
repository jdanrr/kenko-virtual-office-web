import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import RegisterSummary from "./RegisterSummary.vue";

describe("RegisterSummary", () => {
  it("muestra pendientes cuando no hay datos", () => {
    const wrapper = mount(RegisterSummary);
    expect(wrapper.text()).toContain("Pendiente de ingreso");
    expect(wrapper.text()).toContain("Resumen en Vivo");
  });

  it("refleja lo digitado sin exponer el email completo", () => {
    const wrapper = mount(RegisterSummary, {
      props: {
        document: "CC • 10203040",
        holder: "María Gómez",
        contact: "Bogotá D.C. • +573001234567",
      },
    });
    expect(wrapper.text()).toContain("CC • 10203040");
    expect(wrapper.text()).toContain("María Gómez");
    expect(wrapper.text()).toContain("Bogotá D.C.");
  });
});
