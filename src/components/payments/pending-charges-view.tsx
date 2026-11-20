import type { PendingChargesPage } from "@/src/types/payments";
import { totalPages } from "./my-payments-logic";
import {
  daysLateText,
  formatChargeDueDate,
  formatOwedAmount,
  isCriticallyLate,
  memberCodeText,
  NO_PENDING_CHARGES_ADMIN_MESSAGE,
  PENDING_CHARGE_FILTER_OPTIONS,
  resultsCountText,
  type PendingChargeFilterState,
} from "./pending-charges-logic";

export type PendingChargesViewProps = {
  typeFilter: PendingChargeFilterState;
  loading: boolean;
  error: string | null;
  result: PendingChargesPage | null;
  onTypeChange: (nextType: PendingChargeFilterState) => void;
  onPageChange: (nextPage: number) => void;
  onRetry: () => void;
};

/** Tabla de pagos pendientes del administrador (H17 · FE-17.1), sin estado propio. */
export function PendingChargesView({
  typeFilter,
  loading,
  error,
  result,
  onTypeChange,
  onPageChange,
  onRetry,
}: PendingChargesViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pagos pendientes</h1>
          <p className="text-sm text-zinc-500">
            Cobros pendientes ordenados por mayor atraso y nombre. Se resaltan los cobros con más
            de 30 días de atraso.
          </p>
        </div>

        <label htmlFor="pending-charge-type" className="flex items-center gap-2 text-sm">
          <span className="font-medium">Tipo de cobro</span>
          <select
            id="pending-charge-type"
            name="type"
            value={typeFilter}
            onChange={(event) => onTypeChange(event.target.value as PendingChargeFilterState)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {PENDING_CHARGE_FILTER_OPTIONS.map((option) => (
              <option key={option.value || "ALL"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <PendingChargesBody
        loading={loading}
        error={error}
        result={result}
        onPageChange={onPageChange}
        onRetry={onRetry}
      />
    </div>
  );
}

function PendingChargesBody({
  loading,
  error,
  result,
  onPageChange,
  onRetry,
}: Pick<PendingChargesViewProps, "loading" | "error" | "result" | "onPageChange" | "onRetry">) {
  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-6 text-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 font-medium dark:border-zinc-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (loading && !result) {
    return (
      <p
        role="status"
        className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900"
      >
        Cargando pagos pendientes...
      </p>
    );
  }

  if (!result) return null;

  if (result.data.length === 0) {
    return (
      <p
        role="status"
        className={`rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 ${loading ? "opacity-60" : ""}`}
      >
        {NO_PENDING_CHARGES_ADMIN_MESSAGE}
      </p>
    );
  }

  const pages = totalPages(result);

  return (
    <section
      aria-busy={loading || undefined}
      className={`rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 ${loading ? "opacity-60" : ""}`}
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800">
        <span>{resultsCountText(result.total)}</span>
        <span>{loading ? "Actualizando..." : `Página ${result.page} de ${pages}`}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-3 py-2 font-semibold">Miembro</th>
              <th className="px-3 py-2 font-semibold">Código</th>
              <th className="px-3 py-2 font-semibold">Concepto</th>
              <th className="px-3 py-2 text-right font-semibold">Monto</th>
              <th className="px-3 py-2 font-semibold">Fecha de vencimiento</th>
              <th className="px-3 py-2 text-right font-semibold">Días de atraso</th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((item) => {
              const critical = isCriticallyLate(item.daysLate);
              return (
                <tr
                  key={item.chargeId}
                  data-critical-overdue={critical ? "true" : undefined}
                  className={`border-b border-zinc-100 last:border-0 dark:border-zinc-800 ${
                    critical ? "bg-red-50/70 dark:bg-red-950/25" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-medium">{item.fullName}</td>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-600 dark:text-zinc-300">
                    {memberCodeText(item.memberCode)}
                  </td>
                  <td className="px-3 py-2">{item.concept}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatOwedAmount(item.amount)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{formatChargeDueDate(item.dueDate)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {critical ? (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/50 dark:text-red-200">
                        {daysLateText(item.daysLate)}
                        <span className="sr-only"> (más de 30 días de atraso)</span>
                      </span>
                    ) : (
                      <span>{daysLateText(item.daysLate)}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t border-zinc-200 bg-zinc-50/70 font-semibold dark:border-zinc-800 dark:bg-zinc-800/40">
            <tr>
              <td colSpan={3} className="px-3 py-3 text-right">
                Total adeudado
              </td>
              <td className="px-3 py-3 text-right tabular-nums" data-testid="total-owed">
                {formatOwedAmount(result.totalOwed)}
              </td>
              <td colSpan={2} className="px-3 py-3 text-xs font-normal text-zinc-500">
                Total del filtro actual
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {pages > 1 && (
        <nav
          aria-label="Paginación de pagos pendientes"
          className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800"
        >
          <button
            type="button"
            onClick={() => onPageChange(result.page - 1)}
            disabled={loading || result.page <= 1}
            className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium disabled:opacity-40 dark:border-zinc-700"
          >
            Anterior
          </button>
          <span className="text-zinc-600 dark:text-zinc-300">
            Página {result.page} de {pages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(result.page + 1)}
            disabled={loading || result.page >= pages}
            className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium disabled:opacity-40 dark:border-zinc-700"
          >
            Siguiente
          </button>
        </nav>
      )}
    </section>
  );
}
