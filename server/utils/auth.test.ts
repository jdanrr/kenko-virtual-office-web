import { describe, expect, it } from "vitest";

import {
  AUTH_REFRESH_COOKIE,
  forwardCookie,
  internalErrorEnvelope,
  isDataEnvelope,
  newCorrelationId,
  pickCookies,
  toFieldDetails,
  unauthorizedEnvelope,
  validationErrorEnvelope,
} from "./auth";

describe("toFieldDetails", () => {
  it("mapea path y mensaje al formato details del contrato", () => {
    expect(
      toFieldDetails([
        { path: ["documentNumber"], message: "Revisa el número." },
        { path: [], message: "Petición inválida." },
        { path: [0], message: "Ítem inválido." },
      ]),
    ).toEqual([
      { field: "documentNumber", message: "Revisa el número." },
      { message: "Petición inválida." },
      { message: "Ítem inválido." },
    ]);
  });
});

describe("isDataEnvelope", () => {
  it("acepta { data } y rechaza { error } o malformados", () => {
    expect(isDataEnvelope({ data: {} })).toBe(true);
    expect(isDataEnvelope({ error: { code: "X" } })).toBe(false);
    expect(isDataEnvelope(null)).toBe(false);
  });
});

describe("envelopes de error", () => {
  it("usan code estable, mensaje genérico y correlationId", () => {
    const id = newCorrelationId();
    expect(id.length).toBeGreaterThan(0);

    const validation = validationErrorEnvelope(
      [{ field: "password", message: "Escribe tu contraseña." }],
      id,
    );
    expect(validation.status).toBe(400);
    expect(validation.body.error.code).toBe("VALIDATION_ERROR");
    expect(validation.body.error.correlationId).toBe(id);
    expect(validation.body.error.details).toHaveLength(1);

    const unauthorized = unauthorizedEnvelope(id);
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.body.error.code).toBe("UNAUTHORIZED");
    expect(unauthorized.body.error.details).toBeUndefined();

    const internal = internalErrorEnvelope(id);
    expect(internal.status).toBe(500);
    expect(internal.body.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("pickCookies", () => {
  it("reenvía solo la cookie de refresh, intacta", () => {
    const headers = new Headers();
    headers.append(
      "set-cookie",
      `${AUTH_REFRESH_COOKIE}=abc123; Path=/; HttpOnly; SameSite=Lax`,
    );
    headers.append("set-cookie", "other=1; Path=/");

    expect(pickCookies(headers, AUTH_REFRESH_COOKIE)).toEqual([
      `${AUTH_REFRESH_COOKIE}=abc123; Path=/; HttpOnly; SameSite=Lax`,
    ]);
    expect(pickCookies(headers, "missing")).toEqual([]);
    expect(pickCookies(new Headers(), AUTH_REFRESH_COOKIE)).toEqual([]);
  });
});

describe("forwardCookie", () => {
  it("extrae solo la cookie de refresh del header entrante", () => {
    expect(
      forwardCookie(
        `theme=dark; ${AUTH_REFRESH_COOKIE}=abc123; other=1`,
        AUTH_REFRESH_COOKIE,
      ),
    ).toBe(`${AUTH_REFRESH_COOKIE}=abc123`);
  });

  it("no devuelve nada si falta o viene vacía", () => {
    expect(forwardCookie(undefined, AUTH_REFRESH_COOKIE)).toBeNull();
    expect(forwardCookie("theme=dark", AUTH_REFRESH_COOKIE)).toBeNull();
    expect(forwardCookie(`${AUTH_REFRESH_COOKIE}=`, AUTH_REFRESH_COOKIE)).toBeNull();
    expect(forwardCookie("=abc", AUTH_REFRESH_COOKIE)).toBeNull();
  });
});
