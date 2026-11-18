# Guía de trabajo — Feature Profile (referencia: Auth)

> Lee este documento completo antes de escribir código. Es la referencia
> obligatoria para el chat que implementará la feature **profile**.
> El ejemplo a seguir es la feature **auth**, ya terminada y verificada.
> Última actualización: 2026-11-18.

---

## 1. Alcance estricto

- Trabajar **solo** en la feature `profile`: `app/features/profile/`,
  `app/pages/` relacionadas, `app/components/` solo si es un componente
  nuevo de profile, y tests de esos archivos.
- **No tocar** `app/features/auth/`, `server/api/auth/`, ni features
  de otros compañeros (`appointments`, `home-page`).
- Código compartido (`app/core/`, `app/layouts/`, `app/middleware/`,
  `server/utils/`, `nuxt.config.ts`, `package.json`, CSS global) solo si
  es realmente transversal, avisando antes al usuario y en cambio mínimo.

## 2. Cómo trabajamos (obligatorio)

1. **Fuentes de verdad primero.** Leer antes de proponer nada. Si algo no
   está en las fuentes, **no inventarlo: preguntar al usuario**.
2. **Cero improvisación.** Ante duda de endpoints, campos, flujos o
   decisiones técnicas, preguntar antes de escribir código.
3. **Plan antes de código.** Presentar el plan (pasos + archivos + orden)
   y esperar aprobación. Sin plan aprobado no hay implementación.
4. **Incremental.** Un paso pequeño a la vez. Al terminar cada paso:
   resumen breve + verificación + esperar aprobación para el siguiente.
5. **Cada paso se verifica:** `vitest` del alcance, `eslint` del alcance
   y `build` cuando aplique. Nada se da por hecho sin ejecutar.
6. **Auditoría al cerrar.** Actuar como auditor: buscar errores, código
   repetido e inconsistencias. Si hay algo, corregirlo con tests en verde;
   si no hay nada, reportarlo y no tocar nada.
7. **Commits convencionales cortos en inglés** (`feat(auth): ...`,
   `fix(profile): ...`, `docs(...)`, `style(...)`, `refactor(...)`,
   `add: ...`) y push solo cuando el usuario lo pida.

## 3. Punto de partida de profile (verificado 2026-11-18)

| Archivo                                     | Estado                                                                                                                                          |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/features/profile/api.ts` (84 líneas)   | Existe: llama al microservicio **directo** vía `core/api/httpClient`, con `Authorization: Bearer` (mismo token del login), sin cookies, sin BFF |
| `app/features/profile/types.ts` (54)        | Tipos del contrato profile                                                                                                                      |
| `app/features/profile/queries.ts` (53)      | Queries TanStack Query                                                                                                                          |
| `app/features/profile/api.test.ts` (146)    | Tests del cliente                                                                                                                               |
| `app/features/profile/store.ts`             | Vacío (0 líneas)                                                                                                                                |
| `app/features/profile/components/`          | Solo `.gitkeep` (vacío)                                                                                                                         |
| `vista-perfil/` (raíz, sin seguimiento git) | Referencia de diseño: `code.html`, `screen.png`, `DESIGN.md`                                                                                    |

**Diferencias clave profile vs auth (no copiar a ciegas):**

- Profile **no usa BFF**: va directo al microservicio con `createServiceClient`
  (base URL de `getServiceBases()`, token vía `getAccessToken`).
  Auth usa BFF (`server/api/auth/*`) porque maneja cookies httpOnly.
- Consume con **TanStack Query** (`queries.ts`) + `queryKeys` en
  `app/core/query/client.ts` (reintentos: no en 4xx, 2 reintentos en red/5xx).
- Particularidades del backend profile: certificados e historial se generan
  bajo demanda por POST (devuelven metadatos, sin descarga); **solo las
  autorizaciones tienen PDF descargable** (`GET .../:id/pdf`).
- `HomePage.vue` ya consume profile (`useMyAppointmentsQuery`,
  `useAuthorizationsQuery`, `toPatientView` con TODOs abiertos: apellido,
  documento y género aún no los expone el backend).

## 4. Patrones de auth a reutilizar (guía concreta)

Estructura por archivo (un archivo = una responsabilidad; todo con su
`.test.ts` al lado):

- `types.ts` — tipos del contrato + guardia del sobre `{ data }/{ error }`.
- `schemas.ts` — validación zod **server-safe** (la importa el BFF) +
  normalizaciones + puentes `toXRequest()` que fallan en compilación si
  divergen del contrato.
- `api.ts` — cliente fino; traduce errores a `AuthFailure` **por `code`
  estable, nunca por `message`** (`validation`, `register-conflict`,
  `reset-invalid`, `session-expired`, `rate-limited`, `network`,
  `unexpected`); `correlationId` como "código de referencia", nunca PII
  en logs.
- Helpers compartidos ya existentes (reutilizar, no duplicar):
  `fieldsFromIssues()`, `failureFromUnknown()`, `useRateLimitCountdown()`,
  `normalizeDocumentNumber`, `formatPhoneDisplay`, `birthDateLimits()`.
- Componentes pequeños y tontos (props + emits) + formularios que
  integran store + alertas. Iconos como **SVG inline** (no CDNs),
  `cursor-pointer` en todo lo clicable no deshabilitado
  (`disabled:cursor-not-allowed` donde aplique).
- Accesibilidad: `<label>` reales, `aria-describedby` en errores,
  `aria-invalid`, `role="alert"`/`role="status"`, objetivos táctiles
  ≥ 44px, foco visible `ring-secondary`, móvil primero.

Convenciones globales (verdad absoluta):

- `colores-base.md` manda en colores y fuentes (Figtree títulos +
  Manrope cuerpo; solo paleta base). Los `DESIGN.md` de mockups usan
  otra tipografía: ignorarlos en eso.
- Rutas de páginas **siempre en español**, kebab-case, sin tildes
  (`/iniciar-sesion`, `/registro`, `/recuperar-contrasena`, `/mi-cuenta`).
  Excepciones documentadas: `/reset` (el backend genera ese link) y
  rutas BFF `/api/*` (son API, van en inglés por contrato).
- Rutas públicas van en `PUBLIC_PATHS` de
  `app/middleware/auth-session.global.ts` (cambio transversal: avisar).
- Placeholders deshabilitados (`disabled` + `title="Disponible
próximamente"`): nunca enlaces muertos ni `alert()`.
- Textos UI en español directo (i18n instalado pero sin usar, decisión
  vigente para no sobreingenierizar).
- `.env` local (ignorado por git): `NUXT_APP_SECRET` (≥32 chars) +
  `NUXT_PUBLIC_API_*=http://localhost:<puerto>` (auth: `5500`).

## 5. Verificación (comandos)

```bash
bunx vitest run app/features/profile/   # tests del alcance
bunx eslint app/features/profile/       # lint del alcance
bun run build                           # compilación real (atrapa imports
                                        # mal anidados que vitest no ve)
```

- Full: `bunx vitest run` (hoy: **186/186**), `bun run lint` global
  (nota: hoy falla solo en archivos ajenos de home-page/appointments;
  no tocarlos, solo reportarlo), `bun run dev` → `http://localhost:3000`.
- Probar en vivo requiere el microservicio corriendo en su puerto
  (sin backend: la UI carga pero las llamadas devuelven error de conexión).

## 6. Deuda y contexto que profile debe conocer

- El backend aún **no expone apellido, documento ni género** del usuario
  (`HomePage.toPatientView` tiene TODOs; el saludo usa `Bienvenid@`
  como neutro por decisión de equipo).
- No hay E2E (solo unitarios/integración con `$fetch`/mocks).
- `AUTH_FEATURE_HANDOFF.md` tiene el detalle completo de auth
  (contrato, decisiones, endpoints BFF, checklist de aceptación).
