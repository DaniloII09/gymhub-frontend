import { ACCESS_DENIED_MESSAGE } from "@/src/components/access-denied";
import { apiFetch } from "@/src/services/http/api-client";
import { readErrorMessage } from "@/src/services/http/error-message";
import type { IncomeReport, OccupancyReport, RenewalRateReport } from "@/src/types/reports";
import type { ServiceResult } from "@/src/types/service-result";

export const LOAD_INCOME_REPORT_ERROR =
  "No pudimos cargar el reporte de ingresos. Intenta de nuevo.";

/**
 * GET /reports/income?from=&to= (H29 · BE-29.1, solo Administrador).
 *
 * - 400: el motivo del servidor (formato, fecha inexistente, orden o rango
 *   mayor a 12 meses).
 * - 403: acceso denegado.
 * - El resto: el mensaje genérico.
 */
export async function fetchIncomeReport(
  from: string,
  to: string,
): Promise<ServiceResult<IncomeReport>> {
  try {
    const params = new URLSearchParams({ from, to });
    const res = await apiFetch(`reports/income?${params.toString()}`);
    if (res.ok) {
      return { ok: true, data: (await res.json()) as IncomeReport, status: res.status };
    }
    if (res.status === 403) return { ok: false, error: ACCESS_DENIED_MESSAGE, status: 403 };
    if (res.status === 400) {
      const message = await readErrorMessage(res);
      return { ok: false, error: message ?? LOAD_INCOME_REPORT_ERROR, status: 400 };
    }
    return { ok: false, error: LOAD_INCOME_REPORT_ERROR, status: res.status };
  } catch {
    return { ok: false, error: LOAD_INCOME_REPORT_ERROR, status: 0 };
  }
}

export const LOAD_OCCUPANCY_REPORT_ERROR =
  "No pudimos cargar el reporte de ocupación. Intenta de nuevo.";
export const NO_CLASSES_MESSAGE = "No hay clases en ese rango.";

/**
 * GET /reports/occupancy?from=&to= (H28 · BE-28.1, solo Administrador).
 *
 * - 400: el motivo del servidor (formato, fecha inexistente, orden o rango
 *   mayor a 12 meses).
 * - 404: el rango no tiene clases terminadas; se devuelve el motivo.
 * - 403: acceso denegado.
 * - El resto: el mensaje genérico.
 */
export async function fetchOccupancyReport(
  from: string,
  to: string,
): Promise<ServiceResult<OccupancyReport>> {
  try {
    const params = new URLSearchParams({ from, to });
    const res = await apiFetch(`reports/occupancy?${params.toString()}`);
    if (res.ok) {
      return { ok: true, data: (await res.json()) as OccupancyReport, status: res.status };
    }
    if (res.status === 403) return { ok: false, error: ACCESS_DENIED_MESSAGE, status: 403 };
    if (res.status === 400) {
      const message = await readErrorMessage(res);
      return { ok: false, error: message ?? LOAD_OCCUPANCY_REPORT_ERROR, status: 400 };
    }
    if (res.status === 404) {
      const message = await readErrorMessage(res);
      return { ok: false, error: message ?? NO_CLASSES_MESSAGE, status: 404 };
    }
    return { ok: false, error: LOAD_OCCUPANCY_REPORT_ERROR, status: res.status };
  } catch {
    return { ok: false, error: LOAD_OCCUPANCY_REPORT_ERROR, status: 0 };
  }
}

export const LOAD_RENEWAL_RATE_REPORT_ERROR =
  "No pudimos cargar el reporte de tasa de renovación. Intenta de nuevo.";
export const NO_EXPIRED_MEMBERSHIPS_MESSAGE =
  "No hay membresías vencidas en ese rango.";

/**
 * GET /reports/renewal-rate?from=&to= (H30 · BE-30.1, solo Administrador).
 */
export async function fetchRenewalRateReport(
  from: string,
  to: string,
): Promise<ServiceResult<RenewalRateReport>> {
  try {
    const params = new URLSearchParams({ from, to });
    const res = await apiFetch(`reports/renewal-rate?${params.toString()}`);
    if (res.ok) {
      return { ok: true, data: (await res.json()) as RenewalRateReport, status: res.status };
    }
    if (res.status === 403) return { ok: false, error: ACCESS_DENIED_MESSAGE, status: 403 };
    if (res.status === 400) {
      const message = await readErrorMessage(res);
      return { ok: false, error: message ?? LOAD_RENEWAL_RATE_REPORT_ERROR, status: 400 };
    }
    return { ok: false, error: LOAD_RENEWAL_RATE_REPORT_ERROR, status: res.status };
  } catch {
    return { ok: false, error: LOAD_RENEWAL_RATE_REPORT_ERROR, status: 0 };
  }
}
