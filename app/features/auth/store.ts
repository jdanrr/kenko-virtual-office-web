import { defineStore } from "pinia";

import { getQueryClient } from "../../core/query/client";
import { failureFromUnknown, fetchMe, login, logoutSession, refreshSession } from "./api";
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
/** Promesa compartida del bootstrap: las llamadas concurrentes la esperan. */
let restoringPromise: Promise<void> | null = null;

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  user: AuthUser | null;
  lastFailure: AuthFailure | null;
  lastLoginAt: number | null;
  expiresAt: number | null;
  /** `true` cuando el arranque terminó (haya sesión o no). Lo usa el guarda. */
  bootstrapped: boolean;
  /**
   * `true` solo si la última transición fue un logout voluntario.
   * La página `/sesion-cerrada` lo usa para mostrar la confirmación;
   * cualquier sesión nueva (`applySession`) lo apaga.
   */
  justLoggedOut: boolean;
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
    bootstrapped: false,
    justLoggedOut: false,
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
     * Las llamadas concurrentes esperan la misma promesa.
     */
    async restoreSession(): Promise<void> {
      if (restoringPromise) return restoringPromise;
      if (this.status !== "anonymous") {
        this.bootstrapped = true;
        return;
      }
      restoringPromise = (async () => {
        try {
          await this.applySession(await refreshSession());
        } catch {
          this.clearSession();
        } finally {
          this.bootstrapped = true;
        }
      })().finally(() => {
        restoringPromise = null;
      });
      return restoringPromise;
    },
    /**
     * Relee `GET /auth/me` con el token vigente (p. ej. tras `email/change`,
     * que ya es visible ahí aunque Profile lo reciba después por SQS).
     * No toca tokens ni expira la sesión: ante un fallo conserva el último
     * usuario conocido.
     */
    async refreshUser(): Promise<void> {
      if (this.status !== "authenticated" || !this.accessToken) return;
      try {
        this.user = await fetchMe(this.accessToken);
      } catch {
        // Intencionalmente silencioso: la página muestra su propio error.
      }
    },
    /** Renovación en segundo plano (§3.3). No muestra pantalla propia. */
    async refreshNow(): Promise<void> {      if (this.status !== "authenticated") return;
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
     * igualmente limpiar el estado). Apaga `justLoggedOut`: solo los
     * logouts voluntarios (`logOut`/`logOutEverywhere`) lo encienden después.
     */
    logOut(): void {
      this.clearSession();
      this.justLoggedOut = true;
    },
    /**
     * Cierre completo (§3.4): avisa al servidor (revoca TODAS las sesiones),
     * limpia el estado, vacía la caché de TanStack Query y muestra la
     * confirmación "Saliste de tu cuenta".
     * Nunca lanza: `logoutSession` es idempotente por contrato.
     */
    async logOutEverywhere(): Promise<void> {
      await logoutSession();
      this.clearSession();
      this.justLoggedOut = true;
      getQueryClient().clear();
      await navigateTo("/sesion-cerrada");
    },
    async applySession(result: LoginResult): Promise<void> {
      const user = await fetchMe(result.accessToken);
      this.accessToken = result.accessToken;
      this.user = user;
      this.lastFailure = null;
      this.lastLoginAt = Date.now();
      this.expiresAt = this.lastLoginAt + result.expiresIn * 1000;
      this.status = "authenticated";
      this.justLoggedOut = false;
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
      this.justLoggedOut = false;
    },
    scheduleRefresh(expiresInSeconds: number): void {
      const delayMs = Math.max(
        (expiresInSeconds - REFRESH_SKEW_SECONDS) * 1000,
        MIN_REFRESH_DELAY_MS,
      );
      this.scheduleRefreshMs(delayMs);
    },
    scheduleRefreshMs(_delayMs: number): void {
      // Desactivado por decisión del equipo: la renovación es reactiva
      // (ante 401 con un único refresh en vuelo) más el arranque.
      // Se conserva el método para no romper la API del store.
      clearRefreshTimer();
    },
    toFailure(error: unknown): AuthFailure {
      return failureFromUnknown(error);
    },
  },
});
