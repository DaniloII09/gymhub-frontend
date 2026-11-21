/** Reglas y formato para el reporte de tasa de renovación (H30 · FE-30.1). */

export const NO_RENEWAL_DATA_LABEL = "Sin datos";
export const EMPTY_RENEWAL_RANGE_MESSAGE = "No hay membresías vencidas en ese rango.";

/** Muestra "Sin datos" cuando no hay vencimientos; si los hay, porcentaje con 1 decimal. */
export function formatRenewalRate(
  renewalRate: number | null,
  expiredCount: number,
): string {
  if (expiredCount <= 0 || renewalRate === null) {
    return NO_RENEWAL_DATA_LABEL;
  }
  return `${renewalRate.toFixed(1)}%`;
}

/** Altura/ancho porcentual de la barra (0 cuando no hay vencimientos). */
export function renewalBarPercent(
  renewalRate: number | null,
  expiredCount: number,
): number {
  if (expiredCount <= 0 || renewalRate === null || renewalRate <= 0) return 0;
  return Math.min(100, Math.max(4, Math.round(renewalRate)));
}
