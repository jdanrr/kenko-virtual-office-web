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
  let redirecting = false;
  // Un login fresco (formulario o restore) también habilita futuras
  // redirecciones: refreshAccessToken no corre en ese camino y sin esto
  // la segunda expiración no redirigiría y la UI quedaría colgada en 401.
  auth.$subscribe((_mutation, state) => {
    if (state.status === "authenticated") redirecting = false;
  });
  setAuthHooks({
    refreshAccessToken: async () => {
      const result = await refreshSession();
      await auth.applySession(result);
      // Sesión recuperada: permitir futuras redirecciones si vuelve a vencer.
      redirecting = false;
      return result;
    },
    handleRefreshFailure: () => {
      // Una sola redirección: varias queries fallan a la vez y cada una
      // llamaría a esto; sin guarda se encadenan navigates y se revive la sesión.
      if (auth.status === "anonymous" && redirecting) return;
      auth.clearSession({
        kind: "session-expired",
        message: "Tu sesión terminó. Vuelve a entrar.",
      });
      if (redirecting) return;
      redirecting = true;
      void navigateTo("/iniciar-sesion");
    },
  });
  await auth.restoreSession();
});
