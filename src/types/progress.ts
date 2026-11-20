/** Contratos y rangos de progreso físico del miembro (H19 · SCRUM-133 / SCRUM-134). */

export const PROGRESS_WEIGHT_MIN = 20;
export const PROGRESS_WEIGHT_MAX = 300;
export const PROGRESS_MEASURE_MIN = 10;
export const PROGRESS_MEASURE_MAX = 250;

export interface CreateProgressEntryInput {
  /** YYYY-MM-DD, no futura en America/El_Salvador. */
  date: string;
  weightKg: number;
  chestCm: number;
  waistCm: number;
  armCm: number;
}

export interface ProgressEntry {
  id: number;
  date: string;
  weightKg: number;
  chestCm: number;
  waistCm: number;
  armCm: number;
  isBaseline: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressDeltas {
  weightKg: number;
  chestCm: number;
  waistCm: number;
  armCm: number;
}

export interface ProgressEvolution {
  /** Ordenados cronológicamente (ascendente por fecha). */
  entries: ProgressEntry[];
  /** Diferencias del último registro respecto al primero (null sin registros). */
  deltas: ProgressDeltas | null;
}
