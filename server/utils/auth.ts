import { randomUUID } from "node:crypto";

import type {
  ApiFailure,
  ApiFieldDetail,
  ApiSuccess,
} from "../../app/features/auth/types";

/**
 * Helpers puros del BFF de Authentication (`server/api/auth/*`).
 * Sin I/O: toda la lógica testeable vive aquí; las rutas son pegamento fino.
 * Fuente de verdad: `docs/auth-service.md` §1–§3.
 */

/** §2: cookie httpOnly de refresh que fija/rota/limpia el backend. */
export const AUTH_REFRESH_COOKIE = "kenko_refresh";

/**
 * Base del microservicio Auth sin `/` final.
 * Sin fallback: exige `NUXT_PUBLIC_API_AUTH_BASE` (`http://localhost:5500`
 * en dev, `http://52.203.252.87:3000` en prod). Devuelve `""` si falta para
 * que cada ruta responda 500 en vez de apuntar al mismo origen y dar 404.
 * Evita `//auth/...` (Hono es estricto y responde 404) cuando el `.env`
 * trae la base con barra final.
 */
export function upstreamAuthBase(): string {
  const raw = process.env.NUXT_PUBLIC_API_AUTH_BASE ?? "";
  return raw.trim().replace(/\/+$/, "");
}

/** §2: la BFF genera `X-Correlation-Id` cuando el navegador no trae uno. */
export function newCorrelationId(): string {
  return randomUUID();
}

/** Issue mínimo estructural (evita acoplar este helper a la versión de zod). */
export interface ValidationIssue {
  path: ReadonlyArray<string | number>;
  message: string;
}

/**
 * §1.2: convierte issues de validación al `details` del contrato
 * (`[{ field?, message }]`, solo existe en `VALIDATION_ERROR`).
 */
export function toFieldDetails(
  issues: ReadonlyArray<ValidationIssue>,
): ApiFieldDetail[] {
  return issues.map((issue) => {
    const [first] = issue.path;
    return typeof first === "string" && first.length > 0
      ? { field: first, message: issue.message }
      : { message: issue.message };
  });
}

/** §1.2: sobre de éxito con forma `{ data }`. */
export function isDataEnvelope(payload: unknown): payload is ApiSuccess<unknown> {
  return typeof payload === "object" && payload !== null && "data" in payload;
}

export function validationErrorEnvelope(
  details: ApiFieldDetail[],
  correlationId: string,
): { status: 400; body: ApiFailure } {
  return {
    status: 400,
    body: {
      error: {
        code: "VALIDATION_ERROR",
        message: "Revisa los datos ingresados.",
        correlationId,
        details,
      },
    },
  };
}

export function unauthorizedEnvelope(correlationId: string): {
  status: 401;
  body: ApiFailure;
} {
  return {
    status: 401,
    body: {
      error: {
        code: "UNAUTHORIZED",
        message: "Credenciales inválidas.",
        correlationId,
      },
    },
  };
}

export function internalErrorEnvelope(correlationId: string): {
  status: 500;
  body: ApiFailure;
} {
  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: "Error interno. Intente de nuevo más tarde.",
        correlationId,
      },
    },
  };
}

/**
 * Extrae de los headers upstream solo las cookies con el nombre dado,
 * para reenviarlas intactas (sin leer ni modificar su valor).
 */
export function pickCookies(headers: Headers, name: string): string[] {
  const getter = (headers as unknown as { getSetCookie?: () => string[] })
    .getSetCookie;
  const all = typeof getter === "function" ? getter.call(headers) : [];
  const fallback = headers.get("set-cookie");
  const candidates = all.length > 0 ? all : fallback ? [fallback] : [];
  return candidates.filter((cookie) => cookie.startsWith(`${name}=`));
}

/**
 * Del header `cookie` entrante arma `name=value` para enviar solo la cookie
 * de refresh al microservicio (sin reenviar cookies ajenas a Auth).
 * Devuelve `null` si la cookie no está o viene vacía.
 */
export function forwardCookie(
  rawCookieHeader: string | undefined,
  name: string,
): string | null {
  if (!rawCookieHeader) return null;
  for (const part of rawCookieHeader.split(";")) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    if (trimmed.slice(0, separator) !== name) continue;
    const value = trimmed.slice(separator + 1);
    return value.length > 0 ? `${name}=${value}` : null;
  }
  return null;
}
