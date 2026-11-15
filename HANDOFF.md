# Handoff — Oficina Virtual Kenko EPS (frontend auth)

> Alcance: todo lo acordado y construido **antes** del rediseño con `screen.png` / `DESIGN.md`.
> Ese rediseño queda fuera de este documento.

## 1. Proyecto

- Repo: `kenko-virtual-office-web`. Nuxt 4.6.4 + Vue 3.5 + TS + Tailwind 4 + Pinia 4 + `@pinia/colada` + `nuxt-auth-utils` + `@nuxtjs/i18n` (solo `es`) + `@nuxt/icon` + `@nuxt/image`. Package manager `bun`. Rama `feat/login`.
- Estructura: `app/` (pages, layouts, middleware, components, composables, features, utils), `server/api/*` (BFF Nitro), `shared/` (tipos/utils isomórficos), `public/logos/`, `docs/auth.md`, `colores-base.md`.
- Arquitectura: el browser solo habla con `/api/*` same-origin; Nitro proxyea al microservicio auth en `http://localhost:5500`. El refresh vive solo en cookie httpOnly `kenko_refresh`; el access vive solo en memoria Pinia. Nada de tokens en `localStorage` ni en URLs.

## 2. Alcance estricto

- Trabajar **única y exclusivamente autenticación**. No tocar `appointments`, `profile`, `home` ni `pages/index.vue` (la pantalla post-login la hace otro compañero; el login redirige a `/`).
- Código auth en `app/features/auth/*` + `server/api/auth/*`. Solo va a global (`shared/`, `app/composables/`, `app/components/ui/`, `app/layouts/`, `main.css`) lo que usen ≥2 features.
- Rutas en español: `/entrar`, `/registro`, `/recuperar`, `/restablecer`, `/mi-cuenta`. Ley 1581: placeholder `/privacidad#tratamiento-datos`.
- Paso a paso, una fase a la vez, verificado con `bunx eslint <archivos>` y `bun run build`.

## 3. Fuentes de verdad (no inventar)

- `docs/auth.md`: contrato del microservicio (sobre `{data}/{error}`, `details[]` solo en `VALIDATION_ERROR`, lógica por `code`, anti-enumeración en 409/401/200, `429` con `Retry-After`, límites por endpoint, 12 campos de registro, login con documento+password, `GET /auth/me` para el saludo, refresh silencioso, logout idempotente). Marcar como **suposición** lo no verificado: access 15 min, refresh 7 días, reset TTL 30 min, `resetUrl = <PORTAL_BASE_URL>/reset#token=<token>`.
- `colores-base.md`: `background #f9fafb`, `content #18181b`, `primary #21496a`, `secondary #ffb51b`, `accent #1e5bd7` + `on-*`; tarjeta blanca borde `content/10`; título `font-display text-primary`; botón `bg-primary text-on-primary`; foco `outline-secondary`; enlaces `text-accent`. Fuentes locales `Figtree` (display) + `Manrope` (body), variables `100 900`.
- UX: Propuesta A (wizard registro 4 pasos) + Centro de Seguridad de B. AA 2.2, móvil primero, táctil ≥44px, `<label>` + `aria-describedby`, errores con cómo corregirlo.
- `.env.example`: `NUXT_PUBLIC_API_AUTH_BASE=http://localhost:5500`, `NUXT_SESSION_PASSWORD` ≥32 chars. `.nuxtrc` legacy eliminado.

## 4. Decisiones cerradas

Base + Login primero (valida toda la cadena), BFF proxy, Zod para schemas, modelo de sesión en memoria + cookie httpOnly (sin guardar secretos en `nuxt-auth-utils`, su sesión es legible por API).

## 5. Estado por fases (todo verificado con build ok)

- **0.1**: sin `.nuxtrc`; `nuxt.config` con `runtimeConfig.public.apiAuthBase` + `head lang es`; `main.css` con tokens + `@font-face` + foco visible + `reduced-motion`.
- **0.2**: `shared/types` (envelope/error), `shared/utils` (normalizadores), `features/auth/{types,constants,index}` (tipos doc, blacklist 7, mensajes anti-enumeración).
- **0.3**: `zod@4`, `features/auth/schemas.ts` espejo §3.2, alias `#shared/*` (los relativos rompen el build Nitro).
- **0.4**: `composables/useApi.ts` (parseo `code/details/retryAfter`), `server/utils/backend.ts` + `server/api/auth/{login.post,me.get,refresh.post,logout.post}` (reenvío `authorization/cookie/correlation`, propaga `set-cookie` y `retry-after`), `features/auth/api.ts`.
- **0.5**: `features/auth/store.ts` Pinia (`user/accessToken/status/lastFailure`, `login` = login+me, `logout` limpia siempre).
- **0.6**: `layouts/auth.vue`, `components/ui/{UiButton,UiInput,UiPassword,UiAlert}`, `features/auth/components/DocumentTypeCards.vue` (solo CC/TI/CE/PA del backend).
- **1.0**: `pages/entrar.vue` + `middleware/{guest,auth}`. Login valida Zod, pinta `details`, countdown `429`, foco al primer error.
