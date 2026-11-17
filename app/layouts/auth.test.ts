import { renderToString } from "@vue/server-renderer";
import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";

import AuthLayout from "./auth.vue";

// Markup estático: se renderiza a string en servidor (sin descargar el <img>).
async function render(slot = "Contenido login"): Promise<string> {
  return renderToString(
    createSSRApp({ render: () => h(AuthLayout, null, { default: () => slot }) }),
  );
}

describe("AuthLayout", () => {
  it("muestra marca, conexión segura, legales y el contenido", async () => {
    const html = await render();
    expect(html).toContain('src="/logos/kenko-logo.svg"');
    expect(html).toContain('alt="Kenko EPS"');
    expect(html).toContain("Portal Oficial");
    expect(html).toContain("portal.kenkoeps.com.co");
    expect(html).toContain("Vigilado Supersalud");
    expect(html).toContain("Ley Estatutaria 1581 de 2012");
    expect(html).toContain("Contenido login");
  });
});
