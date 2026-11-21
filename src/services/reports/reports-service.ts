import { ACCESS_DENIED_MESSAGE } from "@/src/components/access-denied";
import { apiFetch } from "@/src/services/http/api-client";
import { readErrorMessage } from "@/src/services/http/error-message";
import type { IncomeReport, OccupancyReport, RatingsReport } from "@/src/types/reports";
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
  return fetchAdminReport("reports/income", from, to, LOAD_INCOME_REPORT_ERROR);
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
  return fetchAdminReport("reports/occupancy", from, to, LOAD_OCCUPANCY_REPORT_ERROR, NO_CLASSES_MESSAGE);
}

export const LOAD_RATINGS_REPORT_ERROR =
  "No pudimos cargar los promedios de calificación. Intenta de nuevo.";
export const NO_REVIEWS_MESSAGE = "No hay reseñas en ese rango.";

/**
 * GET /reports/ratings?from=&to= (H23 · BE-23.1, solo Administrador).
 */
export async function fetchRatingsReport(
  from: string,
  to: string,
): Promise<ServiceResult<RatingsReport>> {
  return fetchAdminReport("reports/ratings", from, to, LOAD_RATINGS_REPORT_ERROR);
}

async function fetchAdminReport<T>(
  endpoint: string,
  from: string,
  to: string,
  fallbackError: string,
  notFoundFallback?: string,
): Promise<ServiceResult<T>> {
  try {
    const params = new URLSearchParams({ from, to });
    const res = await apiFetch(`${endpoint}?${params.toString()}`);
    if (res.ok) {
      return { ok: true, data: (await res.json()) as T, status: res.status };
    }
    if (res.status === 403) return { ok: false, error: ACCESS_DENIED_MESSAGE, status: 403 };
    if (res.status === 400) {
      const message = await readErrorMessage(res);
      return { ok: false, error: message ?? fallbackError, status: 400 };
    }
    if (res.status === 404 && notFoundFallback) {
      const message = await readErrorMessage(res);
      return { ok: false, error: message ?? notFoundFallback, status: 404 };
    }
    return { ok: false, error: fallbackError, status: res.status };
  } catch {
    return { ok: false, error: fallbackError, status: 0 };
  }
}
