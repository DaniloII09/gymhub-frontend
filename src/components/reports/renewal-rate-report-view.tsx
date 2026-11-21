import type { RenewalRateReport } from "@/src/types/reports";
import {
  monthLabel,
  rangeText,
  type DateRange,
  type RangePreset,
} from "./income-report-logic";
import {
  EMPTY_RENEWAL_RANGE_MESSAGE,
  formatRenewalRate,
  NO_RENEWAL_DATA_LABEL,
  renewalBarPercent,
} from "./renewal-rate-logic";
import { ReportRangeForm } from "./report-range-form";

export interface RenewalRateReportViewProps {
  range: DateRange;
  rangeError: string | null;
  loading: boolean;
  loadError: string | null;
  report: RenewalRateReport | null;
  onChangeRange: (field: keyof DateRange, value: string) => void;
  onPreset: (preset: RangePreset) => void;
  onSubmit: () => void;
  onRetry: () => void;
}

/** Vista presentacional de tasa de renovación (H30 · FE-30.1). */
export function RenewalRateReportView({
  range,
  rangeError,
  loading,
  loadError,
  report,
  onChangeRange,
  onPreset,
  onSubmit,
  onRetry,
}: RenewalRateReportViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Tasa de renovación</h1>
        <p className="text-sm text-zinc-500">
          Porcentaje de membresías mensuales y trimestrales vencidas que se renovaron dentro de 7
          días. Máximo 12 meses.
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

      <ReportBody loading={loading} loadError={loadError} report={report} onRetry={onRetry} />
    </div>
  );
}

function ReportBody({
  loading,
  loadError,
  report,
  onRetry,
}: Pick<RenewalRateReportViewProps, "loading" | "loadError" | "report" | "onRetry">) {
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

  const { totals } = report;
  const overallRateText = formatRenewalRate(totals.renewalRate, totals.expiredCount);
  const noExpirations = totals.expiredCount === 0;

  return (
    <div
      className={`flex flex-col gap-4 ${loading ? "opacity-60" : ""}`}
      aria-busy={loading || undefined}
    >
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500">{rangeText(report)}</p>

        {noExpirations && (
          <p className="mt-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
            {report.message ?? EMPTY_RENEWAL_RANGE_MESSAGE}
          </p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs font-medium text-zinc-500">Membresías vencidas</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{totals.expiredCount}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs font-medium text-zinc-500">Renovadas en el periodo</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
              {totals.renewedCount}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs font-medium text-zinc-500">Tasa de renovación del rango</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-indigo-700 dark:text-indigo-300">
              {overallRateText}
            </p>
          </div>
        </div>
      </section>

      {!noExpirations && (
        <>
          <section
            aria-labelledby="renewal-bars-heading"
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2
              id="renewal-bars-heading"
              className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Gráfica de barras mensual (%)
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {report.months.map((month) => {
                const hasData = month.expiredCount > 0 && month.renewalRate !== null;
                const rateText = formatRenewalRate(month.renewalRate, month.expiredCount);
                const height = renewalBarPercent(month.renewalRate, month.expiredCount);

                return (
                  <div
                    key={month.month}
                    data-month-status={hasData ? "with-data" : "no-data"}
                    className="flex flex-col items-center gap-2 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
                  >
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        hasData ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-400"
                      }`}
                    >
                      {rateText}
                    </span>
                    <div className="flex h-28 w-10 items-end justify-center rounded-md bg-zinc-100 p-1 dark:bg-zinc-800">
                      {hasData ? (
                        <div
                          className="w-full rounded-sm bg-indigo-600 dark:bg-indigo-500"
                          style={{ height: `${height}%` }}
                          aria-label={`${monthLabel(month.month)}: ${rateText}`}
                        />
                      ) : (
                        <span className="pb-1 text-[10px] text-zinc-400">
                          {NO_RENEWAL_DATA_LABEL}
                        </span>
                      )}
                    </div>
                    <span className="text-center text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {monthLabel(month.month)}
                    </span>
                    <span className="text-center text-[11px] text-zinc-500">
                      {month.renewedCount}/{month.expiredCount}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold dark:border-zinc-800">
              Detalle por mes
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Mes</th>
                    <th className="px-4 py-2 text-right font-semibold">Vencidas</th>
                    <th className="px-4 py-2 text-right font-semibold">Renovadas</th>
                    <th className="px-4 py-2 text-right font-semibold">Tasa</th>
                  </tr>
                </thead>
                <tbody>
                  {report.months.map((month) => {
                    const rateText = formatRenewalRate(month.renewalRate, month.expiredCount);
                    return (
                      <tr
                        key={month.month}
                        className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                      >
                        <td className="px-4 py-2 font-medium">{monthLabel(month.month)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{month.expiredCount}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{month.renewedCount}</td>
                        <td className="px-4 py-2 text-right font-semibold tabular-nums">
                          {rateText}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
