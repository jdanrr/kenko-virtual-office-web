import { describe, expect, it } from "vitest";

import { profileKeys } from "./queries";

/** Claves estables de TanStack Query (caché por `userId`, sin PII en clave). */

describe("profileKeys", () => {
  it("detail incluye el `userId` y es estable", () => {
    expect(profileKeys.detail("u1")).toEqual(["profile", "detail", "u1"]);
    expect(profileKeys.detail("u1")).toEqual(profileKeys.detail("u1"));
    expect(profileKeys.detail("u1")).not.toEqual(profileKeys.detail("u2"));
  });

  it("authorizations mantiene su clave histórica", () => {
    expect(profileKeys.authorizations()).toEqual(["profile", "authorizations"]);
  });
});
