import { describe, expect, it } from "vitest";

import { formatAppointmentDateTime, formatShortDate } from "./format";

/** Pruebas del formateador de citas (fechas fijas + relativos dinámicos). */

function bogotaToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

describe("formatAppointmentDateTime", () => {
  it("fecha fija usa el weekday capitalizado y hora 12h", () => {
    expect(formatAppointmentDateTime("2031-05-04", "08:00:00", "LUNES")).toBe(
      "Lunes, 4 May 2031 - 8:00 AM",
    );
    expect(formatAppointmentDateTime("2031-05-04", "00:30:00", "LUNES")).toBe(
      "Lunes, 4 May 2031 - 12:30 AM",
    );
    expect(formatAppointmentDateTime("2031-05-04", "12:00:00", "LUNES")).toBe(
      "Lunes, 4 May 2031 - 12:00 PM",
    );
    expect(formatAppointmentDateTime("2031-05-04", "15:05:00", "LUNES")).toBe(
      "Lunes, 4 May 2031 - 3:05 PM",
    );
  });

  it("hoy y mañana usan etiqueta relativa", () => {
    const today = bogotaToday();
    expect(formatAppointmentDateTime(today, "10:00:00", "X")).toMatch(/^Hoy, /);
    expect(formatAppointmentDateTime(addDays(today, 1), "10:00:00", "X")).toMatch(
      /^Mañana, /,
    );
  });

  it("formatShortDate acepta fecha y RFC3339", () => {
    expect(formatShortDate("2026-03-15")).toBe("15 Mar 2026");
    expect(formatShortDate("2026-03-15T10:00:00Z")).toBe("15 Mar 2026");
    expect(formatShortDate("no-fecha")).toBe("no-fecha");
  });
});
