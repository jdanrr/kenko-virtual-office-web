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
- Datos remotos con Pinia Colada (`useQuery` / `useMutation`).
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

## 2. Appointments — `features/appointments/`

```ts
// types.ts
export type AppointmentModality = 'presencial' | 'teleconsulta';
export type AppointmentStatus = 'confirmada' | 'pendiente';

export interface Appointment {
  id: string;
  title: string; // "Odontología General - Control"
  specialty: string; // "Odontología" (home-page mapea el icono)
  modality: AppointmentModality;
  status: AppointmentStatus;
  dateISO: string;
  doctorName: string; // "Dr. Andrés Silva"
  site: string; // "Sede Chicó" | "Enlace virtual"
}

export interface AppointmentsSummary {
  next: Appointment | null;
  others: Appointment[];
  pendingCount: number;
}
```

Barrel: tipos + `useAppointmentsSummaryQuery()` (Colada, retorna el
summary) + mutations `useRescheduleAppointment()` /
`useCancelAppointment()` con firma `(id: string) => Promise<void>`.

## 3. Profile — `features/profile/` (incluye certificados y autorizaciones)

```ts
// types.ts
export interface AffiliationCertificate {
  id: string; // "CERT-2026-88412"
  issuedISO: string; // "2026-03-15"
  memberSinceISO: string; // "2021-02-01"
}

export interface MedicalHistorySummary {
  recordCount: number; // 3
  updatedISO: string; // "2026-03-14"
}

export type AuthorizationStatus = 'aprobada' | 'en-proceso' | 'rechazada';
export type AuthorizationFilter = AuthorizationStatus | 'todas';

export interface Authorization {
  id: string; // "AUT-92841"
  code: string; // "BLOOD_TEST" | "XRAY" | "DENTAL_CLEANING"
  title: string;
  description: string;
  status: AuthorizationStatus;
  dateISO: string;
  doctorName: string;
  validityUntilISO?: string; // solo aprobada
  estimatedTime?: string; // solo en-proceso ("24 a 48 horas hábiles")
  rejectionReason?: string; // solo rechazada
  rejectionCode?: string; // "MISSING_DOCUMENTATION"
  suggestedAction?: string; // "Adjuntar historia clínica previa"
}
```

Barrel: tipos + `useCertificatesQuery()` +
`useDownloadCertificatePdf(id)` / `useDownloadMedicalHistoryPdf()` +
`useAuthorizationsQuery(filter)` + `useDownloadAuthorizationPdf(id)`.
Cada helper de descarga retorna `{ download, isPending, error }`.
Cómo se obtiene el PDF (URL firmada, blob, `Content-Disposition`) es
interno de profile. Los endpoints y las bases de `NUXT_PUBLIC_API_*`
los cablea cada feature; `home-page` no los usa.

## Garantías de `home-page`

- Imports solo desde barrels (`~/features/appointments`,
  `~/features/profile`, `~/features/auth`).
- Mapeo especialidad → icono y formateo de fechas, locales a `home-page`.
- Datos institucionales de sede, estáticos en `home-page`.
