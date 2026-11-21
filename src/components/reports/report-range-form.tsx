import {
  RANGE_PRESET_LABELS,
  type DateRange,
  type RangePreset,
} from "./income-report-logic";

export type ReportRangeFormProps = {
  range: DateRange;
  rangeError: string | null;
  loading: boolean;
  onChangeRange: (field: keyof DateRange, value: string) => void;
  onPreset: (preset: RangePreset) => void;
  onSubmit: () => void;
};

const PRESETS = Object.keys(RANGE_PRESET_LABELS) as RangePreset[];

/** Fechas, atajos y botón Consultar de los reportes (H28 y H29). */
export function ReportRangeForm({
  range,
  rangeError,
  loading,
  onChangeRange,
  onPreset,
  onSubmit,
}: ReportRangeFormProps) {
  return (
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
  );
}
