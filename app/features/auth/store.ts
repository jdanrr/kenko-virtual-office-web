import { defineStore } from "pinia";

import { AuthError, fetchMe, login, refreshSession } from "./api";
import type { LoginFormValues } from "./schemas";
import type { AuthUser } from "./types";
import type { AuthFailure, LoginResult } from "./api";

/**
 * Sesión de Authentication en el navegador.
 * Fuente de verdad: `docs/auth-service.md` §2–§3.
 *
 * - `accessToken` vive **solo en memoria** (nunca `localStorage`).
 * - El refresh vive solo en la cookie httpOnly `kenko_refresh`: este store
 *   nunca lo toca (ni lo registra).
 * - Renovación silenciosa (§3.3): al vencer el access token se pide refresh
 *   en segundo plano; ante 401 se cierra la sesión local y se pide login.
 * - El saludo sale de `GET /auth/me`, nunca decodificando el JWT.
 */
export type AuthStatus = "anonymous" | "authenticating" | "authenticated";

/** Margen antes del vencimiento para renovar (contrato: `expiresIn` 900 s). */
const REFRESH_SKEW_SECONDS = 60;
const MIN_REFRESH_DELAY_MS = 5_000;
const RETRY_AFTER_NETWORK_ERROR_MS = 60_000;

/** Timer fuera del estado: no debe serializarse ni viajar al cliente. */
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let restoring = false;

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  user: AuthUser | null;
  lastFailure: AuthFailure | null;
  lastLoginAt: number | null;
  expiresAt: number | null;
}

function clearRefreshTimer(): void {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    status: "anonymous",
    accessToken: null,
    user: null,
    lastFailure: null,
    lastLoginAt: null,
    expiresAt: null,
  }),
  getters: {
    isAuthenticated: (state): boolean =>
      state.status === "authenticated" &&
      state.accessToken !== null &&
      state.user !== null,
    greeting: (state): string | null =>
      state.user ? `Hola, ${state.user.firstName}` : null,
  },
  actions: {
    async logIn(values: LoginFormValues): Promise<void> {
      if (this.status === "authenticating") return;
      this.status = "authenticating";
      this.lastFailure = null;
      try {
        await this.applySession(await login(values));
      } catch (error) {
        this.clearSession(this.toFailure(error));
      }
    },
    /**
     * Refresh silencioso al abrir la app (p. ej. tras recargar): si la cookie
     * httpOnly sigue vigente, la sesión se recupera sin pedir credenciales.
     * Un fallo aquí NO es un error visible (no hay sesión que mostrar).
     */
    async restoreSession(): Promise<void> {
      if (restoring || this.status !== "anonymous") return;
      restoring = true;
      try {
        await this.applySession(await refreshSession());
      } catch {
        this.clearSession();
      } finally {
        restoring = false;
      }
    },
    /** Renovación en segundo plano (§3.3). No muestra pantalla propia. */
    async refreshNow(): Promise<void> {
      if (this.status !== "authenticated") return;
      try {
        await this.applySession(await refreshSession());
      } catch (error) {
        const failure = this.toFailure(error);
        if (failure.kind === "session-expired") {
          this.clearSession(failure);
          return;
        }
        // Fallo transitorio (red/429/500): conservar la sesión y reintentar.
        this.scheduleRefreshMs(RETRY_AFTER_NETWORK_ERROR_MS);
      }
    },
    /**
     * Limpieza local idempotente (contrato §3.4: ante cualquier fallo de red,
     * igualmente limpiar el estado). El logout remoto llega en otro paso.
     */
    logOut(): void {
      this.clearSession();
    },
    async applySession(result: LoginResult): Promise<void> {
      const user = await fetchMe(result.accessToken);
      this.accessToken = result.accessToken;
      this.user = user;
      this.lastFailure = null;
      this.lastLoginAt = Date.now();
      this.expiresAt = this.lastLoginAt + result.expiresIn * 1000;
      this.status = "authenticated";
      this.scheduleRefresh(result.expiresIn);
    },
    clearSession(failure: AuthFailure | null = null): void {
      clearRefreshTimer();
      this.accessToken = null;
      this.user = null;
      this.lastLoginAt = null;
      this.expiresAt = null;
      this.status = "anonymous";
      this.lastFailure = failure;
    },
    scheduleRefresh(expiresInSeconds: number): void {
      const delayMs = Math.max(
        (expiresInSeconds - REFRESH_SKEW_SECONDS) * 1000,
        MIN_REFRESH_DELAY_MS,
      );
      this.scheduleRefreshMs(delayMs);
    },
    scheduleRefreshMs(delayMs: number): void {
      clearRefreshTimer();
      if (typeof window === "undefined") return;
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        void this.refreshNow();
      }, delayMs);
      (refreshTimer as unknown as { unref?: () => void }).unref?.();
    },
    toFailure(error: unknown): AuthFailure {
      return error instanceof AuthError
        ? error.failure
        : {
            kind: "unexpected",
            message: "Tuvimos un problema. Intenta de nuevo más tarde.",
          };
    },
  },
});
