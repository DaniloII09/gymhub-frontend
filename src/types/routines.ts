/** Contratos y límites de rutinas de entrenamiento (H18 · SCRUM-127 / SCRUM-128). */

export const ROUTINE_NAME_MIN = 3;
export const ROUTINE_NAME_MAX = 60;
export const ROUTINE_DAYS_MIN = 1;
export const ROUTINE_DAYS_MAX = 7;
export const ROUTINE_EXERCISES_MIN = 1;
export const ROUTINE_EXERCISES_MAX = 15;
export const EXERCISE_NAME_MIN = 1;
export const EXERCISE_NAME_MAX = 80;
export const EXERCISE_SETS_MIN = 1;
export const EXERCISE_SETS_MAX = 10;
export const EXERCISE_REPS_MIN = 1;
export const EXERCISE_REPS_MAX = 50;
export const EXERCISE_WEIGHT_MIN = 0;
export const EXERCISE_WEIGHT_MAX = 300;

export const WEEKDAY_OPTIONS = [
  { value: 1, short: "Lun", label: "Lunes" },
  { value: 2, short: "Mar", label: "Martes" },
  { value: 3, short: "Mié", label: "Miércoles" },
  { value: 4, short: "Jue", label: "Jueves" },
  { value: 5, short: "Vie", label: "Viernes" },
  { value: 6, short: "Sáb", label: "Sábado" },
  { value: 7, short: "Dom", label: "Domingo" },
] as const;

export interface RoutineExercise {
  id: number;
  sortOrder: number;
  name: string;
  sets: number;
  reps: number;
  suggestedWeightKg: number;
}

export interface RoutineExerciseInput {
  name: string;
  sets: number;
  reps: number;
  suggestedWeightKg: number;
}

export interface RoutineTrainerSummary {
  id: string;
  fullName: string;
}

export interface RoutineMemberSummary {
  id: string;
  fullName: string;
  memberCode: string | null;
}

export interface RoutineRecord {
  id: number;
  name: string;
  daysOfWeek: number[];
  trainer: RoutineTrainerSummary;
  member: RoutineMemberSummary;
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoutineInput {
  name: string;
  memberId: string;
  daysOfWeek: number[];
  exercises: RoutineExerciseInput[];
}

export type UpdateRoutineInput = Partial<CreateRoutineInput>;

export interface RoutineMemberOption {
  id: string;
  fullName: string;
  memberCode: string | null;
}
