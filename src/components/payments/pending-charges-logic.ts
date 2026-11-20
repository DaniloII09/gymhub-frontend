import { formatUsdPrice } from "@/src/lib/gym-datetime";
import { CHARGE_TYPE_LABELS, type PendingChargeFilterType } from "@/src/types/payments";
import { formatDueDate } from "./register-payment-logic";

// Reglas de la tabla de pagos pendientes del Administrador (H17 · FE-17.1).

export const NO_PENDING_CHARGES_ADMIN_MESSAGE = "No hay pagos pendientes.";
export const CRITICAL_DAYS_LATE_THRESHOLD = 30;
export const PENDING_CHARGES_PAGE_SIZE = 20;

export type PendingChargeFilterState = "" | PendingChargeFilterType;

export const PENDING_CHARGE_FILTER_OPTIONS: ReadonlyArray<{
  value: PendingChargeFilterState;
  label: string;
}> = [
  { value: "", label: "Todos" },
  { value: "MEMBERSHIP", label: CHARGE_TYPE_LABELS.MEMBERSHIP },
  { value: "PERSONAL_SESSION", label: CHARGE_TYPE_LABELS.PERSONAL_SESSION },
];

export type PendingChargesQuery = {
  page: number;
  type: PendingChargeFilterState;
};

export const INITIAL_PENDING_CHARGES_QUERY: PendingChargesQuery = {
  page: 1,
  type: "",
};

/** Al cambiar el filtro por tipo siempre vuelve a la primera página. */
export function changePendingChargesFilter(
  _current: PendingChargesQuery,
  nextType: PendingChargeFilterState,
): PendingChargesQuery {
  return { page: 1, type: nextType };
}

/** Cambia de página manteniéndose dentro de los límites válidos [1, totalPagesCount]. */
export function changePendingChargesPage(
  current: PendingChargesQuery,
  nextPage: number,
  totalPagesCount: number,
): PendingChargesQuery {
  const maxPage = Math.max(1, totalPagesCount);
  const clamped = Math.min(Math.max(1, nextPage), maxPage);
  return { ...current, page: clamped };
}

/** Resalta únicamente los cobros con más de 30 días de atraso (31 o más). */
export function isCriticallyLate(daysLate: number): boolean {
  return daysLate > CRITICAL_DAYS_LATE_THRESHOLD;
}

/** Muestra los días de atraso enviados por el servidor sin recalcular fechas. */
export function daysLateText(daysLate: number): string {
  if (daysLate <= 0) return "0 días";
  return daysLate === 1 ? "1 día" : `${daysLate} días`;
}

export function memberCodeText(memberCode: string | null): string {
  return memberCode ?? "—";
}

export function formatOwedAmount(amount: number): string {
  return formatUsdPrice(amount);
}

export function formatChargeDueDate(dueDate: string): string {
  return formatDueDate(dueDate);
}

export function resultsCountText(total: number): string {
  return total === 1 ? "1 cobro pendiente" : `${total} cobros pendientes`;
}
