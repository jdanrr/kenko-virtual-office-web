import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DocumentNumberField from "./DocumentNumberField.vue";

describe("DocumentNumberField", () => {
  it("asocia label e input y emite lo digitado sin mutarlo", async () => {
    const wrapper = mount(DocumentNumberField, { props: { modelValue: "" } });
    const input = wrapper.find("input");
    expect(wrapper.find("label").attributes("for")).toBe(input.attributes("id"));
    await input.setValue(" 12.345 ");
    expect(wrapper.emitted("update:modelValue")).toEqual([[" 12.345 "]]);
  });

  it("marca aria-invalid y describe el error", () => {
    const wrapper = mount(DocumentNumberField, {
      props: { modelValue: "12", error: "El número debe tener entre 4 y 20." },
    });
    const input = wrapper.find("input");
    expect(input.attributes("aria-invalid")).toBe("true");
    const describedBy = input.attributes("aria-describedby");
    expect(wrapper.find(`#${describedBy}`).text()).toBe(
      "El número debe tener entre 4 y 20.",
    );
  });
});
