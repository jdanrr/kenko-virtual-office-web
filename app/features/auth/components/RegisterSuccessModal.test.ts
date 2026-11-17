import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import RegisterSuccessModal from "./RegisterSuccessModal.vue";

const stubs = {
  NuxtLink: {
    template: '<a :href="to"><slot /></a>',
    props: ["to"],
  },
};

describe("RegisterSuccessModal", () => {
  it("muestra el maskedEmail y enlaza al login", () => {
    const wrapper = mount(RegisterSuccessModal, {
      props: { maskedEmail: "m***@example.com" },
      global: { stubs },
    });
    expect(wrapper.attributes("role")).toBe("dialog");
    expect(wrapper.text()).toContain("m***@example.com");
    expect(wrapper.text()).not.toContain("maria");
    expect(wrapper.find("a").attributes("href")).toBe("/iniciar-sesion");
  });

  it("emite close al permanecer", async () => {
    const wrapper = mount(RegisterSuccessModal, {
      props: { maskedEmail: "m***@example.com" },
      global: { stubs },
    });
    await wrapper.findAll("button")[0]?.trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(1);
  });
});
