import type { ClassOccupancy, OccupancyReport } from "@/src/types/reports";
import { rangeText, type DateRange, type RangePreset } from "./income-report-logic";
import {
  formatPercent,
  OCCUPANCY_LEVEL_LABELS,
  occupancyBarWidth,
  occupancyHighlights,
  seatsText,
  sessionsText,
} from "./occupancy-report-logic";
import { ReportRangeForm } from "./report-range-form";

export type OccupancyReportViewProps = {
  range: DateRange;
  rangeError: string | null;
  loading: boolean;
  loadError: string | null;
  /** "No hay clases en ese rango." cuando el backend responde 404. */
  emptyMessage: string | null;
  report: OccupancyReport | null;
  onChangeRange: (field: keyof DateRange, value: string) => void;
  onPreset: (preset: RangePreset) => void;
  onSubmit: () => void;
  onRetry: () => void;
};

const LEVEL_STYLES = {
  HIGH: {
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    row: "bg-emerald-50/60 dark:bg-emerald-950/20",
    bar: "bg-emerald-500",
  },
  LOW: {
    badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    row: "bg-red-50/60 dark:bg-red-950/20",
    bar: "bg-red-500",
  },
} as const;

/** Ocupación de las clases en un periodo (H28 · FE-28.1), sin estado propio. */
export function OccupancyReportView({
  range,
  rangeError,
  loading,
  loadError,
  emptyMessage,
  report,
  onChangeRange,
  onPreset,
  onSubmit,
  onRetry,
}: OccupancyReportViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Ocupación de las clases</h1>
        <p className="text-sm text-zinc-500">
          Reservas confirmadas entre el cupo de las clases ya terminadas en el rango, agrupadas por
          nombre. Máximo 12 meses.
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

      <ReportBody
        loading={loading}
        loadError={loadError}
        emptyMessage={emptyMessage}
        report={report}
        onRetry={onRetry}
      />
    </div>
  );
}

function ReportBody({
  loading,
  loadError,
  emptyMessage,
  report,
  onRetry,
}: Pick<OccupancyReportViewProps, "loading" | "loadError" | "emptyMessage" | "report" | "onRetry">) {
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

  if (emptyMessage) {
    return (
      <p
        role="status"
        className={`rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 ${loading ? "opacity-60" : ""}`}
      >
        {emptyMessage}
      </p>
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
  const { high, low } = occupancyHighlights(report.classes);

  return (
    <div className={`flex flex-col gap-4 ${loading ? "opacity-60" : ""}`} aria-busy={loading || undefined}>
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500">{rangeText(report)}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums" data-testid="occupancy-total">
          {formatPercent(totals.occupancyPercent)}
        </p>
        <p className="text-sm text-zinc-500">
          Ocupación general · {totals.classCount}{" "}
          {totals.classCount === 1 ? "tipo de clase" : "tipos de clase"} ·{" "}
          {sessionsText(totals.sessions)} · {seatsText(totals.confirmedReservations, totals.capacity)}{" "}
          reservados
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <HighlightList level="HIGH" items={high} />
          <HighlightList level="LOW" items={low} />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold dark:border-zinc-800">
          Todas las clases, de mayor a menor ocupación
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="w-10 px-3 py-2 font-semibold">#</th>
                <th className="px-3 py-2 font-semibold">Clase</th>
                <th className="px-3 py-2 text-right font-semibold">Clases</th>
                <th className="px-3 py-2 text-right font-semibold">Reservas / cupo</th>
                <th className="w-48 px-3 py-2 font-semibold">Ocupación</th>
                <th className="px-3 py-2 font-semibold">Resaltado</th>
              </tr>
            </thead>
            <tbody>
              {report.classes.map((item, index) => (
                <ClassRow key={item.name} item={item} position={index + 1} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function HighlightList({ level, items }: { level: "HIGH" | "LOW"; items: ClassOccupancy[] }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800" data-testid={`highlight-${level}`}>
      <h3 className="text-sm font-semibold">
        <span className={`rounded-full px-2 py-0.5 text-xs ${LEVEL_STYLES[level].badge}`}>
          {OCCUPANCY_LEVEL_LABELS[level]}
        </span>
      </h3>
      <ol className="mt-2 flex flex-col gap-1 text-sm">
        {items.map((item) => (
          <li key={item.name} className="flex justify-between gap-2">
            <span>{item.name}</span>
            <span className="font-semibold tabular-nums">{formatPercent(item.occupancyPercent)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ClassRow({ item, position }: { item: ClassOccupancy; position: number }) {
  const styles = item.level ? LEVEL_STYLES[item.level] : null;
  return (
    <tr className={`border-b border-zinc-100 last:border-0 dark:border-zinc-800 ${styles?.row ?? ""}`}>
      <td className="px-3 py-2 tabular-nums text-zinc-500">{position}</td>
      <td className="px-3 py-2 font-medium">{item.name}</td>
      <td className="px-3 py-2 text-right tabular-nums">{item.sessions}</td>
      <td className="px-3 py-2 text-right tabular-nums">
        {item.confirmedReservations} / {item.capacity}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-2 rounded-full ${styles?.bar ?? "bg-indigo-500"}`}
              style={{ width: `${occupancyBarWidth(item.occupancyPercent)}%` }}
            />
          </div>
          <span className="w-16 text-right font-semibold tabular-nums">
            {formatPercent(item.occupancyPercent)}
          </span>
        </div>
      </td>
      <td className="px-3 py-2">
        {item.level ? (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles?.badge ?? ""}`}>
            {OCCUPANCY_LEVEL_LABELS[item.level]}
          </span>
        ) : (
          <span className="text-zinc-400">—</span>
        )}
      </td>
    </tr>
  );
}
