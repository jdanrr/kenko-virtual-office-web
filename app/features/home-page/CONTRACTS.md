# Contratos de datos para la home-page de Kenko

Documento de coordinación entre features. `home-page` **nunca** llama
endpoints ni importa archivos internos de otras features: solo consume
la API pública de cada barrel (`features/<feature>/index.ts`).

Decisiones registradas:

- Autorizaciones → dueño: **profile** (opción B).
- Sede (dirección, horario, teléfono): dato **estático en `home-page`**.
- Ruta `/login` y sesión: dueños **auth**.

## Convenciones comunes

- Fechas como `string` ISO 8601 con zona horaria
  (p. ej. `2026-03-15T10:00:00-05:00`). El formateo para mostrar
  ("15 Mar 2026 - 10:00 AM") lo hace `home-page` en `app/utils/format.ts`.
- IDs como `string`. Textos visibles en español.
- Datos remotos con TanStack Query (ver `core/query/client.ts`).
- Cada feature expone tipos + composables **solo** por su `index.ts`.

## 1. Auth — `features/auth/`

```ts
// types.ts
export interface SessionPatient {
  id: string;
  firstName: string; // "Tatiana"
  lastName: string; // "Rivero"
  shortName: string; // "Tatiana R."
  documentMasked: string; // "CC 1.020.485.***" (nunca el documento completo)
  initials: string; // "TR"
}
```

Barrel `index.ts`: `export * from './types'` + `export * from './store'`
+ composable `usePatientSession()` →
`{ patient: SessionPatient | null, isPending, error }`.

Pendiente de auth: la home asume sesión activa; su middleware redirige
a `/login` (ruta de ellos) si no hay sesión. Confirmar qué muestra el
encabezado sin sesión.

## 2. Appointments — `features/appointments/` (contrato real del backend)

Base: `http://3.224.127.142:8002/api/v1` (AWS dev, `NUXT_PUBLIC_API_APPOINTMENTS_BASE`).
Auth: `Authorization: Bearer` (mismo JWT); **sin cookies y sin sobre
`{ data }`** (respuestas crudas en camelCase). Errores
`{ error: { code, message, correlationId } }` en minúsculas (`unauthorized`,
`forbidden`, `not_found`, `conflict`, `validation_error`,
`business_rule_violation`, `service_unavailable`).

```ts
// types.ts (fiel al backend)
export type AppointmentType = "GENERAL" | "ODONTOLOGIA" | "PSICOLOGIA";
export interface AppointmentResponse {
  appointmentId: string;
  type: AppointmentType;
  date: string; // YYYY-MM-DD
  weekday: string; // "JUEVES"
  startTime: string; // "08:00:00"
  endTime: string;
  physician: { physicianId: string; name: string };
  medicalCenter: { medicalCenterId: string; name: string; location: string };
}
```

Barrel (`index.ts`): tipos + API (`listMyAppointments`,
`listAvailableAppointments`, `schedule/cancel/rescheduleAppointment`,
`listPhysicians`, `listMedicalCenters`) + `useMyAppointmentsQuery`
(TanStack Query). Sin Colada: se usa TanStack Query según decisión de equipo.

Mapeo a la tarjeta (home-page `mapping.ts`, confirmado con el backend):
toda cita de `/me` está agendada → `confirmada` y `presencial` (siempre hay
sede); sin `modalidad` ni `estado` en el backend. `403` = usuario aún no
sincronizado (worker `ProfileCreated`) → mensaje específico, no genérico.
Botones reagendar/cancelar/agendar: pendientes de flujos con pantallas.

## 3. Profile — `features/profile/` (contrato real del backend Go)

Base: `http://44.203.90.183:8080` (`NUXT_PUBLIC_API_PROFILE_BASE`), sin prefijo.
IP efímera (2026-11-18): pedir la nueva al equipo backend si deja de responder.
Auth: `Authorization: Bearer` (mismo JWT); **sin cookies y sin sobre
`{ data }`** (respuestas crudas). Errores simples `{"error": "texto"}`
(`401 unauthorized`, `404`, `502`, `500`).

```ts
// types.ts (fiel al backend)
export interface CertificateGenerated {
  certificateId: string; // UUID
  issuedAt: string; // RFC3339
  affiliationStartDate: string; // RFC3339
}
export interface MedicalHistoryGenerated {
  pdfId: string;
  generatedAt: string; // RFC3339
  recordCount: number; // citas incluidas
}
export interface AuthorizationResponse {
  authorizationId: string; // UUID
  type: "BLOOD_TEST" | "XRAY" | "DENTAL_CLEANING";
  typeLabel: string; // "Examen de sangre" (lista para mostrar)
  status: "IN_PROGRESS" | "REJECTED" | "APPROVED";
  statusLabel: string; // "En proceso" (lista para mostrar)
  rejectionReason?: string; // solo REJECTED
  rejectionReasonLabel?: string;
  createdAt: string; // RFC3339
  appointment: {
    appointmentId: string;
    date: string; // YYYY-MM-DD
    appointmentType: string; // "MEDICINA_GENERAL", ...
    physicianName: string;
  };
}
```

Barrel (`index.ts`): tipos + API (`generateCertificate`,
`generateMedicalHistory`, `listAuthorizations`, `downloadAuthorizationPdf`,
`notifyAuthorization`) + queries (`useAuthorizationsQuery`,
`useGenerateCertificateMutation`, `useGenerateHistoryMutation`).

Mapeo a las tarjetas (home-page `mapping.ts`, confirmado con el backend):
certificado e historial se **generan bajo demanda** con POST (el backend
devuelve metadatos, no hay PDF para descargar; el evento publicado dispara
el correo al email registrado, sin endpoint aparte). `404` = aún sin
generar → mensaje que invita a usar el botón. Autorizaciones: lista con `GET`,
etiquetas del backend tal cual, `shortId` = 8 primeros del UUID,
`description` = tipo de cita + fecha asociada; sin vigencia/tiempos/acción
sugerida (no existen en el backend). PDF por tarjeta con `GET .../:id/pdf`
(blob + descarga); `notify` existe pero sin botón en el diseño (TODO).

## Garantías de `home-page`

- Imports solo desde barrels (`~/features/appointments`,
  `~/features/profile`, `~/features/auth`).
- Mapeo especialidad → icono y formateo de fechas, locales a `home-page`.
- Datos institucionales de sede, estáticos en `home-page`.
