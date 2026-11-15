// Datos de ejemplo para la maqueta (mismo contenido del diseño original).
// TODO: sustituir por las queries de los barrels (appointments, profile,
// auth) cuando existan; estos mocks se eliminan en ese momento.
import type {
  AffiliationCertificateView,
  AppointmentView,
  AppointmentsSummaryView,
  AuthorizationView,
  MedicalHistorySummaryView,
  SessionPatientView,
} from "../types";

export const dashboardPatientMock: SessionPatientView = {
  id: "patient-tatiana-rivero",
  firstName: "Tatiana",
  lastName: "Rivero",
  shortName: "Tatiana R.",
  documentMasked: "CC 1.020.485.***",
  initials: "TR",
};

const nextAppointmentMock: AppointmentView = {
  id: "appt-odonto-001",
  title: "Odontología General - Control",
  specialty: "Odontología",
  modality: "presencial",
  status: "confirmada",
  dateISO: "2026-03-15T10:00:00-05:00",
  dateLabel: "Mañana, 15 Mar 2026 - 10:00 AM",
  doctorName: "Dr. Andrés Silva",
  site: "Sede Chicó",
};

const otherAppointmentsMock: AppointmentView[] = [
  {
    id: "appt-psico-001",
    title: "Psicología y Bienestar",
    specialty: "Psicología",
    modality: "teleconsulta",
    status: "pendiente",
    dateISO: "2026-03-26T15:00:00-05:00",
    dateLabel: "Jueves, 26 Mar 2026 - 3:00 PM",
    doctorName: "Dra. Mariana Gómez",
    site: "Enlace virtual",
  },
];

export const appointmentsSummaryMock: AppointmentsSummaryView = {
  next: nextAppointmentMock,
  others: otherAppointmentsMock,
  pendingCount: otherAppointmentsMock.length,
};

export const affiliationCertificateMock: AffiliationCertificateView = {
  id: "CERT-2026-88412",
  issuedISO: "2026-03-15",
  issuedLabel: "15/03/2026",
  memberSinceISO: "2021-02-01",
  memberSinceLabel: "01/02/2021",
};

export const medicalHistoryMock: MedicalHistorySummaryView = {
  recordCount: 3,
  recordsLabel: "3 registros",
  updatedISO: "2026-03-14",
  updatedLabel: "14/03/2026",
};

export const authorizationsMock: AuthorizationView[] = [
  {
    id: "AUT-92841",
    code: "BLOOD_TEST",
    title: "Examen de sangre",
    description: "Cuadro hemático, perfil lipídico y glicemia",
    status: "aprobada",
    dateISO: "2026-03-12",
    dateLabel: "12 Mar 2026",
    doctorName: "Dra. Valentina Restrepo (Medicina General)",
    validityUntilLabel: "12 May 2026",
  },
  {
    id: "AUT-93104",
    code: "XRAY",
    title: "Radiografía de Tórax",
    description: "Proyección PA y lateral estándar",
    status: "en-proceso",
    dateISO: "2026-03-14",
    dateLabel: "14 Mar 2026",
    doctorName: "Dr. Carlos Mendoza (Neumología)",
    estimatedTime: "24 a 48 horas hábiles",
  },
  {
    id: "AUT-91520",
    code: "DENTAL_CLEANING",
    title: "Limpieza dental",
    status: "rechazada",
    dateISO: "2026-03-08",
    dateLabel: "08 Mar 2026",
    doctorName: "Dr. Andrés Silva (Odontología)",
    rejectionReason: "Falta de documentación",
    rejectionCode: "MISSING_DOCUMENTATION",
    suggestedAction: "Adjuntar historia clínica previa",
  },
];
