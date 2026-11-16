# Verificación frontend ↔ Microservicio Authentication (Kenko EPS)

Fuente de verdad: `docs/auth-service.md` (263 líneas, leído completo).
El `docs/openapi.yaml` que cita no existe en el repo (búsqueda `**/openapi*`
sin resultados). Si este documento contradice el resumen de trabajo,
prevalece `docs/auth-service.md`. Lo no documentado se marca como tal,
sin inventar.

## 1. Respuestas a los puntos faltantes

| Punto | Respuesta según el documento | Dónde lo dice | ¿Falta o es ambiguo? |
|---|---|---|---|
| 1. `POST /auth/register` | 13 campos, todos obligatorios: `firstName` (trim, 1–100, ≥1 letra Unicode), `lastName` (igual), `birthDate` (ISO `YYYY-MM-DD`, ≤ hoy UTC, ≤120 años), `gender` (`male\|female\|other`), `email` (trim+minúsculas, formato, máx 254), `phone` (normaliza a E.164, final `^\+[1-9]\d{7,14}$`), `addressLine` (1–200), `city` (1–100), `documentType` (`CC\|TI\|CE\|PA`), `documentNumber` (`^[A-Z0-9]{4,20}$` normalizado), `password` (8–128, espacios cuentan, lista negra: `password`, `password123`, `12345678`, `123456789`, `qwerty123`, `colombia123`, `kenko1234`, insensible a mayúsculas), `confirmPassword` (idéntica, no se almacena). Respuesta `201 { data: { userId, maskedEmail } }` (`m***@dominio`). Errores: `400 VALIDATION_ERROR` + `details` por campo, `409 REGISTER_CONFLICT` genérico, `500` | §3.1, `docs/auth-service.md:58-80` | Completo. Ojo: la casilla Ley 1581 es requisito UI (`:38-39`), no campo del body |
| 2. `POST /auth/login` + cookie | Body: `documentType`, `documentNumber`, `password` (1–128, solo no vacía). Respuesta `200 { data: { accessToken, refreshToken, expiresIn: 900 } }` **más** cookie `kenko_refresh`. Límites: IP 10/15 min, documento 5/15 min. `401 UNAUTHORIZED "Credenciales inválidas."` único (exista o no el usuario) | §3.2, `docs/auth-service.md:82-96`; cookie httpOnly en `:25`, fijada por login/refresh/logout en `:48` | Parcialmente ambiguo: el doc confirma `httpOnly` pero **no** documenta `SameSite`, `Path`, `Secure` ni `Max-Age` de la cookie |
| 3. MFA (TOTP) | No existe en el contrato. "MFA: fuera de alcance (`src/features/mfa/` está vacía). No diseñar pantallas de MFA." | §1 punto 7, `docs/auth-service.md:40` | No hay nada que implementar; es exclusión explícita, no omisión |
| 4. Verificación de correo | `register` devuelve `maskedEmail` y la UI muestra "Te enviamos un correo de bienvenida a m***@dominio". `emailVerified: false` al registrar es **suposición** no verificada en código. No hay endpoint ni pasos de verificación documentados | §3.1 (`:75-76`); suposiciones `:11-14` | Falta: si existe verificación por enlace/código, **no documentado** |
| 5. `forgot` / `reset` / `change` / `email/change` | `forgot`: body `documentType`+`documentNumber`; siempre `200 { data: {} }` (anti-enumeración); límites IP 10/15, doc 3/15, enfriamiento 1/60 s. `reset`: body `token` (opaco, en BODY nunca URL) + `password` (misma política+lista negra) + `confirmPassword`; el token llega en el enlace como fragmento `resetUrl = <PORTAL_BASE_URL>/reset#token=<token>` (**suposición**, `:12`); el frontend lo lee del fragmento y lo envía en BODY (`:257`); éxito revoca sesiones. `change` (Bearer): `currentPassword` + `newPassword` (**el backend no pide `confirmPassword`**, la confirmación es solo frontend); la nueva ≠ actual y no puede contener email/nombre/apellido; revoca otras familias, conserva la actual. `email/change` (Bearer): `newEmail` + `currentPassword`; idempotente → `200 { changed: false }` si es igual, `{ changed: true }` + evento si cambia; correo ocupado → `409 UPDATE_CONFLICT` genérico | §3.5 `:112-122`; §3.6 `:124-136`; §3.8 `:143-156`; §3.9 `:158-171` | Casi completo. Ambiguo: `reset`/`change` se documentan como `200 {}` y `email/change` como `{ changed }` sin envoltorio `{ data }` explícito (ver punto 9). `<PORTAL_BASE_URL>` sin valor concreto |
| 6. Errores + rate limit | Catálogo (código/HTTP/cuándo): `VALIDATION_ERROR` 400 (único con `details: [{field?, message}]`), `REGISTER_CONFLICT` 409, `UPDATE_CONFLICT` 409, `PASSWORD_RESET_INVALID` 400, `UNAUTHORIZED` 401 (login/refresh/me/JWT y contraseña actual mala), `RATE_LIMITED` 429, `NOT_FOUND` 404, `PAYLOAD_TOO_LARGE` 413, `INTERNAL_ERROR` 500. Límites por endpoint: login IP 10/15 + doc 5/15; refresh/logout IP 20/15; forgot IP 10/15 + doc 3/15 + 1/60 s; reset IP 10/15; change y email/change IP 20/15 + usuario 5/10 min. Ante `429`: leer `Retry-After` (y `RateLimit-Reset`), cuenta regresiva, sin reintentos en bucle | §3.10 `:173-186`; límites en cada endpoint; `429` en §1 `:32` | Completo, con una **contradicción interna**: `:46` dice body >64 KiB → `413 VALIDATION_ERROR`, pero el catálogo dice `PAYLOAD_TOO_LARGE` |
| 7. Puerto / base URL / OpenAPI | **No documentado.** El documento no menciona ningún puerto ni base URL (solo el placeholder `<PORTAL_BASE_URL>` para el enlace de reset). El `openapi.yaml` citado no está en el repo | Suposiciones `:11-14`; `docs/` sin `openapi*` | Falta: base real y coincidencia OpenAPI **no verificables** con este documento |
| 8. CORS | **No documentado.** Ninguna sección menciona orígenes, `Access-Control-Allow-Credentials`, métodos ni cabeceras | — | Falta por completo |
| 9. `{ data }` / `{ error }` | Regla global: éxito `{ data: {...} }`, error `{ error: { code, message, correlationId, details? } }`; `details` **solo** en `VALIDATION_ERROR`; usar `code` para lógica, nunca `message`. `Cache-Control: no-store` lo pone el backend | §1 puntos 2–3 (`:21-28`); `X-Correlation-Id` en `:47` | Ambiguo en 3 casos: `reset` y `change` figuran como `200 {}` (`:134`, `:153`) y `email/change` como `{ changed }` (`:165`) sin envoltorio explícito. Todo lo demás sí usa `{ data }` |
| 10. Lo que el resumen no menciona | `GET /health` → `{ data: { status: "ok" } }` (solo monitoreo, no vista); body máximo 64 KiB; cabecera `X-Correlation-Id` (mostrar `correlationId` como "código de referencia"); `refresh` silencioso (sin pantalla; `401` → login; aviso "Cerramos tus sesiones por seguridad" si hubo revocación por reúso); `logout` idempotente, revoca **todas** las sesiones en todos los dispositivos y limpia cookie; `GET /auth/me` → `{ data: { userId, firstName, email } }`, saludo con `firstName` (no decodificar JWT); el backend **no expone lista de sesiones** (suposición `:14`); requisitos UI Colombia (CC/TI/CE/PA, E.164 sin mostrar la sigla, Ley 1581 obligatoria) y accesibilidad WCAG 2.2 AA; propuestas de pantallas A/B/C + recomendación A+B (§4–7) y checklist de aceptación (§8) | §2 `:44-52`; `:108`, `:140-141`, `:150-151`; `:33-39`; §4–8 | Informativo: nada de esto contradice el resumen, lo amplía |

## 2. Discrepancias documento ↔ resumen

- **Base `http://localhost:5500`**: no aparece en el documento. **No documentado** (solo `<PORTAL_BASE_URL>` como placeholder).
- **Lista de endpoints**: coincide (`register`, `login`, `refresh`, `logout`, `password/forgot`, `password/reset`, `password/change`, `email/change`, `GET /auth/me`). El documento añade `GET /health`, fuera del resumen.
- **Respuesta de login**: coincide (`{ data: { accessToken, refreshToken, expiresIn: 900 } }` + cookie `kenko_refresh`). Atributos de cookie: el documento solo confirma `httpOnly` (`:25`); `SameSite=Lax` y `Path=/` **no documentados**.
- **Access token "JWT HS256 de 15 min"**: los 15 min figuran como `expiresIn: 900` (`:91`) pero el propio documento lo marca **suposición no verificada** (`:12`); el algoritmo HS256 **no documentado**.
- **Refresh "opaco, 7 días, rotado, reúso revoca familia"**: 7 días es **suposición** (`:12`); "opaco" se dice del token de reset, no del refresh; rotación + revocación por reúso **sí** documentadas (`:50`, `:101-103`).
- **`POST /auth/refresh` (body prioritario o cookie; `400` sin ambos; `401` expirado/revocado/reutilizado)**: coincide (`:100-103`).
- **Errores `{ error: { code, message, correlationId, details? } }` y `429` con `Retry-After`/`RateLimit-*`**: coincide (`:21-23`, `:32`, `:183`); el documento nombra concretamente `Retry-After` y `RateLimit-Reset`.
- **`Cache-Control: no-store`**: coincide (`:28`).
- **Contradicción interna del documento** (no del resumen): body >64 KiB → `:46` dice `413 VALIDATION_ERROR`, el catálogo dice `413 PAYLOAD_TOO_LARGE`.
- **Huecos del resumen**: no menciona `changed: true/false` de `email/change`, la regla "nueva ≠ actual" (reset/change), que `change` no pide `confirmPassword`, ni la revocación de sesiones en `reset`/`change`/`logout`.

## 3. Plan de verificación de la conexión (propuesta, ejecutar manualmente)

Base usada: `http://localhost:5500` (del resumen de trabajo, **no** del documento). Usuario de prueba ficticio, sin datos reales.

**1. Preflight CORS** (el documento no lo especifica; lo esperado abajo es el criterio de trabajo, no el contrato):
```bash
curl -i -X OPTIONS http://localhost:5500/auth/refresh \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization"

curl -i -X OPTIONS http://localhost:5500/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization"
```
Esperado: `204` con `Access-Control-Allow-Origin: http://localhost:3000` y `Access-Control-Allow-Credentials: true`. Si el origen viene como `*` o falta `Credentials`, el frontend con cookies no funcionará.

**2. Login → refresh → me** (en este orden; el límite IP de login es 10/15 min, no lo gastes antes):
```bash
# Login guardando la cookie
curl -i -c kenko-cookies.txt -X POST http://localhost:5500/auth/login \
  -H "Content-Type: application/json" \
  -d '{"documentType":"CC","documentNumber":"99999999","password":"Prueba123!"}'
```
Esperado: `200 { "data": { "accessToken": "<jwt>", "refreshToken": "<opaco>", "expiresIn": 900 } }` + `Set-Cookie: kenko_refresh=...; HttpOnly`. Guarda el `accessToken` en `$ACCESS`.
```bash
# Refresh solo con la cookie (sin body)
curl -i -b kenko-cookies.txt -c kenko-cookies.txt -X POST http://localhost:5500/auth/refresh
```
Esperado: `200` con par nuevo + `Set-Cookie` rotada (valor distinto al anterior).
```bash
# Quién entró (usa el accessToken del login; sigue válido hasta sus 15 min aunque hayas rotado el refresh)
curl -i http://localhost:5500/auth/me -H "Authorization: Bearer $ACCESS"
```
Esperado: `200 { "data": { "userId": "...", "firstName": "...", "email": "..." } }`.

**3. Error y 429** (al final, porque el 429 consume tu cuota IP/documento):
```bash
# Credenciales inválidas (documento ficticio, nunca real)
curl -i -X POST http://localhost:5500/auth/login \
  -H "Content-Type: application/json" \
  -d '{"documentType":"CC","documentNumber":"00000000","password":"incorrecta"}'
```
Esperado: `401 { "error": { "code": "UNAUTHORIZED", "message": "Credenciales inválidas.", "correlationId": "<uuid>" } }` (mensaje genérico a propósito).
```bash
# Provocar 429 de forma segura: 7 intentos seguidos contra documento ficticio (límite doc 5/15 min)
for i in $(seq 1 7); do curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5500/auth/login \
  -H "Content-Type: application/json" \
  -d '{"documentType":"CC","documentNumber":"00000000","password":"incorrecta"}'; done
```
Esperado: primeros `401`, desde el 6.º `429 { "error": { "code": "RATE_LIMITED", ... } }` con cabeceras `Retry-After` y `RateLimit-Reset`. Hazlo lo último: también cuenta contra el límite IP (10/15 min) y bloquearía tus pruebas posteriores.

## 4. Conclusión

**(a) Sesión (login, refresh, me, logout): sí, implementable completa con lo documentado; (b) registro y recuperación de contraseña: sí; MFA: no (excluido explícitamente, sin endpoints); y antes de integrar falta la configuración CORS, la base URL/puerto reales y los atributos exactos de la cookie `kenko_refresh`, que hay que pedir al equipo del microservicio auth.**
