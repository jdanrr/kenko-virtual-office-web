// API pública de la feature auth.
// Las demás features importan la sesión desde aquí, nunca de archivos internos.
export { useAuthStore } from "./store";
export type { AuthStatus } from "./store";
export type { AuthUser } from "./types";
