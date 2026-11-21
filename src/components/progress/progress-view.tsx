import type { ProgressEvolution } from "@/src/types/progress";
import { ProgressCharts } from "./progress-charts";
import {
  EMPTY_PROGRESS_MESSAGE,
  formatDelta,
  formatMetricValue,
  formatProgressDate,
  getProgressSummary,
  PROGRESS_SAVED_MESSAGE,
  SINGLE_ENTRY_NOTE,
  weightDeltaTone,
  type ProgressDraft,
  type ProgressFieldErrors,
} from "./progress-logic";

export interface ProgressViewProps {
  evolution: ProgressEvolution | null;
  loading: boolean;
  loadError: string | null;
  draft: ProgressDraft;
  fieldErrors: ProgressFieldErrors;
  submitError: string | null;
  saving: boolean;
  savedNotice: boolean;
  maxDate: string;
  onRetry: () => void;
  onChangeField: (field: keyof ProgressDraft, value: string) => void;
  onSubmit: () => void;
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

/** Vista «Mi progreso» del miembro (H19 · FE-19.1 y FE-19.2), adaptable a 360 px. */
export function ProgressView({
  evolution,
  loading,
  loadError,
  draft,
  fieldErrors,
  submitError,
  saving,
  savedNotice,
  maxDate,
  onRetry,
  onChangeField,
  onSubmit,
}: ProgressViewProps) {
  const summary = evolution ? getProgressSummary(evolution) : null;
  const historyNewestFirst = evolution ? [...evolution.entries].reverse() : [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Mi progreso</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Registra tu peso y medidas corporales para seguir tu evolución.
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          disabled={loading || saving}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Actualizar
        </button>
      </div>

      <section
        aria-labelledby="progress-form-heading"
        className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs sm:p-5 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2
          id="progress-form-heading"
          className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100"
        >
          Nuevo registro
        </h2>

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label
                htmlFor="progress-date"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Fecha
              </label>
              <input
                id="progress-date"
                name="date"
                type="date"
                max={maxDate}
                disabled={saving}
                value={draft.date}
                onChange={(event) => onChangeField("date", event.target.value)}
                aria-invalid={fieldErrors.date ? true : undefined}
                className={inputClass(Boolean(fieldErrors.date))}
              />
              {fieldErrors.date && (
                <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {fieldErrors.date}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="progress-weight"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Peso (20–300 kg)
              </label>
              <input
                id="progress-weight"
                name="weightKg"
                type="number"
                inputMode="decimal"
                step="0.1"
                min={20}
                max={300}
                disabled={saving}
                value={draft.weightKg}
                onChange={(event) => onChangeField("weightKg", event.target.value)}
                aria-invalid={fieldErrors.weightKg ? true : undefined}
                placeholder="74.5"
                className={inputClass(Boolean(fieldErrors.weightKg))}
              />
              {fieldErrors.weightKg && (
                <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {fieldErrors.weightKg}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="progress-chest"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Pecho (10–250 cm)
              </label>
              <input
                id="progress-chest"
                name="chestCm"
                type="number"
                inputMode="decimal"
                step="0.1"
                min={10}
                max={250}
                disabled={saving}
                value={draft.chestCm}
                onChange={(event) => onChangeField("chestCm", event.target.value)}
                aria-invalid={fieldErrors.chestCm ? true : undefined}
                placeholder="98.0"
                className={inputClass(Boolean(fieldErrors.chestCm))}
              />
              {fieldErrors.chestCm && (
                <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {fieldErrors.chestCm}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="progress-waist"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Cintura (10–250 cm)
              </label>
              <input
                id="progress-waist"
                name="waistCm"
                type="number"
                inputMode="decimal"
                step="0.1"
                min={10}
                max={250}
                disabled={saving}
                value={draft.waistCm}
                onChange={(event) => onChangeField("waistCm", event.target.value)}
                aria-invalid={fieldErrors.waistCm ? true : undefined}
                placeholder="82.0"
                className={inputClass(Boolean(fieldErrors.waistCm))}
              />
              {fieldErrors.waistCm && (
                <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {fieldErrors.waistCm}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="progress-arm"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Brazo (10–250 cm)
              </label>
              <input
                id="progress-arm"
                name="armCm"
                type="number"
                inputMode="decimal"
                step="0.1"
                min={10}
                max={250}
                disabled={saving}
                value={draft.armCm}
                onChange={(event) => onChangeField("armCm", event.target.value)}
                aria-invalid={fieldErrors.armCm ? true : undefined}
                placeholder="34.5"
                className={inputClass(Boolean(fieldErrors.armCm))}
              />
              {fieldErrors.armCm && (
                <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {fieldErrors.armCm}
                </p>
              )}
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

          {savedNotice && (
            <p
              role="status"
              className="rounded-lg border border-emerald-500/40 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
            >
              {PROGRESS_SAVED_MESSAGE}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? "Guardando..." : "Guardar registro"}
            </button>
          </div>
        </form>
      </section>

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
          Cargando historial de progreso...
        </p>
      )}

      {!loading && !loadError && evolution && evolution.entries.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          {EMPTY_PROGRESS_MESSAGE}
        </div>
      )}

      {!loading && !loadError && evolution && summary && (
        <>
          <section aria-labelledby="progress-summary-heading" className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2
                id="progress-summary-heading"
                className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
              >
                Resumen de evolución
              </h2>
              {summary.hasDifferences && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Comparado contra tu primer registro ({formatProgressDate(summary.baseline.date)})
                </span>
              )}
            </div>

            {!summary.hasDifferences && (
              <p className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-3 text-sm text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200">
                {SINGLE_ENTRY_NOTE}
              </p>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                label="Peso"
                latestValue={formatMetricValue(summary.latest.weightKg, "kg")}
                deltaText={
                  summary.deltas ? formatDelta(summary.deltas.weightKg, "kg") : null
                }
                greenWeightLoss={
                  summary.deltas ? weightDeltaTone(summary.deltas.weightKg) === "positive-loss" : false
                }
              />
              <SummaryCard
                label="Pecho"
                latestValue={formatMetricValue(summary.latest.chestCm, "cm")}
                deltaText={
                  summary.deltas ? formatDelta(summary.deltas.chestCm, "cm") : null
                }
              />
              <SummaryCard
                label="Cintura"
                latestValue={formatMetricValue(summary.latest.waistCm, "cm")}
                deltaText={
                  summary.deltas ? formatDelta(summary.deltas.waistCm, "cm") : null
                }
              />
              <SummaryCard
                label="Brazo"
                latestValue={formatMetricValue(summary.latest.armCm, "cm")}
                deltaText={
                  summary.deltas ? formatDelta(summary.deltas.armCm, "cm") : null
                }
              />
            </div>
          </section>

          <ProgressCharts entries={evolution.entries} />

          <section aria-labelledby="progress-history-heading" className="space-y-3">
            <h2
              id="progress-history-heading"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Historial de registros
            </h2>
            <ul className="space-y-2.5">
              {historyNewestFirst.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatProgressDate(entry.date)}
                    </span>
                    {entry.isBaseline && (
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        Primer registro
                      </span>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-600 sm:grid-cols-4 dark:text-zinc-300">
                    <span>
                      Peso:{" "}
                      <strong className="text-zinc-900 dark:text-zinc-100">
                        {formatMetricValue(entry.weightKg, "kg")}
                      </strong>
                    </span>
                    <span>
                      Pecho:{" "}
                      <strong className="text-zinc-900 dark:text-zinc-100">
                        {formatMetricValue(entry.chestCm, "cm")}
                      </strong>
                    </span>
                    <span>
                      Cintura:{" "}
                      <strong className="text-zinc-900 dark:text-zinc-100">
                        {formatMetricValue(entry.waistCm, "cm")}
                      </strong>
                    </span>
                    <span>
                      Brazo:{" "}
                      <strong className="text-zinc-900 dark:text-zinc-100">
                        {formatMetricValue(entry.armCm, "cm")}
                      </strong>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  latestValue,
  deltaText,
  greenWeightLoss = false,
}: {
  label: string;
  latestValue: string;
  deltaText: string | null;
  greenWeightLoss?: boolean;
}) {
  return (
    <div
      data-weight-delta-tone={greenWeightLoss ? "green" : undefined}
      className={`rounded-xl border p-4 ${
        greenWeightLoss
          ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{latestValue}</p>
      {deltaText !== null ? (
        <p
          className={`mt-1 text-xs font-semibold ${
            greenWeightLoss
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-zinc-600 dark:text-zinc-300"
          }`}
        >
          Diferencia: {deltaText}
        </p>
      ) : (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Registro inicial</p>
      )}
    </div>
  );
}
