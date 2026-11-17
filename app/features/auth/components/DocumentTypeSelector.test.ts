import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DocumentTypeSelector from "./DocumentTypeSelector.vue";

describe("DocumentTypeSelector", () => {
  it("muestra los 4 tipos del contrato, con CC marcado", () => {
    const wrapper = mount(DocumentTypeSelector, { props: { modelValue: "CC" } });
    const radios = wrapper.findAll('input[type="radio"]');
    expect(radios.map((r) => r.attributes("value"))).toEqual([
      "CC",
      "TI",
      "CE",
      "PA",
    ]);
    expect(wrapper.find('input[value="CC"]').element.checked).toBe(true);
    expect(wrapper.find("legend").text()).toBe("Tipo de Documento");
  });

  it("emite el nuevo tipo al elegir otra tarjeta", async () => {
    const wrapper = mount(DocumentTypeSelector, { props: { modelValue: "CC" } });
    await wrapper.find('input[value="TI"]').setValue();
    expect(wrapper.emitted("update:modelValue")).toEqual([["TI"]]);
  });

  it("asocia el error al grupo con aria-describedby", () => {
    const wrapper = mount(DocumentTypeSelector, {
      props: { modelValue: "CC", error: "Elige tu tipo de documento." },
    });
    const describedBy = wrapper.find("fieldset").attributes("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(wrapper.find(`#${describedBy}`).text()).toBe("Elige tu tipo de documento.");
  });
});
