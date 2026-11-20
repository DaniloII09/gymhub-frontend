import { ACCESS_DENIED_MESSAGE } from "@/src/components/access-denied";
import { apiFetch } from "@/src/services/http/api-client";
import { readErrorMessage } from "@/src/services/http/error-message";
import type { PendingChargeFilterType, PendingChargesPage } from "@/src/types/payments";
import type { ServiceResult } from "@/src/types/service-result";

export const LOAD_PENDING_CHARGES_ERROR =
  "No pudimos cargar los pagos pendientes. Intenta de nuevo.";

/**
 * GET /charges/pending?page=&type= (H17 · BE-17.1, solo Administrador).
 * Devuelve hasta 20 cobros ordenados por días de atraso y nombre, más `totalOwed` del filtro.
 */
export async function fetchAllPendingCharges(
  page = 1,
  type?: PendingChargeFilterType,
): Promise<ServiceResult<PendingChargesPage>> {
  try {
    const params = new URLSearchParams({ page: String(page) });
    if (type) params.set("type", type);
    const res = await apiFetch(`charges/pending?${params.toString()}`);
    if (res.ok) {
      return { ok: true, data: (await res.json()) as PendingChargesPage, status: res.status };
    }
    if (res.status === 403) return { ok: false, error: ACCESS_DENIED_MESSAGE, status: 403 };
    if (res.status === 400) {
      return {
        ok: false,
        error: (await readErrorMessage(res)) ?? LOAD_PENDING_CHARGES_ERROR,
        status: 400,
      };
    }
    return { ok: false, error: LOAD_PENDING_CHARGES_ERROR, status: res.status };
  } catch {
    return { ok: false, error: LOAD_PENDING_CHARGES_ERROR, status: 0 };
  }
}
