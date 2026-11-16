import { refreshSession } from "~/features/auth/api";
import { setAuthHooks } from "~/core/api/httpClient";
import { useAuthStore } from "~/features/auth/store";

/**
 * Arranque de sesión solo en el cliente.
 * - Conecta el cliente directo (`core/api`) con la sesión: el refresh usa
 *   el BFF (`/api/auth/refresh`, misma decisión 3B) y su fallo limpia
 *   la sesión y redirige al login.
 * - Ejecuta el bootstrap silencioso: `400`/`401` en el primer refresh
 *   significa "no hay sesión" (anonymous, sin error visible).
 */
export default defineNuxtPlugin(async () => {
  const auth = useAuthStore();
  setAuthHooks({
    refreshAccessToken: async () => {
      const result = await refreshSession();
      await auth.applySession(result);
      return result;
    },
    handleRefreshFailure: () => {
      auth.clearSession({
        kind: "session-expired",
        message: "Tu sesión terminó. Vuelve a entrar.",
      });
      void navigateTo("/iniciar-sesion");
    },
  });
  await auth.restoreSession();
});
