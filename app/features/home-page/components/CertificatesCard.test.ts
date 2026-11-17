import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

import CertificatesCard from "./CertificatesCard.vue";

/**
 * Regresión: el aviso de error nunca oculta los botones de generar
 * (reintentar es la acción principal de la tarjeta).
 */

function mountCard(props: Record<string, unknown> = {}) {
  return mount(CertificatesCard, {
    props: { certificate: null, history: null, ...props },
    global: { stubs: { Icon: true } },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CertificatesCard con error", () => {
  it("muestra el aviso y conserva ambos botones", () => {
    const wrapper = mountCard({ error: "Aún no tienes documentos generados." });
    expect(wrapper.find('[role="alert"]').text()).toContain("Aún no tienes");
    const buttons = wrapper.findAll("button");
    expect(buttons.length).toBe(2);
    expect(wrapper.emitted("generate-certificate")).toBeUndefined();
  });

  it("los botones emiten su evento aunque haya error", async () => {
    const wrapper = mountCard({ error: "Fallo de red." });
    const buttons = wrapper.findAll("button");
    await buttons[0]?.trigger("click");
    await buttons[1]?.trigger("click");
    expect(wrapper.emitted("generate-certificate")).toHaveLength(1);
    expect(wrapper.emitted("generate-history")).toHaveLength(1);
  });

  it("sin error ni datos muestra los textos de ayuda con botones", () => {
    const wrapper = mountCard();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("Aún no has generado tu certificado");
    expect(wrapper.findAll("button").length).toBe(2);
  });
});
