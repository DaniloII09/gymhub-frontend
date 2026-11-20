import type { RatingsReport } from "@/src/types/reports";
import { rangeText, type DateRange, type RangePreset } from "./income-report-logic";
import {
  formatRatingAverage,
  isLowRating,
  NO_REVIEWS_IN_RANGE_MESSAGE,
  RATINGS_TAB_LABELS,
  type RatingsTab,
} from "./ratings-report-logic";
import { ReportRangeForm } from "./report-range-form";

export interface RatingsReportViewProps {
  tab: RatingsTab;
  range: DateRange;
  rangeError: string | null;
  loading: boolean;
  loadError: string | null;
  report: RatingsReport | null;
  onChangeTab: (tab: RatingsTab) => void;
  onChangeRange: (field: keyof DateRange, value: string) => void;
  onPreset: (preset: RangePreset) => void;
  onSubmit: () => void;
  onRetry: () => void;
}

const TABS: RatingsTab[] = ["trainer", "class"];

/** Vista presentacional de promedios de calificación (H23 · FE-23.1). */
export function RatingsReportView({
  tab,
  range,
  rangeError,
  loading,
  loadError,
  report,
  onChangeTab,
  onChangeRange,
  onPreset,
  onSubmit,
  onRetry,
}: RatingsReportViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Promedios de calificación</h1>
        <p className="text-sm text-zinc-500">
          Reseñas registradas en el rango, ordenadas de menor a mayor promedio. Máximo 12 meses.
        </p>
      </div>

      <ReportRangeForm
        range={range}
        rangeError={rangeError}
        loading={loading}
        onChangeRange={onChangeRange}
        onPreset={onPreset}
        onSubmit={onSubmit}
      />

      <div
        role="tablist"
        aria-label="Agrupación de promedios"
        className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800"
      >
        {TABS.map((key) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChangeTab(key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {RATINGS_TAB_LABELS[key]}
            </button>
          );
        })}
      </div>

      <ReportBody
        tab={tab}
        loading={loading}
        loadError={loadError}
        report={report}
        onRetry={onRetry}
      />
    </div>
  );
}

interface TableRow {
  key: string;
  name: string;
  averageRating: number;
  reviewCount: number;
}

function ReportBody({
  tab,
  loading,
  loadError,
  report,
  onRetry,
}: Pick<RatingsReportViewProps, "tab" | "loading" | "loadError" | "report" | "onRetry">) {
  if (loadError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-6 text-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <p className="text-red-600">{loadError}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 dark:border-zinc-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!report) {
    return loading ? (
      <p role="status" className="p-6 text-center text-sm text-zinc-500">
        Cargando reporte...
      </p>
    ) : null;
  }

  const rows: TableRow[] =
    tab === "trainer"
      ? report.byTrainer.map((item) => ({
          key: item.trainerId,
          name: item.trainerName,
          averageRating: item.averageRating,
          reviewCount: item.reviewCount,
        }))
      : report.byClassName.map((item) => ({
          key: item.className,
          name: item.className,
          averageRating: item.averageRating,
          reviewCount: item.reviewCount,
        }));

  const nameHeader = tab === "trainer" ? "Entrenador" : "Clase";
  const scopeNote =
    tab === "trainer"
      ? "Incluye reseñas de clases grupales y sesiones personales."
      : "Agrupa las reseñas de clases grupales por nombre de clase.";

  return (
    <div
      role="tabpanel"
      aria-label={RATINGS_TAB_LABELS[tab]}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-500">
        <span>{scopeNote}</span>
        <span>Periodo: {rangeText({ from: report.from, to: report.to })}</span>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {report.message ?? NO_REVIEWS_IN_RANGE_MESSAGE}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
                  {nameHeader}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
                  Promedio
                </th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                  Reseñas
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const low = isLowRating(row.averageRating);
                return (
                  <tr
                    key={row.key}
                    data-low-rating={low ? "true" : undefined}
                    className={`border-b border-zinc-200 dark:border-zinc-800 ${
                      low
                        ? "bg-red-50/80 dark:bg-red-950/30"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {row.name}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-semibold tabular-nums ${
                            low
                              ? "text-red-700 dark:text-red-300"
                              : "text-zinc-900 dark:text-zinc-100"
                          }`}
                        >
                          ★ {formatRatingAverage(row.averageRating)}
                        </span>
                        {low && (
                          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/50 dark:text-red-200">
                            Menor a 3.0
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                      {row.reviewCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
