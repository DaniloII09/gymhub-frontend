import {
  EXERCISE_NAME_MAX,
  EXERCISE_NAME_MIN,
  EXERCISE_REPS_MAX,
  EXERCISE_REPS_MIN,
  EXERCISE_SETS_MAX,
  EXERCISE_SETS_MIN,
  EXERCISE_WEIGHT_MAX,
  EXERCISE_WEIGHT_MIN,
  ROUTINE_DAYS_MAX,
  ROUTINE_DAYS_MIN,
  ROUTINE_EXERCISES_MAX,
  ROUTINE_EXERCISES_MIN,
  ROUTINE_NAME_MAX,
  ROUTINE_NAME_MIN,
  WEEKDAY_OPTIONS,
  type CreateRoutineInput,
  type RoutineExerciseInput,
  type RoutineMemberOption,
  type RoutineRecord,
} from "@/src/types/routines";
import type { TrainerAgendaSession } from "@/src/types/trainer-agenda";

export const ROUTINE_NAME_MESSAGE = `El nombre de la rutina debe tener entre ${ROUTINE_NAME_MIN} y ${ROUTINE_NAME_MAX} caracteres.`;
export const ROUTINE_MEMBER_MESSAGE = "Elige un miembro o ingresa un ID válido (UUID).";
export const ROUTINE_DAYS_MESSAGE =
  "Debes seleccionar entre 1 y 7 días válidos (Lunes a Domingo).";
export const ROUTINE_EXERCISES_MESSAGE = `La rutina debe incluir entre ${ROUTINE_EXERCISES_MIN} y ${ROUTINE_EXERCISES_MAX} ejercicios.`;
export const EXERCISE_NAME_MESSAGE = `El nombre del ejercicio debe tener entre ${EXERCISE_NAME_MIN} y ${EXERCISE_NAME_MAX} caracteres.`;
export const EXERCISE_SETS_MESSAGE = `Las series deben ser un entero entre ${EXERCISE_SETS_MIN} y ${EXERCISE_SETS_MAX}.`;
export const EXERCISE_REPS_MESSAGE = `Las repeticiones deben ser un entero entre ${EXERCISE_REPS_MIN} y ${EXERCISE_REPS_MAX}.`;
export const EXERCISE_WEIGHT_MESSAGE = `El peso sugerido debe estar entre ${EXERCISE_WEIGHT_MIN} y ${EXERCISE_WEIGHT_MAX} kg.`;
export const EMPTY_TRAINER_ROUTINES_MESSAGE = "Aún no has asignado ninguna rutina.";
export const EMPTY_MEMBER_ROUTINES_MESSAGE = "Aún no tienes rutinas asignadas.";
export const ROUTINE_CREATED_MESSAGE = "Rutina creada y asignada correctamente.";
export const ROUTINE_UPDATED_MESSAGE = "Rutina actualizada correctamente.";
export const ROUTINE_DELETED_MESSAGE = "Rutina eliminada.";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INTEGER_PATTERN = /^\d+$/;
const WEIGHT_PATTERN = /^\d+(?:\.\d{1,2})?$/;

export interface ExerciseDraft {
  key: string;
  name: string;
  sets: string;
  reps: string;
  suggestedWeightKg: string;
}

export interface RoutineDraft {
  name: string;
  memberId: string;
  daysOfWeek: number[];
  exercises: ExerciseDraft[];
}

export interface ExerciseRowErrors {
  name?: string;
  sets?: string;
  reps?: string;
  suggestedWeightKg?: string;
}

export interface RoutineFormErrors {
  name?: string;
  memberId?: string;
  daysOfWeek?: string;
  exercises?: string;
  exerciseRows: Record<number, ExerciseRowErrors>;
}

export type RoutineValidationResult =
  | { valid: true; payload: CreateRoutineInput }
  | { valid: false; errors: RoutineFormErrors };

let draftKeySeq = 1;

export function createExerciseDraft(partial: Partial<ExerciseDraft> = {}): ExerciseDraft {
  return {
    key: partial.key ?? `ex-${draftKeySeq++}`,
    name: partial.name ?? "",
    sets: partial.sets ?? "3",
    reps: partial.reps ?? "10",
    suggestedWeightKg: partial.suggestedWeightKg ?? "0",
  };
}

export function createEmptyRoutineDraft(): RoutineDraft {
  return {
    name: "",
    memberId: "",
    daysOfWeek: [1, 3, 5],
    exercises: [createExerciseDraft()],
  };
}

export function draftFromRoutine(routine: RoutineRecord): RoutineDraft {
  return {
    name: routine.name,
    memberId: routine.member.id,
    daysOfWeek: [...routine.daysOfWeek].sort((a, b) => a - b),
    exercises: routine.exercises.map((ex) =>
      createExerciseDraft({
        name: ex.name,
        sets: String(ex.sets),
        reps: String(ex.reps),
        suggestedWeightKg: String(ex.suggestedWeightKg),
      }),
    ),
  };
}

/** Alterna un día (1..7) manteniendo orden único de Lunes a Domingo. */
export function toggleRoutineDay(days: number[], day: number): number[] {
  if (day < 1 || day > 7) return days;
  if (days.includes(day)) {
    return days.filter((item) => item !== day);
  }
  return [...days, day].sort((a, b) => a - b);
}

/** Junta y deduplica miembros visibles para el entrenador desde sesiones y rutinas previas. */
export function collectTrainerMembers(
  sessions: TrainerAgendaSession[],
  routines: RoutineRecord[],
): RoutineMemberOption[] {
  const byId = new Map<string, RoutineMemberOption>();

  for (const routine of routines) {
    byId.set(routine.member.id, {
      id: routine.member.id,
      fullName: routine.member.fullName,
      memberCode: routine.member.memberCode,
    });
  }

  for (const session of sessions) {
    if (!byId.has(session.member.id)) {
      byId.set(session.member.id, {
        id: session.member.id,
        fullName: session.member.fullName,
        memberCode: null,
      });
    }
  }

  return Array.from(byId.values()).sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "es", { sensitivity: "base" }),
  );
}

function parseStrictInt(raw: string, min: number, max: number): number | null {
  const trimmed = raw.trim();
  if (!INTEGER_PATTERN.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isInteger(value) && value >= min && value <= max ? value : null;
}

function parseWeight(raw: string): number | null {
  const trimmed = raw.trim();
  if (!WEIGHT_PATTERN.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= EXERCISE_WEIGHT_MIN && value <= EXERCISE_WEIGHT_MAX
    ? value
    : null;
}

/** Valida rutina completa marcando cabecera, filas inválidas y cada campo inválido. */
export function validateRoutineDraft(draft: RoutineDraft): RoutineValidationResult {
  const errors: RoutineFormErrors = { exerciseRows: {} };

  const name = draft.name.trim();
  if (name.length < ROUTINE_NAME_MIN || name.length > ROUTINE_NAME_MAX) {
    errors.name = ROUTINE_NAME_MESSAGE;
  }

  const memberId = draft.memberId.trim();
  if (!UUID_PATTERN.test(memberId)) {
    errors.memberId = ROUTINE_MEMBER_MESSAGE;
  }

  const uniqueDays = Array.from(new Set(draft.daysOfWeek))
    .filter((d) => Number.isInteger(d) && d >= 1 && d <= 7)
    .sort((a, b) => a - b);
  if (
    uniqueDays.length !== draft.daysOfWeek.length ||
    uniqueDays.length < ROUTINE_DAYS_MIN ||
    uniqueDays.length > ROUTINE_DAYS_MAX
  ) {
    errors.daysOfWeek = ROUTINE_DAYS_MESSAGE;
  }

  if (
    draft.exercises.length < ROUTINE_EXERCISES_MIN ||
    draft.exercises.length > ROUTINE_EXERCISES_MAX
  ) {
    errors.exercises = ROUTINE_EXERCISES_MESSAGE;
  }

  const parsedExercises: RoutineExerciseInput[] = [];
  draft.exercises.forEach((row, index) => {
    const rowErrors: ExerciseRowErrors = {};
    const exName = row.name.trim();
    if (exName.length < EXERCISE_NAME_MIN || exName.length > EXERCISE_NAME_MAX) {
      rowErrors.name = EXERCISE_NAME_MESSAGE;
    }

    const sets = parseStrictInt(row.sets, EXERCISE_SETS_MIN, EXERCISE_SETS_MAX);
    if (sets === null) {
      rowErrors.sets = EXERCISE_SETS_MESSAGE;
    }

    const reps = parseStrictInt(row.reps, EXERCISE_REPS_MIN, EXERCISE_REPS_MAX);
    if (reps === null) {
      rowErrors.reps = EXERCISE_REPS_MESSAGE;
    }

    const weight = parseWeight(row.suggestedWeightKg);
    if (weight === null) {
      rowErrors.suggestedWeightKg = EXERCISE_WEIGHT_MESSAGE;
    }

    if (Object.keys(rowErrors).length > 0) {
      errors.exerciseRows[index] = rowErrors;
    } else if (sets !== null && reps !== null && weight !== null) {
      parsedExercises.push({
        name: exName,
        sets,
        reps,
        suggestedWeightKg: weight,
      });
    }
  });

  const hasError =
    Boolean(errors.name) ||
    Boolean(errors.memberId) ||
    Boolean(errors.daysOfWeek) ||
    Boolean(errors.exercises) ||
    Object.keys(errors.exerciseRows).length > 0;

  if (hasError) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    payload: {
      name,
      memberId,
      daysOfWeek: uniqueDays,
      exercises: parsedExercises,
    },
  };
}

export function formatRoutineDays(daysOfWeek: number[]): string {
  const byValue = new Map<number, string>(WEEKDAY_OPTIONS.map((d) => [d.value, d.label]));
  return [...daysOfWeek]
    .sort((a, b) => a - b)
    .map((day) => byValue.get(day) ?? String(day))
    .join(", ");
}

export function formatWeightKg(weight: number): string {
  return `${Number.isInteger(weight) ? weight : weight.toFixed(2).replace(/\.?0+$/, "")} kg`;
}
