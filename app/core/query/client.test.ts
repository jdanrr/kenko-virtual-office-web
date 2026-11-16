import { describe, expect, it } from "vitest";

import { ApiError } from "../api/apiError";
import { getQueryClient, queryKeys, shouldRetry } from "./client";

/** Pruebas de la configuración de TanStack Query (sin red). */

describe("shouldRetry", () => {
  it("no reintenta errores 4xx", () => {
    const error = new ApiError({ status: 401, code: "UNAUTHORIZED", message: "x" });
    expect(shouldRetry(0, error)).toBe(false);
    expect(shouldRetry(0, new ApiError({ status: 429, code: "RATE_LIMITED", message: "x" }))).toBe(false);
  });

  it("reintenta hasta 2 veces los fallos de red y 5xx", () => {
    const network = new ApiError({ status: 0, code: "NETWORK_ERROR", message: "x" });
    const server = new ApiError({ status: 500, code: "INTERNAL_ERROR", message: "x" });
    expect(shouldRetry(0, network)).toBe(true);
    expect(shouldRetry(1, server)).toBe(true);
    expect(shouldRetry(2, network)).toBe(false);
    expect(shouldRetry(2, server)).toBe(false);
  });
});

describe("getQueryClient", () => {
  it("desactiva refetchOnWindowFocus y usa staleTime corto", () => {
    const client = getQueryClient();
    expect(client.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);
    expect(client.getDefaultOptions().queries?.staleTime).toBe(30_000);
  });

  it("las claves son arreglos estables por feature y recurso", () => {
    expect(queryKeys.auth.me()).toEqual(["auth", "me"]);
  });
});
