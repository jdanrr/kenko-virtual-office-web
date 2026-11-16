/**
 * Error normalizado de los microservicios Kenko.
 * Contrato: `docs/auth-service.md` §1.2 y §3.10 (sobre `{ error }`, `code`
 * estable, `details` solo en `VALIDATION_ERROR`, `Retry-After` en `429`).
 * Nunca incluye tokens ni datos personales: solo el sobre del servidor.
 */

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorInit {
  /** Estado HTTP; `0` = fallo de red (sin respuesta del servidor). */
  status: number;
  /** Código estable del contrato (`VALIDATION_ERROR`, …) o `NETWORK_ERROR`. */
  code: string;
  message: string;
  correlationId?: string;
  details?: ApiErrorDetail[];
  retryAfterSeconds?: number;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly correlationId?: string;
  readonly details?: ApiErrorDetail[];
  readonly retryAfterSeconds?: number;

  constructor(init: ApiErrorInit) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.correlationId = init.correlationId;
    this.details = init.details;
    this.retryAfterSeconds = init.retryAfterSeconds;
  }

  /** `true` para `4xx`: no reintentar (salvo que el llamador decida). */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}
