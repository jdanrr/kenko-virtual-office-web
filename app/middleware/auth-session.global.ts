import { useAuthStore } from "~/features/auth/store";

/**
 * Guarda de sesión (solo cliente: la sesión vive en el navegador).
 * - Espera a que el bootstrap termine antes de decidir (sin parpadeos).
 * - Rutas privadas exigen sesión; sin ella → `/iniciar-sesion?redirect=<ruta>`.
 * - Rutas públicas con sesión activa → `/` (evita el bucle de login).
 *
 * La página de login aún no consume `?redirect=` (pendiente de las
 * pantallas): hoy el login deja al usuario donde está. Las rutas
 * `/recuperar-contrasena` aún no tiene página (muestra 404) y `/reset`
 * la genera el backend en el enlace del correo (no renombrar).
 */
const PUBLIC_PATHS = ["/iniciar-sesion", "/registro", "/recuperar-contrasena", "/reset"];

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;
  const auth = useAuthStore();
  if (!auth.bootstrapped) await auth.restoreSession();
  const isPublic = PUBLIC_PATHS.includes(to.path);
  if (!auth.isAuthenticated && !isPublic) {
    return navigateTo({ path: "/iniciar-sesion", query: { redirect: to.fullPath } });
  }
  if (auth.isAuthenticated && isPublic) {
    return navigateTo("/home-page");
  }
});
