export const GYM_TIME_ZONE = "America/El_Salvador";
export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const MEMBER_CLASSES_RANGE_DAYS = 7;

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: GYM_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: GYM_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const dayHeadingFormatter = new Intl.DateTimeFormat("es-SV", {
  timeZone: GYM_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

const shortDateFormatter = new Intl.DateTimeFormat("es-SV", {
  timeZone: GYM_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function toValidDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Devuelve la clave calendario `YYYY-MM-DD` en la zona horaria del gimnasio (`America/El_Salvador`).
 */
export function getGymDateKey(value: string | Date): string {
  const date = toValidDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return dateKeyFormatter.format(date);
}

/**
 * Devuelve la hora `HH:mm` en `America/El_Salvador`.
 */
export function formatGymTime(value: string | Date): string {
  const date = toValidDate(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return timeFormatter.format(date);
}

/**
 * Formatea una fecha `YYYY-MM-DD` (p. ej. "2026-11-23") sin desfase por UTC.
 */
export function formatGymDayHeading(dateKey: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return dateKey;
  const noonInGym = new Date(`${dateKey}T12:00:00-06:00`);
  if (Number.isNaN(noonInGym.getTime())) return dateKey;
  const formatted = dayHeadingFormatter.format(noonInGym);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Formatea una fecha/hora ISO en formato corto DD/MM/YYYY en `America/El_Salvador`.
 */
export function formatGymShortDate(value: string | Date): string {
  const date = toValidDate(value);
  if (Number.isNaN(date.getTime())) return "Fecha inválida";
  return shortDateFormatter.format(date);
}

/**
 * Formatea un rango horario `HH:mm - HH:mm` en `America/El_Salvador`.
 */
export function formatGymTimeRange(startsAt: string | Date, endsAt: string | Date): string {
  return `${formatGymTime(startsAt)} - ${formatGymTime(endsAt)}`;
}

/**
 * Construye el intervalo exacto de 7 días para la consulta MEMBER de `GET /api/v1/classes`.
 * Nunca excede `7 * 24h` para evitar el error 400 del backend.
 */
export function buildMemberClassesRange(now: Date = new Date()): { from: Date; to: Date } {
  const from = new Date(now.getTime());
  const to = new Date(from.getTime() + MEMBER_CLASSES_RANGE_DAYS * MS_PER_DAY);
  return { from, to };
}
