import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  resetPasswordSchema,
  toForgotRequest,
  tokenFromFragment,
  toResetRequest,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
} from "./passwordRecoverySchemas";

const forgot: ForgotPasswordFormValues = {
  documentType: "CC",
  documentNumber: " 10.203-040 ",
};

const reset: ResetPasswordFormValues = {
  token: "opaco-del-fragmento",
  password: "Clave-nueva-1",
  confirmPassword: "Clave-nueva-1",
};

describe("forgotPasswordSchema", () => {
  it("normaliza el documento como login/registro", () => {
    expect(toForgotRequest(forgot)).toEqual({
      documentType: "CC",
      documentNumber: "10203040",
    });
    expect(forgotPasswordSchema.safeParse({ ...forgot, documentNumber: "12" }).success).toBe(
      false,
    );
  });
});

describe("resetPasswordSchema", () => {
  it("acepta token opaco + política §3.1 y devuelve el request", () => {
    const request = toResetRequest(reset);
    expect(request).toEqual({
      token: "opaco-del-fragmento",
      password: "Clave-nueva-1",
      confirmPassword: "Clave-nueva-1",
    });
  });

  it("rechaza token vacío, lista negra y confirmación distinta", () => {
    expect(
      resetPasswordSchema.safeParse({ ...reset, token: "" }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({
        ...reset,
        password: "kenko1234",
        confirmPassword: "kenko1234",
      }).success,
    ).toBe(false);
    const mismatch = resetPasswordSchema.safeParse({
      ...reset,
      confirmPassword: "Otra-2",
    });
    expect(mismatch.success).toBe(false);
    if (mismatch.success) return;
    expect(mismatch.error.issues[0]?.path).toEqual(["confirmPassword"]);
  });
});

describe("tokenFromFragment", () => {
  it("extrae el token del fragmento sin exponerlo en logs", () => {
    expect(tokenFromFragment("#token=abc123")).toBe("abc123");
    expect(tokenFromFragment("token=abc123")).toBe("abc123");
    expect(tokenFromFragment("")).toBeNull();
    expect(tokenFromFragment("#foo=1")).toBeNull();
    expect(tokenFromFragment("#token=")).toBeNull();
  });
});
