import { beforeEach, describe, expect, it } from "vitest";

import {
  clearRememberedDocument,
  loadRememberedDocument,
  saveRememberedDocument,
} from "./rememberDocument";

beforeEach(() => {
  localStorage.clear();
});

describe("remembered document", () => {
  it("vacio al inicio; guarda y recupera solo tipo + número", () => {
    expect(loadRememberedDocument()).toBeNull();
    saveRememberedDocument({ documentType: "CE", documentNumber: "ABC123" });
    expect(loadRememberedDocument()).toEqual({
      documentType: "CE",
      documentNumber: "ABC123",
    });
  });

  it("rechaza datos corruptos o fuera de contrato", () => {
    localStorage.setItem("kenko.auth.rememberedDocument", "{no-json");
    expect(loadRememberedDocument()).toBeNull();

    localStorage.setItem(
      "kenko.auth.rememberedDocument",
      JSON.stringify({ documentType: "Otro", documentNumber: "123" }),
    );
    expect(loadRememberedDocument()).toBeNull();

    localStorage.setItem(
      "kenko.auth.rememberedDocument",
      JSON.stringify({ documentType: "CC", password: "x" }),
    );
    expect(loadRememberedDocument()).toBeNull();
  });

  it("limpia lo guardado", () => {
    saveRememberedDocument({ documentType: "CC", documentNumber: "123" });
    clearRememberedDocument();
    expect(loadRememberedDocument()).toBeNull();
  });
});
