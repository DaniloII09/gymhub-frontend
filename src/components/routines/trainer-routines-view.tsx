import {
  ROUTINE_EXERCISES_MAX,
  ROUTINE_EXERCISES_MIN,
  WEEKDAY_OPTIONS,
  type RoutineMemberOption,
  type RoutineRecord,
} from "@/src/types/routines";
import {
  EMPTY_TRAINER_ROUTINES_MESSAGE,
  formatRoutineDays,
  formatWeightKg,
  type ExerciseDraft,
  type RoutineDraft,
  type RoutineFormErrors,
} from "./routine-form-logic";

export interface TrainerRoutinesViewProps {
  routines: RoutineRecord[];
  memberOptions: RoutineMemberOption[];
  loading: boolean;
  loadError: string | null;
  editingId: number | null;
  draft: RoutineDraft;
  errors: RoutineFormErrors;
  submitError: string | null;
  successMessage: string | null;
  saving: boolean;
  confirmDeleteId: number | null;
  deletingId: number | null;
  onRetry: () => void;
  onChangeName: (value: string) => void;
  onChangeMemberId: (value: string) => void;
  onToggleDay: (day: number) => void;
  onAddExercise: () => void;
  onRemoveExercise: (index: number) => void;
  onChangeExercise: (index: number, field: keyof Omit<ExerciseDraft, "key">, value: string) => void;
  onSubmit: () => void;
  onStartEdit: (routine: RoutineRecord) => void;
  onCancelEdit: () => void;
  onRequestDelete: (routineId: number | null) => void;
  onConfirmDelete: (routineId: number) => void;
}

const inputBaseClass =
  "mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 disabled:opacity-60 dark:bg-zinc-950 dark:text-zinc-100";

function inputClass(hasError: boolean): string {
  return `${inputBaseClass} ${
    hasError
      ? "border-red-500 aria-invalid:border-red-500"
      : "border-zinc-300 dark:border-zinc-700"
  }`;
}

/** Vista presentacional de asignación y edición de rutinas (TRAINER · H18). */
export function TrainerRoutinesView({
  routines,
  memberOptions,
  loading,
  loadError,
  editingId,
  draft,
  errors,
  submitError,
  successMessage,
  saving,
  confirmDeleteId,
  deletingId,
  onRetry,
  onChangeName,
  onChangeMemberId,
  onToggleDay,
  onAddExercise,
  onRemoveExercise,
  onChangeExercise,
  onSubmit,
  onStartEdit,
  onCancelEdit,
  onRequestDelete,
  onConfirmDelete,
}: TrainerRoutinesViewProps) {
  const atMaxExercises = draft.exercises.length >= ROUTINE_EXERCISES_MAX;
  const atMinExercises = draft.exercises.length <= ROUTINE_EXERCISES_MIN;
  const isEditing = editingId !== null;
  const busy = saving || deletingId !== null;
  const knownOptionSelected = memberOptions.some((opt) => opt.id === draft.memberId)
    ? draft.memberId
    : "";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Rutinas de entrenamiento
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Crea rutinas personalizadas para tus miembros o actualiza tus rutinas asignadas.
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          disabled={loading || busy}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Actualizar
        </button>
      </div>

      {successMessage && (
        <p
          role="status"
          className="rounded-xl border border-emerald-500/40 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          {successMessage}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section
          aria-labelledby="routine-form-heading"
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
            <h2
              id="routine-form-heading"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              {isEditing ? `Editar rutina #${editingId}` : "Nueva rutina"}
            </h2>
            {isEditing && (
              <button
                type="button"
                disabled={busy}
                onClick={onCancelEdit}
                className="text-sm font-medium text-indigo-600 hover:underline disabled:opacity-50 dark:text-indigo-400"
              >
                Cancelar edición
              </button>
            )}
          </div>

          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="routine-name"
                className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                Nombre de la rutina (3 a 60 caracteres)
              </label>
              <input
                id="routine-name"
                name="name"
                type="text"
                disabled={busy}
                value={draft.name}
                onChange={(event) => onChangeName(event.target.value)}
                aria-invalid={errors.name ? true : undefined}
                placeholder="Ej. Hipertrofia Tren Inferior"
                className={inputClass(Boolean(errors.name))}
              />
              {errors.name && (
                <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="routine-member-select"
                className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                Miembro asignado
              </label>
              {memberOptions.length > 0 && (
                <select
                  id="routine-member-select"
                  disabled={busy}
                  value={knownOptionSelected}
                  onChange={(event) => {
                    if (event.target.value) onChangeMemberId(event.target.value);
                  }}
                  className={inputClass(false)}
                >
                  <option value="">Selecciona un miembro de tus sesiones o rutinas...</option>
                  {memberOptions.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName}
                      {member.memberCode ? ` (${member.memberCode})` : ""}
                    </option>
                  ))}
                </select>
              )}
              <div>
                <label
                  htmlFor="routine-member-id"
                  className="block text-xs text-zinc-500 dark:text-zinc-400"
                >
                  ID del miembro (UUID)
                </label>
                <input
                  id="routine-member-id"
                  name="memberId"
                  type="text"
                  disabled={busy}
                  value={draft.memberId}
                  onChange={(event) => onChangeMemberId(event.target.value)}
                  aria-invalid={errors.memberId ? true : undefined}
                  placeholder="UUID del miembro activo"
                  className={`${inputClass(Boolean(errors.memberId))} font-mono text-xs`}
                />
              </div>
              {errors.memberId && (
                <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                  {errors.memberId}
                </p>
              )}
            </div>

            <div>
              <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Días de la semana (1 a 7)
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {WEEKDAY_OPTIONS.map((day) => {
                  const selected = draft.daysOfWeek.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      disabled={busy}
                      aria-pressed={selected}
                      onClick={() => onToggleDay(day.value)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                        selected
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
              {errors.daysOfWeek && (
                <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.daysOfWeek}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Ejercicios
                  </span>
                  <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                    ({draft.exercises.length}/{ROUTINE_EXERCISES_MAX})
                  </span>
                </div>
                <button
                  type="button"
                  disabled={atMaxExercises || busy}
                  onClick={onAddExercise}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200"
                >
                  + Agregar ejercicio
                </button>
              </div>

              {atMaxExercises && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Alcanzaste el máximo de {ROUTINE_EXERCISES_MAX} ejercicios por rutina.
                </p>
              )}

              {errors.exercises && (
                <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                  {errors.exercises}
                </p>
              )}

              <div className="space-y-3">
                {draft.exercises.map((exercise, index) => {
                  const rowErrors = errors.exerciseRows[index];
                  const invalidRow = Boolean(rowErrors);

                  return (
                    <div
                      key={exercise.key}
                      data-exercise-row={index}
                      data-invalid-row={invalidRow ? "true" : undefined}
                      className={`rounded-xl border p-3.5 ${
                        invalidRow
                          ? "border-red-500 bg-red-50/40 dark:border-red-700 dark:bg-red-950/20"
                          : "border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950/40"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Ejercicio #{index + 1}
                          </span>
                          {invalidRow && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800 dark:bg-red-900/50 dark:text-red-200">
                              Fila inválida
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={atMinExercises || busy}
                          onClick={() => onRemoveExercise(index)}
                          aria-label={`Quitar ejercicio ${index + 1}`}
                          className="text-xs font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400"
                        >
                          Quitar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                        <div className="sm:col-span-6">
                          <label
                            htmlFor={`ex-name-${index}`}
                            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                          >
                            Nombre del ejercicio
                          </label>
                          <input
                            id={`ex-name-${index}`}
                            type="text"
                            disabled={busy}
                            value={exercise.name}
                            onChange={(event) =>
                              onChangeExercise(index, "name", event.target.value)
                            }
                            aria-invalid={rowErrors?.name ? true : undefined}
                            placeholder="Ej. Sentadilla con barra"
                            className={inputClass(Boolean(rowErrors?.name))}
                          />
                          {rowErrors?.name && (
                            <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                              {rowErrors.name}
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <label
                            htmlFor={`ex-sets-${index}`}
                            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                          >
                            Series (1-10)
                          </label>
                          <input
                            id={`ex-sets-${index}`}
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={10}
                            disabled={busy}
                            value={exercise.sets}
                            onChange={(event) =>
                              onChangeExercise(index, "sets", event.target.value)
                            }
                            aria-invalid={rowErrors?.sets ? true : undefined}
                            className={inputClass(Boolean(rowErrors?.sets))}
                          />
                          {rowErrors?.sets && (
                            <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                              {rowErrors.sets}
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <label
                            htmlFor={`ex-reps-${index}`}
                            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                          >
                            Reps (1-50)
                          </label>
                          <input
                            id={`ex-reps-${index}`}
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={50}
                            disabled={busy}
                            value={exercise.reps}
                            onChange={(event) =>
                              onChangeExercise(index, "reps", event.target.value)
                            }
                            aria-invalid={rowErrors?.reps ? true : undefined}
                            className={inputClass(Boolean(rowErrors?.reps))}
                          />
                          {rowErrors?.reps && (
                            <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                              {rowErrors.reps}
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <label
                            htmlFor={`ex-weight-${index}`}
                            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                          >
                            Peso kg (0-300)
                          </label>
                          <input
                            id={`ex-weight-${index}`}
                            type="number"
                            inputMode="decimal"
                            step="0.5"
                            min={0}
                            max={300}
                            disabled={busy}
                            value={exercise.suggestedWeightKg}
                            onChange={(event) =>
                              onChangeExercise(index, "suggestedWeightKg", event.target.value)
                            }
                            aria-invalid={rowErrors?.suggestedWeightKg ? true : undefined}
                            className={inputClass(Boolean(rowErrors?.suggestedWeightKg))}
                          />
                          {rowErrors?.suggestedWeightKg && (
                            <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                              {rowErrors.suggestedWeightKg}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {submitError && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
              >
                {submitError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              {isEditing && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onCancelEdit}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Guardando..."
                  : isEditing
                    ? "Guardar cambios"
                    : "Asignar rutina"}
              </button>
            </div>
          </form>
        </section>

        <section aria-labelledby="trainer-routines-list-heading" className="space-y-3">
          <h2
            id="trainer-routines-list-heading"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
          >
            Mis rutinas asignadas
          </h2>

          {loadError && (
            <div
              role="alert"
              className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
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
              Cargando rutinas...
            </p>
          )}

          {!loading && !loadError && routines.length === 0 && (
            <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
              {EMPTY_TRAINER_ROUTINES_MESSAGE}
            </p>
          )}

          {!loading && !loadError && routines.length > 0 && (
            <ul className="space-y-3">
              {routines.map((routine) => {
                const isConfirmingDelete = confirmDeleteId === routine.id;
                const isDeleting = deletingId === routine.id;
                return (
                  <li
                    key={routine.id}
                    className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {routine.name}
                        </h3>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300">
                          Miembro: {routine.member.fullName}
                          {routine.member.memberCode ? ` (${routine.member.memberCode})` : ""}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          Días: {formatRoutineDays(routine.daysOfWeek)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onStartEdit(routine)}
                          className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          Editar
                        </button>
                        {!isConfirmingDelete && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onRequestDelete(routine.id)}
                            className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>

                    {isConfirmingDelete && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                        <span>¿Eliminar esta rutina?</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => onRequestDelete(null)}
                            className="rounded border border-zinc-300 bg-white px-2.5 py-1 font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => onConfirmDelete(routine.id)}
                            className="rounded bg-red-600 px-2.5 py-1 font-semibold text-white hover:bg-red-500 disabled:opacity-60"
                          >
                            {isDeleting ? "Eliminando..." : "Confirmar"}
                          </button>
                        </div>
                      </div>
                    )}

                    <ul className="mt-3 space-y-1.5 border-t border-zinc-200 pt-2.5 text-xs dark:border-zinc-800">
                      {routine.exercises.map((ex) => (
                        <li
                          key={ex.id}
                          className="flex flex-wrap items-center justify-between gap-2 text-zinc-700 dark:text-zinc-300"
                        >
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {ex.sortOrder}. {ex.name}
                          </span>
                          <span className="text-zinc-500 dark:text-zinc-400">
                            {ex.sets}×{ex.reps} · {formatWeightKg(ex.suggestedWeightKg)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
