import type { RoutineRecord } from "@/src/types/routines";
import {
  EMPTY_MEMBER_ROUTINES_MESSAGE,
  formatRoutineDays,
  formatWeightKg,
} from "./routine-form-logic";

export interface MemberRoutinesViewProps {
  routines: RoutineRecord[];
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
}

/** Vista de solo lectura «Mi rutina» para MEMBER (H18 · FE-18.2), adaptable a 360 px. */
export function MemberRoutinesView({
  routines,
  loading,
  loadError,
  onRetry,
}: MemberRoutinesViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Mi rutina</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Consulta las rutinas asignadas por tu entrenador en modo de solo lectura.
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          disabled={loading}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Actualizar
        </button>
      </div>

      {loadError && (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
        >
          <p>{loadError}</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 font-medium text-red-700 dark:border-red-800 dark:bg-zinc-900 dark:text-red-300"
          >
            Reintentar
          </button>
        </div>
      )}

      {loading && !loadError && (
        <p
          role="status"
          className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900"
        >
          Cargando tus rutinas...
        </p>
      )}

      {!loading && !loadError && routines.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          {EMPTY_MEMBER_ROUTINES_MESSAGE}
        </div>
      )}

      {!loading && !loadError && routines.length > 0 && (
        <ul className="flex flex-col gap-4">
          {routines.map((routine) => (
            <li
              key={routine.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs sm:p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="space-y-1 border-b border-zinc-200 pb-3 dark:border-zinc-800">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {routine.name}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Entrenador:{" "}
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {routine.trainer.fullName}
                  </span>
                </p>
                <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  Días: {formatRoutineDays(routine.daysOfWeek)}
                </p>
              </div>

              <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {routine.exercises.map((exercise) => (
                  <li
                    key={exercise.id}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/60"
                  >
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {exercise.sortOrder}. {exercise.name}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                      <span>
                        Series: <strong className="text-zinc-900 dark:text-zinc-100">{exercise.sets}</strong>
                      </span>
                      <span>
                        Repeticiones:{" "}
                        <strong className="text-zinc-900 dark:text-zinc-100">{exercise.reps}</strong>
                      </span>
                      <span>
                        Peso sugerido:{" "}
                        <strong className="text-zinc-900 dark:text-zinc-100">
                          {formatWeightKg(exercise.suggestedWeightKg)}
                        </strong>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
