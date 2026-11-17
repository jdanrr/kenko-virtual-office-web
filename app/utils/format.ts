// Formato de fechas y horas para mostrar (español, zona Bogotá).
// El backend entrega `date: YYYY-MM-DD`, `startTime: HH:MM:SS` y
// `weekday` en mayúsculas; aquí se componen como "Mañana, 15 Mar 2026 - 10:00 AM".

const MONTHS_SHORT_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

/** Hoy en Bogotá como `YYYY-MM-DD` (compara fechas calendario, sin horas). */
function todayBogota(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function capitalize(word: string): string {
  const lower = word.toLocaleLowerCase("es-CO");
  return lower.charAt(0).toLocaleUpperCase("es-CO") + lower.slice(1);
}

/**
 * `"2026-11-20"` → `"20 Nov 2026"`.
 * Si trae hora (`"2026-11-17T01:00:00Z"`), se interpreta en hora de Bogotá:
 * un documento generado el 16 a las 8pm (COT) es 17 en UTC, pero aquí fue 16.
 */
export function formatShortDate(iso: string): string {
  let year: number;
  let month: number;
  let day: number;
  if (iso.includes("T")) {
    const instant = new Date(iso);
    if (Number.isNaN(instant.getTime())) return iso;
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(instant);
    [year, month, day] = parts.split("-").map(Number);
  } else {
    [year, month, day] = iso.split("-").map(Number);
  }
  if (!year || !month || !day) return iso;
  return `${day} ${MONTHS_SHORT_ES[month - 1]} ${year}`;
}

/** `"2026-11-20" + "08:00:00" + "JUEVES"` → `"Jueves, 20 Nov 2026 - 8:00 AM"`. */
export function formatAppointmentDateTime(
  date: string,
  startTime: string,
  weekday: string,
): string {
  const today = todayBogota();
  const prefix =
    date === today ? "Hoy" : date === addDays(today, 1) ? "Mañana" : capitalize(weekday);
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = startTime.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const mm = String(minutes).padStart(2, "0");
  return `${prefix}, ${day} ${MONTHS_SHORT_ES[month - 1]} ${year} - ${hour12}:${mm} ${period}`;
}
