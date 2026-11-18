# Handoff — Feature Authentication (Kenko Oficina Virtual Web)

> Documento para continuar el trabajo en un chat nuevo con otro agente de IA.
> Léelo completo antes de tocar código. Última actualización: 2026-11-15.

---

## 1. Contexto del proyecto

- **Repo:** frontend Nuxt de la Oficina Virtual de Kenko EPS.
- **Equipo:** 3 desarrolladores con features distintas. El autor de este trabajo es responsable del microservicio **Authentication**.
- **Estado del repo:** esqueleto. Muchos archivos estaban vacíos (0 líneas) o con configuración básica.
- **Frontend:** consumirá 4 microservicios (hoy locales, sin desplegar). Los microservicios se comunican de forma asíncrona entre sí con AWS (EventBridge + SQS); el frontend **solo consume sus APIs**.
- **Alcance de este trabajo:** únicamente código de **Authentication**. El código compartido se toca solo si es realmente transversal y avisando antes.

### Stack real verificado

| Pieza | Versión / decisión |
| --- | --- |
| Nuxt | 4.6.4 |
| Vue | 3.5.45 |
| Tailwind | 4.3.5 vía `@tailwindcss/vite` |
| Estado | Pinia 4.1.0 (`@pinia/nuxt`), `@pinia/colada` instalado pero no usado aún |
| Auth de servidor | `nuxt-auth-utils` 0.6.2 (instalado; **aún no integrado**, ver §9) |
| i18n | `@nuxtjs/i18n` 10.6.0, solo locale `es` |
| Iconos | `@nuxt/icon` (los iconos de la feature se hicieron como SVG inline) |
| Validación | `zod` 4.6.7 (agregado) |
| Tests | `vitest` 5.1.0 + `@vue/test-utils` 2.6.0 + `happy-dom` 21.0.4 + `@vitejs/plugin-vue` 6.0.11 |
| Gestor | `bun` 1.4.4 (`bun.lock`) |

---

## 2. Prompt inicial del usuario (resumen fiel)

El usuario pidió construir el **Login** de Authentication con estas reglas:

### Fuentes de verdad obligatorias (leer antes de proponer nada)
- Contrato del microservicio Auth: `docs/auth-service.md`.
- Diseño del login: `docs/login/` (captura `screen.png`, HTML de referencia `code.html`, `DESIGN.md`).
- Colores y fuentes: `colores-base.md`.
- Logos: `public/logos/`.
- **Si algo no está en estas fuentes, no inventarlo: preguntar.**

### Reglas de trabajo
1. **Alcance:** solo código de Authentication. Código compartido solo si es transversal y avisando antes.
2. **Cero improvisación:** cualquier duda de endpoints, campos, flujos o decisiones técnicas se pregunta antes de escribir código.
3. **Incremental:** un paso pequeño a la vez. Nunca una pantalla/feature completa de golpe. Al terminar cada paso: resumen breve y esperar aprobación.
4. **Arquitectura (prioridad máxima):** muchos archivos pequeños con una sola responsabilidad. Separar UI, lógica, acceso a API y validaciones. Fácil de testear, depurar y entender. Evitar archivos grandes.
5. **Producción 2026 sin sobreingeniería:** tipado estricto, validación de formularios y de respuestas de API, manejo de errores y estados de carga, accesibilidad, manejo seguro de sesión/tokens según contrato, sin secretos en código. Respetar stack y convenciones existentes.
6. **Tests:** incluir pruebas en cada paso donde aplique.

### Flujo solicitado
1. Análisis sin código (estructura, tecnologías, convenciones; resumen + dudas).
2. Plan de pasos (estructura de carpetas/archivos y orden) con aprobación.
3. Ejecución paso a paso.
4. Al terminar el login, proponer qué funcionalidad de autenticación sigue y por qué.

### Tarea actual
Implementar el login según el diseño y el contrato, **adaptando** el HTML de referencia a la arquitectura y componentes del proyecto, sin copiarlo tal cual.

---

## 3. Decisiones tomadas (con el usuario)

| Tema | Decisión |
| --- | --- |
| Tipos de documento | Solo `CC`, `TI`, `CE`, `PA` (contrato §3.2). **No** se incluye "Otro / PPT" del mockup. |
| Comunicación con el microservicio | **BFF en Nuxt** (`server/api/auth/*`). El navegador nunca llama directo a `8001`. |
| Dónde vive el access token | **Solo en memoria** (Pinia). Nunca `localStorage`. |
| Dónde vive el refresh token | Solo en la cookie httpOnly `kenko_refresh` que fija el backend. El frontend no la lee ni la escribe. |
| `nuxt-auth-utils` | Se intentó usar, pero su sesión es legible por el cliente. **No guardar allí el accessToken.** Se usará más adelante solo con perfil público (`userId`, `firstName`, `email`). Todavía no hay endpoint que escriba esa sesión; integrarla ahora sería código muerto. |
| "Recordar mi documento" | Solo `documentType + documentNumber` normalizado en `localStorage`, únicamente con checkbox marcado. Nunca contraseña ni tokens. Se borra al desmarcar. |
| Tras login exitoso | **Sin redirección**: se muestra saludo inline "Hola, {firstName}" en `/iniciar-sesion`. La vista destino la hará otro compañero; cuando exista, se avisará para redirigir. |
| Header / footer / aside | Incluidos completos según diseño. Lo no implementado queda **placeholder deshabilitado** (no `alert()`, no enlaces falsos). |
| Enlaces "Crear cuenta" y "¿Olvidaste tu contraseña?" | Deshabilitados hasta implementar esos flujos. |
| Tipografía, colores y fuentes | `colores-base.md` es la **verdad absoluta** para todo el código: Figtree (títulos) + Manrope (cuerpo), solo paleta base (`primary #21496a`, `secondary #ffb51b`, `accent #1e5bd7`, etc.). Ignorar las diferencias de `docs/login/DESIGN.md` (Space Grotesk / otros grises). |
| Dependencias de validación/tests | Autorizado instalar `zod` y `vitest` (+ utilidades de test de componentes). |
| Rutas de páginas | **Siempre en español**, kebab-case y sin tildes: `/iniciar-sesion` (login). Futuras: `/recuperar-contrasena`, `/registro`, `/mi-cuenta`. **Excepción:** las rutas BFF `/api/auth/*` y los endpoints del microservicio siguen en inglés porque son API, no navegación. |

---

## 4. Arquitectura actual de la feature

### Feature (`app/features/auth/`)

| Archivo | Responsabilidad | Tests |
| --- | --- | --- |
| `types.ts` | Tipos del contrato: `DOCUMENT_TYPES`, `LoginRequest`, `AuthTokenPair`, `AuthUser`, sobre `{ data }/{ error }`, `ApiErrorCode`, guardia `isApiFailure`. | `types.test.ts` |
| `schemas.ts` | `normalizeDocumentNumber`, `loginSchema` (zod), `toLoginRequest`. **Server-safe** (lo importa el BFF). | `schemas.test.ts` |
| `api.ts` | Cliente del BFF: `login`, `fetchMe`, `refreshSession`, `register`. Traduce errores a `AuthFailure` por `code` (nunca por `message`), incluye `register-conflict` (409 genérico). Client-safe. | `api.test.ts` |
| `store.ts` | Pinia `useAuthStore`: sesión en memoria, `logIn`, `restoreSession`, `refreshNow`, `logOut`, auto-refresh 60 s antes de vencer, getters `isAuthenticated`/`greeting`. | `store.test.ts` |
| `rememberDocument.ts` | Persistencia opt-in del documento en `localStorage`, SSR-safe y tolerante a datos corruptos. | `rememberDocument.test.ts` |
| `components/DocumentTypeSelector.vue` | Radiogroup accesible de 4 tipos. | `.test.ts` |
| `components/DocumentNumberField.vue` | Input de documento con ayuda "sin puntos" y error asociado. | `.test.ts` |
| `components/PasswordField.vue` | Input de contraseña con mostrar/ocultar accesible. | `.test.ts` |
| `components/AuthAlert.vue` | Aviso `role="alert"` con código de referencia (`correlationId`). | `.test.ts` |
| `registerStore.ts` | `useRegisterStore`: wizard 4 pasos en memoria, validación por paso, `submit()` con salto al paso con error, `stepFields`, `reset()`. | `registerStore.test.ts` |
| `registerSchemas.ts` | Schemas zod por paso + `birthDateLimits()`, `normalizePhone`, `isBlacklistedPassword`, `toRegisterRequest()`. Server-safe. | `registerSchemas.test.ts` |
| `phoneFormat.ts` | Formato visual del celular (presentación; la normalización vive en schemas). | `phoneFormat.test.ts` |
| `components/RegisterStepper.vue` + `PersonalFields.vue` + `ContactFields.vue` + `SecurityFields.vue` + `RegisterForm.vue` (wizard) + `RegisterSummary.vue` + `RegisterSuccessModal.vue` | UI del registro; `PasswordField` extendido con props opcionales (login intacto). | `.test.ts` c/u |

### BFF (`server/`)

| Archivo | Responsabilidad |
| --- | --- |
| `server/utils/auth.ts` | Helpers puros: `newCorrelationId`, `toFieldDetails`, `isDataEnvelope`, envelopes 400/401/500, `pickCookies` (reenviar cookie), `forwardCookie` (extraer solo `kenko_refresh` del request). |
| `server/utils/auth.test.ts` | Tests de helpers. |
| `server/api/auth/login.post.ts` | `POST /api/auth/login` → `POST /auth/login` del microservicio. Revalida con `loginSchema`, reenvía cookie y `retry-after`, descarta `refreshToken` de la respuesta. |
| `server/api/auth/me.get.ts` | `GET /api/auth/me` → `GET /auth/me`. Exige y reenvía `Authorization: Bearer`. |
| `server/api/auth/refresh.post.ts` | `POST /api/auth/refresh` → `POST /auth/refresh`. Reenvía solo la cookie httpOnly, propaga cookie rotada y `retry-after`. Sin cookie → 401. |
| `server/api/auth/register.post.ts` | `POST /api/auth/register` → `POST /auth/register`. Revalida todo, propaga `201` / `400`+`details` / `409` / `429`. Sin PII en logs. |

### UI y estilos

| Archivo | Responsabilidad |
| --- | --- |
| `app/pages/iniciar-sesion.vue` | Página `/iniciar-sesion`: tarjeta + aside de seguridad, saludo inline tras login, intenta `restoreSession()` al montar. Placeholders deshabilitados. |
| `app/pages/registro.vue` | Página `/registro` (ruta pública): wizard 4 pasos + resumen en vivo + ayuda, modal de éxito con `maskedEmail` y enlace real a `/iniciar-sesion`. Borrador solo en memoria. |
| `app/layouts/auth.vue` | Layout de acceso: header institucional, slot, footer legal. |
| `app/layouts/auth.test.ts` | Render SSR del layout (markup estático). |
| `app/assets/css/main.css` | Tailwind + `@font-face` locales + variables y `@theme inline` según `colores-base.md`. |
| `vitest.config.ts` | Solo infra de tests: plugin Vue, happy-dom, `transformAssetUrls.img: []` (evita que Vite intente resolver `/public` en tests). |

### Endpoints BFF (forma que consume el navegador)

- `POST /api/auth/login` → `200 { data: { accessToken, expiresIn } }` (el refresh **no** se devuelve).
- `GET /api/auth/me` → `200 { data: { userId, firstName, email } }`.
- `POST /api/auth/refresh` → `200 { data: { accessToken, expiresIn } }`.
- `POST /api/auth/register` → `201 { data: { userId, maskedEmail } }`.
- Errores siempre `{ error: { code, message, correlationId, details? } }`.

---

## 5. Pasos ejecutados (todos aprobados)

| Paso | Qué se hizo | Verificación |
| --- | --- | --- |
| 0 | `zod` + `vitest`; theme Tailwind v4, `@font-face` Figtree/Manrope y base `body` en `main.css`; script `test`. | lint + build |
| 1 | `types.ts` del contrato + guardia de error. | 4 tests |
| 2 | `schemas.ts` (normalización documento + reglas §3.2) + puente `LoginRequest`. | 5 tests |
| 3 | BFF login/me + helpers puros con `correlationId`, cookie, `Retry-After`, sin PII en logs. | 13 tests + build |
| 4 | Cliente `api.ts` con errores UI por `code` (`validation`, `invalid-credentials`, `session-expired`, `rate-limited`, `network`, `unexpected`). | 8 tests |
| 5 | Store Pinia: login → `/me`, logout local, saludo. | 4 tests |
| 6 | 4 átomos accesibles + tests de componentes. | 9 tests |
| 7 | `LoginForm`, `rememberDocument`, `layouts/auth.vue`, `pages/iniciar-sesion.vue`, placeholders deshabilitados, saludo inline sin redirect. | 43 tests totales + build |
| 8 | Refresh silencioso: BFF `/refresh`, `refreshSession`, auto-renovación y `restoreSession`, corrección de validación de contraseña (error duplicado). | 51 tests + endpoints probados en dev |
| R0–R8 | Registro: tipos + schemas por paso, BFF `/register`, cliente con `register-conflict`, `registerStore`, UI 4 pasos + stepper + resumen + modal éxito, página `/registro` (ruta pública en middleware). Decisiones: ciudad texto libre, checklist según contrato, layout auth reusado, borrador en memoria. | 115 tests + lint + build verde |

**Estado de verificación actual:** `bunx vitest run` → **186/186**; alcance auth + BFF con lint limpio (el lint global falla solo en archivos ajenos); `bun run build` verde. E2E real contra backend 5500: registro `201`, login `200` + cookie, refresh `200`. Recuperación (F1–F6): tipos + schemas + BFF + cliente (`reset-invalid`) + formularios + `PasswordChecklist` + páginas + enlace en login. Logout: página `/sesion-cerrada` con mensaje condicional (`justLoggedOut`), `logOutEverywhere` navega allí, ruta pública en middleware; en vivo sin backend: página `200`, BFF `logout → 200 {data:{}}` idempotente (falta E2E con backend corriendo).

---

## 6. Seguridad implementada (no romper)

- Refresh **solo** en cookie httpOnly; el cliente nunca lo lee, escribe ni registra.
- Access token **solo en memoria**; nunca `localStorage`.
- La respuesta de login/refresh del BFF **descarta `refreshToken`** (defensa en profundidad).
- Errores por `code` estable, nunca comparando `message`.
- Anti-enumeración: 401 de login siempre genérico ("El documento o la contraseña no son correctos.").
- `429`: se lee `Retry-After` y se muestra cuenta regresiva; sin reintentos en bucle.
- `correlationId` visible como "Código de referencia"; nunca PII en logs ni consola.
- El saludo sale de `/auth/me`; **no se decodifica el JWT en la UI**.
- Normalización de documento igual que backend: mayúsculas, sin espacios/puntos/guiones/comas/paréntesis.
- Contraseña de login: solo 1–128 no vacía (sin reglas de complejidad), tal cual §3.2.
- Validación doble: cliente (feedback inmediato) y BFF (nunca confía en el navegador).

---

## 7. Accesibilidad y UX implementadas

- `<label>` reales, `aria-describedby` en errores, `aria-invalid`, `role="alert"`, `role="status"`.
- Radiogroup de documento con tarjetas y foco visible (`ring-secondary`).
- Botón mostrar/ocultar con `aria-pressed` y `aria-label` dinámico.
- Objetivos táctiles ≥ 44–50 px, móvil primero.
- Estados: spinner con `aria-busy`, botón deshabilitado durante envío, textos claros en español.
- Placeholders deshabilitados con `title="Disponible próximamente"` (no hay enlaces muertos).
- No se depende solo del color: los errores llevan texto e icono.

---

## 8. Cómo ejecutar y ver

```bash
bun install
bun run dev        # http://localhost:3000/iniciar-sesion
bun run test       # vitest run
bun run lint
bun run build
```

- `.env` local (ignorado por git) debe tener:
  - `NUXT_APP_SECRET` (≥32 caracteres; `openssl rand -base64 32`). **En esta versión de `nuxt-auth-utils` ya no se usa `NUXT_SESSION_PASSWORD`.**
  - `NUXT_PUBLIC_API_AUTH_BASE=http://localhost:8001`.
- `.env.example` ya fue actualizado con `NUXT_APP_SECRET`.
- Sin el microservicio levantado la UI se ve completa, pero un login válido mostrará error de conexión.

---

## 9. Deuda técnica y limitaciones conocidas

1. **`nuxt-auth-utils` sin integrar.** No hay endpoint que escriba la sesión. Plan: guardar solo perfil público (`userId`, `firstName`, `email`), nunca el access token. Integrar junto con logout/refresh del BFF.
2. **Logout solo local.** `logOut()` limpia el estado, pero no llama `POST /auth/logout` (§3.4). Falta pantalla "Saliste de tu cuenta" y limpiar cookie en backend.
3. **Aviso de reúso de refresh.** El contrato no expone un código que distinga "familia revocada por reúso" de un 401 normal; hoy se muestra "Tu sesión terminó. Vuelve a entrar." No inventar detección.
4. **Sin redirección post-login.** Cuando exista la vista destino, redirigir allí.
5. **Enlaces deshabilitados:** crear cuenta, recuperar contraseña, política de datos, términos y chat.
6. **Sin i18n en los textos.** Están en español directo; `@nuxtjs/i18n` está instalado pero no se usó para no sobreingenierizar.
7. **Sin pruebas E2E** contra el microservicio real. Los tests son unitarios/integración con `$fetch` mockeado.
8. **`@pinia/colada` instalado sin uso.** No se necesita para login.
9. **La página no tiene middleware de ruta** porque aún no hay rutas protegidas.
10. **`vitest.config.ts` desactiva la resolución estática de assets en `<img>`** solo para tests; en producción Nuxt sirve `/public` normal.

---

## 10. Siguientes funcionalidades propuestas (en orden)

1. **Logout remoto (§3.4)** — `POST /api/auth/logout` en BFF reenviando cookie, limpiar sesión local siempre (idempotente) y pantalla "Saliste de tu cuenta". Cierra el ciclo de sesión.
2. **Forgot / reset (§3.5–§3.6)** — reemplazar el enlace deshabilitado; mensaje anti-enumeración idéntico exista o no la cuenta; token de reset en **body** (nunca URL al llamar la API); `PASSWORD_RESET_INVALID` con botón "pedir nuevo enlace"; respetar enfriamiento 60 s.
3. **Registro (§3.1)** — flujo guiado, casilla Ley 1581 obligatoria, `maskedEmail` tal cual llega.
4. **Cambio de contraseña (§3.8)** — confirmación solo en frontend, checklist 8 caracteres/no común/sin nombre ni correo, `currentPassword`.
5. **Cambio de correo (§3.9)** — manejar `changed: true/false` y 409 genérico.
6. **Sesión BFF con `nuxt-auth-utils`** — solo perfil público; integrar cuando exista un endpoint que la escriba.
7. **Redirección al portal autenticado** — cuando el compañero entregue la vista.
8. **E2E + auditoría de accesibilidad** — Playwright y revisión WCAG 2.2 AA.

---

## 11. Instrucciones para el próximo agente

1. **Lee primero:** `docs/auth-service.md`, `colores-base.md`, `docs/login/`, y este documento.
2. **No inventes** endpoints, campos, códigos de error ni reglas. Si falta algo, pregunta.
3. **Respeta la arquitectura:** un archivo = una responsabilidad; UI / validación / API / estado separados.
4. **No muevas el access token** a `localStorage` ni a la sesión de `nuxt-auth-utils`. El refresh sigue solo en cookie httpOnly.
5. **Mantén el BFF** como única puerta al microservicio; el navegador habla solo con `/api/auth/*`.
6. **Cada cambio con tests** y mensajes de error por campo cuando aplique.
7. **Trabaja en pasos pequeños**, resume y espera aprobación del usuario.
8. **Avisa antes de tocar código compartido** (`app/components`, `app/layouts`, `server/utils`, configuración raíz).
9. **Rutas de páginas siempre en español** (kebab-case, sin tildes). No crear `/login`, `/register` ni similares. Las rutas BFF `/api/auth/*` se mantienen en inglés por contrato.
10. **Antes de continuar:** detén el dev server si está corriendo y ejecuta `bun run build` para confirmar que la ruta de refresh compila en producción; luego vuelve a levantarlo.
11. **No hay commits creados** por este trabajo: revisa `git status` y decide con el usuario qué incluir.

### Comandos de verificación rápida

```bash
bunx vitest run
bunx eslint app/ server/ vitest.config.ts
bun run build
```

---

## 12. Mapa rápido de archivos creados/modificados

**Creados**
- `app/features/auth/{types,schemas,api,store,rememberDocument}.ts` + tests
- `app/features/auth/components/{DocumentTypeSelector,DocumentNumberField,PasswordField,AuthAlert,LoginForm}.vue` + tests
- `app/layouts/auth.vue` + `app/layouts/auth.test.ts`
- `app/pages/iniciar-sesion.vue`
- `server/utils/auth.ts` + `server/utils/auth.test.ts`
- `server/api/auth/{login.post,me.get,refresh.post}.ts`
- `vitest.config.ts`
- `.env` (local, ignorado por git)

**Modificados**
- `app/assets/css/main.css` (tema, fuentes, base)
- `package.json` (dependencias + script `test`)
- `.env.example` (`NUXT_APP_SECRET`)
- `bun.lock` (dependencias)

**Sin tocar (a propósito)**
- `app/pages/index.vue`, features `appointments`, `home`, `profile`
- `shared/`, `server/api/citas`, `server/api/profile`
