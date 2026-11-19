import { describe, expect, it } from "vitest";

import { ApiError } from "../../core/api/apiError";
import type { AppointmentResponse } from "../appointments/types";
import type { AuthorizationResponse } from "../profile/types";
import {
  toAppointmentsErrorMessage,
  toAppointmentsSummary,
  toAuthorizationViews,
  toCertificateView,
  toHistoryView,
  toProfileErrorMessage,
} from "./mapping";

/** Pruebas del mapeo backend → tarjeta (sin red). */

const base: AppointmentResponse = {
  appointmentId: "a1",
  type: "ODONTOLOGIA",
  date: "2031-05-04",
  weekday: "LUNES",
  startTime: "08:00:00",
  endTime: "08:30:00",
  physician: { physicianId: "p1", name: "Nombre Apellido" },
  medicalCenter: { medicalCenterId: "m1", name: "Kenko Norte", location: "Bogotá" },
};

const later: AppointmentResponse = {
  ...base,
  appointmentId: "a2",
  type: "GENERAL",
  date: "2031-05-06",
  weekday: "MIERCOLES",
  startTime: "15:00:00",
  endTime: "15:30:00",
};

describe("toAppointmentsSummary", () => {
  it("ordena por fecha: la más próxima es next", () => {
    const summary = toAppointmentsSummary([later, base]);
    expect(summary.next?.id).toBe("a1");
    expect(summary.next?.title).toBe("Odontología");
    expect(summary.next?.specialty).toBe("Odontología");
    expect(summary.next?.status).toBe("confirmada");
    expect(summary.next?.modality).toBe("presencial");
    expect(summary.next?.site).toBe("Kenko Norte");
    expect(summary.next?.doctorName).toBe("Nombre Apellido");
    expect(summary.next?.dateLabel).toBe("Lunes, 4 May 2031 - 8:00 AM");
    expect(summary.others.map((o) => o.id)).toEqual(["a2"]);
    expect(summary.others[0]?.title).toBe("Medicina General");
    expect(summary.pendingCount).toBe(1);
  });

  it("lista vacía deja next nulo y contador en cero", () => {
    expect(toAppointmentsSummary([])).toEqual({ next: null, others: [], pendingCount: 0 });
  });
});

describe("toAppointmentsErrorMessage", () => {
  it("sin error devuelve null", () => {
    expect(toAppointmentsErrorMessage(null)).toBeNull();
    expect(toAppointmentsErrorMessage(undefined)).toBeNull();
  });

  it("403 explica que las citas aún no están disponibles", () => {
    const message = toAppointmentsErrorMessage(
      new ApiError({ status: 403, code: "forbidden", message: "x" }),
    );
    expect(message).toContain("aún no están disponibles");
  });

  it("otros errores pasan el mensaje del servidor", () => {
    expect(
      toAppointmentsErrorMessage(
        new ApiError({ status: 503, code: "service_unavailable", message: "caído" }),
      ),
    ).toBe("caído");
  });

  it("error desconocido devuelve genérico en español", () => {
    expect(toAppointmentsErrorMessage(new Error("raro"))).toContain("Tuvimos un problema");
  });
});

const authz: AuthorizationResponse = {
  authorizationId: "9f6c9f73-9200-4e60-a1b6-9c126f6c4819",
  type: "BLOOD_TEST",
  typeLabel: "Examen de sangre",
  status: "APPROVED",
  statusLabel: "Aprobada",
  createdAt: "2026-03-12T10:00:00Z",
  appointment: {
    appointmentId: "x1",
    date: "2026-05-10",
    appointmentType: "MEDICINA_GENERAL",
    physicianName: "Nombre Apellido",
  },
};

describe("toAuthorizationViews", () => {
  it("mapea etiquetas del backend y deriva shortId y descripción", () => {
    const [view] = toAuthorizationViews([authz]);
    expect(view?.id).toBe("9f6c9f73-9200-4e60-a1b6-9c126f6c4819");
    expect(view?.shortId).toBe("9F6C9F73");
    expect(view?.code).toBe("Examen de sangre");
    expect(view?.title).toBe("Examen de sangre");
    expect(view?.status).toBe("aprobada");
    expect(view?.dateLabel).toBe("12 Mar 2026");
    expect(view?.doctorName).toBe("Nombre Apellido");
    expect(view?.description).toBe("Medicina general • 10 May 2026");
    expect(view?.rejectionReason).toBeUndefined();
  });

  it("rechazada conserva motivo y código del backend", () => {
    const [view] = toAuthorizationViews([
      {
        ...authz,
        status: "REJECTED",
        statusLabel: "Rechazada",
        rejectionReason: "MISSING_DOCUMENTATION",
        rejectionReasonLabel: "Falta de documentación",
      },
    ]);
    expect(view?.status).toBe("rechazada");
    expect(view?.rejectionReason).toBe("Falta de documentación");
    expect(view?.rejectionCode).toBe("MISSING_DOCUMENTATION");
  });
});

describe("toCertificateView y toHistoryView", () => {
  it("formatea fechas RFC3339 a etiquetas cortas", () => {
    expect(
      toCertificateView({
        certificateId: "abcdef12-0000-0000-0000-000000000000",
        issuedAt: "2026-03-15T10:00:00Z",
        affiliationStartDate: "2021-02-01T00:00:00Z",
      }),
    ).toEqual({
      id: "ABCDEF12",
      issuedISO: "2026-03-15T10:00:00Z",
      issuedLabel: "15 Mar 2026",
      memberSinceISO: "2021-02-01T00:00:00Z",
      // 1.º de febrero 00:00 UTC = 31 de enero 7pm en Bogotá.
      memberSinceLabel: "31 Ene 2021",
    });
    expect(
      toHistoryView({ pdfId: "p1", generatedAt: "2026-03-14T10:00:00Z", recordCount: 3 }),
    ).toEqual({
      recordCount: 3,
      recordsLabel: "3 registros",
      updatedISO: "2026-03-14T10:00:00Z",
      updatedLabel: "14 Mar 2026",
    });
  });
});

describe("toProfileErrorMessage", () => {
  it("404 sugiere generar los documentos", () => {
    expect(
      toProfileErrorMessage(new ApiError({ status: 404, code: "NOT_FOUND", message: "x" })),
    ).toContain("Aún no tienes documentos");
  });

  it("sin error devuelve null y otros pasan el mensaje", () => {
    expect(toProfileErrorMessage(null)).toBeNull();
    expect(
      toProfileErrorMessage(new ApiError({ status: 500, code: "x", message: "caído" })),
    ).toBe("caído");
  });
});
