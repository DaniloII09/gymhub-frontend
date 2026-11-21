import { getGymDateKey } from "@/src/lib/gym-datetime";
import { formatEndDate } from "@/src/types/membership";
import {
  PROGRESS_MEASURE_MAX,
  PROGRESS_MEASURE_MIN,
  PROGRESS_WEIGHT_MAX,
  PROGRESS_WEIGHT_MIN,
  type CreateProgressEntryInput,
  type ProgressDeltas,
  type ProgressEntry,
  type ProgressEvolution,
} from "@/src/types/progress";

export const PROGRESS_DATE_REQUIRED_MESSAGE = "Elige una fecha válida.";
export const PROGRESS_DATE_FORMAT_MESSAGE = "La fecha debe tener el formato AAAA-MM-DD.";
export const PROGRESS_FUTURE_DATE_MESSAGE = "La fecha no puede ser futura.";
export const PROGRESS_WEIGHT_MESSAGE = `El peso debe estar entre ${PROGRESS_WEIGHT_MIN} y ${PROGRESS_WEIGHT_MAX} kg.`;
export const PROGRESS_CHEST_MESSAGE = `La medida de pecho debe estar entre ${PROGRESS_MEASURE_MIN} y ${PROGRESS_MEASURE_MAX} cm.`;
export const PROGRESS_WAIST_MESSAGE = `La medida de cintura debe estar entre ${PROGRESS_MEASURE_MIN} y ${PROGRESS_MEASURE_MAX} cm.`;
export const PROGRESS_ARM_MESSAGE = `La medida de brazo debe estar entre ${PROGRESS_MEASURE_MIN} y ${PROGRESS_MEASURE_MAX} cm.`;

export const EMPTY_PROGRESS_MESSAGE =
  "Aún no tienes registros de progreso. Guarda tu primera medición para ver tu evolución.";
export const SINGLE_ENTRY_NOTE =
  "Este es tu primer registro (línea base). Registra otra medición más adelante para calcular diferencias respecto al inicio.";
export const PROGRESS_SAVED_MESSAGE = "Registro de progreso guardado.";

const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const DECIMAL_PATTERN = /^\d+(?:\.\d{1,2})?$/;

export interface ProgressDraft {
  date: string;
  weightKg: string;
  chestCm: string;
  waistCm: string;
  armCm: string;
}

export type ProgressFieldErrors = Partial<Record<keyof ProgressDraft, string>>;

export type ProgressValidationResult =
  | { valid: true; payload: CreateProgressEntryInput }
  | { valid: false; errors: ProgressFieldErrors };

export const EMPTY_PROGRESS_DRAFT: ProgressDraft = {
  date: "",
  weightKg: "",
  chestCm: "",
  waistCm: "",
  armCm: "",
};

function isRealCalendarDate(date: string): boolean {
  if (!DATE_PATTERN.test(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= maxDay;
}

function parseMetric(raw: string, min: number, max: number): number | null {
  const trimmed = raw.trim();
  if (!DECIMAL_PATTERN.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= min && value <= max ? value : null;
}

/** Valida fecha (no futura en El Salvador), peso (20-300 kg) y medidas (10-250 cm). */
export function validateProgressDraft(
  draft: ProgressDraft,
  now: Date = new Date(),
): ProgressValidationResult {
  const errors: ProgressFieldErrors = {};
  const date = draft.date.trim();
  const today = getGymDateKey(now);

  if (!date) {
    errors.date = PROGRESS_DATE_REQUIRED_MESSAGE;
  } else if (!DATE_PATTERN.test(date)) {
    errors.date = PROGRESS_DATE_FORMAT_MESSAGE;
  } else if (!isRealCalendarDate(date)) {
    errors.date = `La fecha ${date} no existe.`;
  } else if (today && date > today) {
    errors.date = PROGRESS_FUTURE_DATE_MESSAGE;
  }

  const weightKg = parseMetric(draft.weightKg, PROGRESS_WEIGHT_MIN, PROGRESS_WEIGHT_MAX);
  if (weightKg === null) {
    errors.weightKg = PROGRESS_WEIGHT_MESSAGE;
  }

  const chestCm = parseMetric(draft.chestCm, PROGRESS_MEASURE_MIN, PROGRESS_MEASURE_MAX);
  if (chestCm === null) {
    errors.chestCm = PROGRESS_CHEST_MESSAGE;
  }

  const waistCm = parseMetric(draft.waistCm, PROGRESS_MEASURE_MIN, PROGRESS_MEASURE_MAX);
  if (waistCm === null) {
    errors.waistCm = PROGRESS_WAIST_MESSAGE;
  }

  const armCm = parseMetric(draft.armCm, PROGRESS_MEASURE_MIN, PROGRESS_MEASURE_MAX);
  if (armCm === null) {
    errors.armCm = PROGRESS_ARM_MESSAGE;
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  if (
    weightKg === null ||
    chestCm === null ||
    waistCm === null ||
    armCm === null
  ) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    payload: {
      date,
      weightKg,
      chestCm,
      waistCm,
      armCm,
    },
  };
}

/** "2026-10-01" -> "01/10/2026". */
export function formatProgressDate(date: string): string {
  if (!DATE_PATTERN.test(date)) return date;
  return formatEndDate(date);
}

/** "2026-10-01" -> "01/10". */
export function formatProgressShortDate(date: string): string {
  if (!DATE_PATTERN.test(date)) return date;
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

export function formatMetricValue(value: number, unit: "kg" | "cm"): string {
  const normalized = Number.isInteger(value)
    ? String(value)
    : Number(value.toFixed(2)).toString();
  return `${normalized} ${unit}`;
}

export function formatDelta(value: number, unit: "kg" | "cm"): string {
  const rounded = Math.round(value * 100) / 100;
  if (rounded === 0) return `0 ${unit}`;
  const sign = rounded > 0 ? "+" : "-";
  const magnitude = Math.abs(rounded);
  const text = Number.isInteger(magnitude)
    ? String(magnitude)
    : Number(magnitude.toFixed(2)).toString();
  return `${sign}${text} ${unit}`;
}

export type WeightDeltaTone = "positive-loss" | "neutral";

export function weightDeltaTone(delta: number): WeightDeltaTone {
  return delta < 0 ? "positive-loss" : "neutral";
}

export interface ProgressComparisonSummary {
  baseline: ProgressEntry;
  latest: ProgressEntry;
  hasDifferences: boolean;
  deltas: ProgressDeltas | null;
}

/** Solo expone diferencias reales cuando existen al menos 2 registros. */
export function getProgressSummary(
  evolution: ProgressEvolution,
): ProgressComparisonSummary | null {
  const { entries } = evolution;
  if (entries.length === 0) return null;

  const baseline = entries[0];
  const latest = entries[entries.length - 1];
  const hasDifferences = entries.length >= 2 && evolution.deltas !== null;

  return {
    baseline,
    latest,
    hasDifferences,
    deltas: hasDifferences ? evolution.deltas : null,
  };
}
