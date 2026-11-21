import { formatUsdPrice, getGymDateKey } from "@/src/lib/gym-datetime";
import {
  INCOME_CONCEPT_LABELS,
  type IncomeBreakdown,
  type IncomeConcept,
} from "@/src/types/reports";

// Mismas reglas y mensajes que el backend (src/reports/services/report-range.ts):
// la pantalla avisa antes de consultar y el servidor vuelve a validar.
export const MAX_RANGE_MONTHS = 12;
export const DATES_REQUIRED_MESSAGE = "Elige la fecha de inicio y la de fin.";
export const REPORT_DATE_FORMAT_MESSAGE = "Las fechas deben tener el formato AAAA-MM-DD.";
export const RANGE_ORDER_MESSAGE = "La fecha de inicio no puede ser posterior a la de fin.";
export const RANGE_TOO_LONG_MESSAGE = "El rango no puede ser mayor a 12 meses.";
export const NO_PAYMENTS_MESSAGE = "No hay pagos en ese rango.";

export const INCOME_CONCEPTS: IncomeConcept[] = ["membership", "dropIn", "personalSession"];

const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export interface DateRange {
  from: string;
  to: string;
}

export type RangePreset = "thisMonth" | "last3Months" | "thisYear";

export const RANGE_PRESET_LABELS: Record<RangePreset, string> = {
  thisMonth: "Este mes",
  last3Months: "Últimos 3 meses",
  thisYear: "Este año",
};

function parts(date: string): [number, number, number] {
  const [year, month, day] = date.split("-").map(Number);
  return [year, month, day];
}

function pad(value: number, size = 2): string {
  return String(value).padStart(size, "0");
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function isRealDate(date: string): boolean {
  if (!DATE_PATTERN.test(date)) return false;
  const [year, month, day] = parts(date);
  return day <= daysInMonth(year, month);
}

/** Suma meses; si el día no existe en el mes destino usa el último día. */
export function addMonths(date: string, months: number): string {
  const [year, month, day] = parts(date);
  const index = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(index / 12);
  const targetMonth = (index % 12) + 1;
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));
  return `${pad(targetYear, 4)}-${pad(targetMonth)}-${pad(targetDay)}`;
}

/** Primer día del mes `offset` meses antes del de `today` (YYYY-MM-DD). */
function firstDayMonthsAgo(today: string, offset: number): string {
  const [year, month] = parts(today);
  return addMonths(`${pad(year, 4)}-${pad(month)}-01`, -offset);
}

/** Rango de un atajo, calculado con la fecha de hoy en El Salvador. */
export function presetRange(preset: RangePreset, now: Date = new Date()): DateRange {
  const today = getGymDateKey(now);
  if (preset === "thisMonth") return { from: firstDayMonthsAgo(today, 0), to: today };
  if (preset === "last3Months") return { from: firstDayMonthsAgo(today, 2), to: today };
  return { from: `${today.slice(0, 4)}-01-01`, to: today };
}

/** Rango con el que abre la pantalla: los últimos 3 meses. */
export function defaultRange(now: Date = new Date()): DateRange {
  return presetRange("last3Months", now);
}

/** Motivo por el que el rango no sirve, o null si está bien. */
export function validateRange({ from, to }: DateRange): string | null {
  if (!from || !to) return DATES_REQUIRED_MESSAGE;
  for (const date of [from, to]) {
    if (!DATE_PATTERN.test(date)) return REPORT_DATE_FORMAT_MESSAGE;
    if (!isRealDate(date)) return `La fecha ${date} no existe.`;
  }
  if (from > to) return RANGE_ORDER_MESSAGE;
  if (to >= addMonths(from, MAX_RANGE_MONTHS)) return RANGE_TOO_LONG_MESSAGE;
  return null;
}

/** "2026-09" → "Septiembre 2026". */
export function monthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const name = MONTH_NAMES[monthNumber - 1] ?? month;
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

/** "2026-09-01" → "01/09/2026", sin pasar por Date para no cambiar de día. */
export function formatReportDate(date: string): string {
  const [year, month, day] = parts(date);
  return `${pad(day)}/${pad(month)}/${pad(year, 4)}`;
}

/** "Del 01/09/2026 al 30/11/2026". */
export function rangeText({ from, to }: DateRange): string {
  return `Del ${formatReportDate(from)} al ${formatReportDate(to)}`;
}

export function formatAmount(amount: number): string {
  return formatUsdPrice(amount);
}

export function receiptCountText(count: number): string {
  return count === 1 ? "1 comprobante" : `${count} comprobantes`;
}

export interface ConceptShare {
  concept: IncomeConcept;
  label: string;
  amount: number;
  /** Porcentaje del total, entero de 0 a 100. */
  percent: number;
}

/** Cada concepto con su monto y su parte del total. */
export function conceptShares(totals: IncomeBreakdown): ConceptShare[] {
  return INCOME_CONCEPTS.map((concept) => ({
    concept,
    label: INCOME_CONCEPT_LABELS[concept],
    amount: totals[concept],
    percent: totals.total > 0 ? Math.round((totals[concept] / totals.total) * 100) : 0,
  }));
}

/** Ancho de la barra de un mes respecto al mes más alto, de 0 a 100. */
export function barPercent(total: number, maxTotal: number): number {
  if (maxTotal <= 0 || total <= 0) return 0;
  return Math.max(2, Math.round((total / maxTotal) * 100));
}
