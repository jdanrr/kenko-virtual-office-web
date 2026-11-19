import { describe, expect, it } from "vitest";

import {
  changeEmailSchema,
  changePasswordFormSchema,
  changePasswordPayloadSchema,
  toChangeEmailRequest,
  toChangePasswordRequest,
} from "./accountSchemas";

/** Cambio autenticado de contraseña y correo (contrato del equipo Auth). */

describe("changePasswordFormSchema", () => {
  const valid = {
    currentPassword: "vieja-2026",
    newPassword: "nueva-clave-2026!",
    confirmNewPassword: "nueva-clave-2026!",
  };

  it("acepta el formulario válido", () => {
    expect(changePasswordFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza confirmación distinta", () => {
    const parsed = changePasswordFormSchema.safeParse({
      ...valid,
      confirmNewPassword: "otra-2026!",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]).toMatchObject({
        path: ["confirmNewPassword"],
        message: "Las contraseñas no coinciden.",
      });
    }
  });

  it("rechaza política §3.1 (corta y lista negra)", () => {
    expect(
      changePasswordFormSchema.safeParse({ ...valid, newPassword: "corta", confirmNewPassword: "corta" })
        .success,
    ).toBe(false);
    expect(
      changePasswordFormSchema.safeParse({
        ...valid,
        newPassword: "kenko1234",
        confirmNewPassword: "kenko1234",
      }).success,
    ).toBe(false);
  });

  it("exige la contraseña actual", () => {
    expect(
      changePasswordFormSchema.safeParse({ ...valid, currentPassword: "" }).success,
    ).toBe(false);
  });
});

describe("toChangePasswordRequest", () => {
  it("deja fuera la confirmación (al cable no viaja)", () => {
    expect(
      toChangePasswordRequest({
        currentPassword: "vieja-2026",
        newPassword: "nueva-clave-2026!",
        confirmNewPassword: "nueva-clave-2026!",
      }),
    ).toEqual({ currentPassword: "vieja-2026", newPassword: "nueva-clave-2026!" });
  });

  it("devuelve `null` si no valida (sin lanzar)", () => {
    expect(
      toChangePasswordRequest({
        currentPassword: "",
        newPassword: "nueva-clave-2026!",
        confirmNewPassword: "nueva-clave-2026!",
      }),
    ).toBeNull();
  });
});

describe("changePasswordPayloadSchema (lo que valida el BFF)", () => {
  it("acepta el cable sin confirmación", () => {
    const parsed = changePasswordPayloadSchema.safeParse({
      currentPassword: "vieja-2026",
      newPassword: "nueva-clave-2026!",
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza cable incompleto sin pedir confirmación", () => {
    const parsed = changePasswordPayloadSchema.safeParse({
      currentPassword: "vieja-2026",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.path.includes("confirmNewPassword"))).toBe(
        false,
      );
    }
  });
});

describe("changeEmailSchema", () => {
  it("normaliza igual que el backend (`trim` + minúsculas)", () => {
    const parsed = changeEmailSchema.safeParse({
      newEmail: "  Nuevo@Ejemplo.COM ",
      currentPassword: "clave-2026",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.newEmail).toBe("nuevo@ejemplo.com");
  });

  it("rechaza email inválido y contraseña vacía", () => {
    expect(
      changeEmailSchema.safeParse({ newEmail: "no-es-correo", currentPassword: "x" })
        .success,
    ).toBe(false);
    expect(
      changeEmailSchema.safeParse({ newEmail: "a@b.co", currentPassword: "" }).success,
    ).toBe(false);
  });
});

describe("toChangeEmailRequest", () => {
  it("devuelve el contrato normalizado", () => {
    expect(
      toChangeEmailRequest({ newEmail: "NUEVO@X.COM", currentPassword: "clave-2026" }),
    ).toEqual({ newEmail: "nuevo@x.com", currentPassword: "clave-2026" });
  });

  it("devuelve `null` si no valida", () => {
    expect(toChangeEmailRequest({ newEmail: "mal", currentPassword: "x" })).toBeNull();
  });
});
