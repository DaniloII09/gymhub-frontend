import type { IncomeReport } from "@/src/types/reports";
import {
  barPercent,
  conceptShares,
  formatAmount,
  INCOME_CONCEPTS,
  monthLabel,
  RANGE_PRESET_LABELS,
  rangeText,
  receiptCountText,
  type DateRange,
  type RangePreset,
} from "./income-report-logic";

export type IncomeReportViewProps = {
  range: DateRange;
  rangeError: string | null;
  loading: boolean;
  loadError: string | null;
  report: IncomeReport | null;
  onChangeRange: (field: keyof DateRange, value: string) => void;
  onPreset: (preset: RangePreset) => void;
  onSubmit: () => void;
  onRetry: () => void;
};

const PRESETS = Object.keys(RANGE_PRESET_LABELS) as RangePreset[];

const CONCEPT_COLORS = {
  membership: "bg-indigo-500",
  dropIn: "bg-amber-500",
  personalSession: "bg-emerald-500",
} as const;

/** Reporte de ingresos de un periodo (H29 · FE-29.1), sin estado propio. */
export function IncomeReportView({
  range,
  rangeError,
  loading,
  loadError,
  report,
  onChangeRange,
  onPreset,
  onSubmit,
  onRetry,
}: IncomeReportViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Ingresos del periodo</h1>
        <p className="text-sm text-zinc-500">
          Suma de los comprobantes emitidos en el rango, por concepto y por mes. Máximo 12 meses.
        </p>
      </div>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Desde</span>
            <input
              type="date"
              name="from"
              value={range.from}
              onChange={(event) => onChangeRange("from", event.target.value)}
              aria-invalid={rangeError ? true : undefined}
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Hasta</span>
            <input
              type="date"
              name="to"
              value={range.to}
              onChange={(event) => onChangeRange("to", event.target.value)}
              aria-invalid={rangeError ? true : undefined}
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Consultando..." : "Consultar"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={loading}
              onClick={() => onPreset(preset)}
              className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {RANGE_PRESET_LABELS[preset]}
            </button>
          ))}
        </div>
        {rangeError && (
          <p role="alert" className="text-sm text-red-600">
            {rangeError}
          </p>
        )}
      </form>

      <ReportBody loading={loading} loadError={loadError} report={report} onRetry={onRetry} />
    </div>
  );
}

function ReportBody({
  loading,
  loadError,
  report,
  onRetry,
}: Pick<IncomeReportViewProps, "loading" | "loadError" | "report" | "onRetry">) {
  if (loadError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-6 text-sm dark:border-zinc-800 dark:bg-zinc-900">
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
  const shares = conceptShares(totals);
  const maxTotal = Math.max(0, ...report.months.map((month) => month.total));

  return (
    <div className={`flex flex-col gap-4 ${loading ? "opacity-60" : ""}`} aria-busy={loading || undefined}>
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500">{rangeText(report)}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums" data-testid="income-total">
          {formatAmount(totals.total)}
        </p>
        <p className="text-sm text-zinc-500">{receiptCountText(totals.receiptCount)}</p>
        {report.message && (
          <p className="mt-3 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            {report.message}
          </p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {shares.map((share) => (
            <div
              key={share.concept}
              className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${CONCEPT_COLORS[share.concept]}`} />
                {share.label}
              </div>
              <p className="mt-1 text-xl font-semibold tabular-nums">{formatAmount(share.amount)}</p>
              <p className="text-xs text-zinc-500">{share.percent}% del total</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold dark:border-zinc-800">
          Ingresos por mes
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="px-3 py-2 font-semibold">Mes</th>
                <th className="px-3 py-2 text-right font-semibold">Membresías</th>
                <th className="px-3 py-2 text-right font-semibold">Clases sueltas</th>
                <th className="px-3 py-2 text-right font-semibold">Sesiones personales</th>
                <th className="px-3 py-2 text-right font-semibold">Total</th>
                <th className="px-3 py-2 text-right font-semibold">Comprobantes</th>
                <th className="w-40 px-3 py-2 font-semibold">
                  <span className="sr-only">Comparación</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {report.months.map((month) => (
                <tr key={month.month} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                  <td className="px-3 py-2 font-medium">{monthLabel(month.month)}</td>
                  {INCOME_CONCEPTS.map((concept) => (
                    <td key={concept} className="px-3 py-2 text-right tabular-nums">
                      {formatAmount(month[concept])}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {formatAmount(month.total)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{month.receiptCount}</td>
                  <td className="px-3 py-2">
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-2 rounded-full bg-indigo-500"
                        style={{ width: `${barPercent(month.total, maxTotal)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-zinc-200 font-semibold dark:border-zinc-800">
              <tr>
                <td className="px-3 py-2">Total</td>
                {INCOME_CONCEPTS.map((concept) => (
                  <td key={concept} className="px-3 py-2 text-right tabular-nums">
                    {formatAmount(totals[concept])}
                  </td>
                ))}
                <td className="px-3 py-2 text-right tabular-nums">{formatAmount(totals.total)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{totals.receiptCount}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
