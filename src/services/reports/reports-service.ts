import { ACCESS_DENIED_MESSAGE } from "@/src/components/access-denied";
import { apiFetch } from "@/src/services/http/api-client";
import { readErrorMessage } from "@/src/services/http/error-message";
import type { IncomeReport } from "@/src/types/reports";
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
