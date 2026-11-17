import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import RegisterStepper from "./RegisterStepper.vue";

describe("RegisterStepper", () => {
  it("muestra 4 etapas con la actual marcada", () => {
    const wrapper = mount(RegisterStepper, { props: { currentStep: 2 } });
    const buttons = wrapper.findAll("button");
    expect(buttons).toHaveLength(4);
    expect(buttons[1]?.attributes("aria-current")).toBe("step");
    expect(buttons[0]?.attributes("aria-current")).toBeUndefined();
    expect(wrapper.text()).toContain("Datos personales");
    expect(wrapper.text()).toContain("Seguridad y Ley 1581");
  });

  it("emite la etapa elegida al hacer clic", async () => {
    const wrapper = mount(RegisterStepper, { props: { currentStep: 2 } });
    await wrapper.findAll("button")[0]?.trigger("click");
    expect(wrapper.emitted("select")).toEqual([[1]]);
  });

  it("deshabilita la navegación cuando está ocupado", () => {
    const wrapper = mount(RegisterStepper, {
      props: { currentStep: 1, disabled: true },
    });
    for (const button of wrapper.findAll("button")) {
      expect(button.attributes("disabled")).toBeDefined();
    }
  });
});
