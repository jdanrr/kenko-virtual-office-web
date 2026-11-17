import { describe, expect, it } from "vitest";

import { formatPhoneDisplay } from "./phoneFormat";

describe("formatPhoneDisplay", () => {
  it("agrupa los 10 dígitos para lectura", () => {
    expect(formatPhoneDisplay("3001234567")).toBe("300 123 4567");
    expect(formatPhoneDisplay("300123")).toBe("300 123");
    expect(formatPhoneDisplay("+573001234567")).toBe("300 123 4567");
    expect(formatPhoneDisplay("")).toBe("");
  });
});
