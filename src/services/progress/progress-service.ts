import { ACCESS_DENIED_MESSAGE } from "@/src/components/access-denied";
import { apiFetch } from "@/src/services/http/api-client";
import { readErrorMessage } from "@/src/services/http/error-message";
import type {
  CreateProgressEntryInput,
  ProgressEntry,
  ProgressEvolution,
} from "@/src/types/progress";
import type { ServiceResult } from "@/src/types/service-result";

export const LOAD_PROGRESS_ERROR =
  "No pudimos cargar tu historial de progreso. Intenta de nuevo.";
export const CREATE_PROGRESS_ERROR =
  "No pudimos guardar tu registro de progreso. Intenta de nuevo.";
export const DUPLICATE_PROGRESS_DATE_MESSAGE =
  "Ya tienes un registro en esa fecha.";

/** GET /progress/me (H19 · BE-19.2, solo Miembro autenticado). */
export async function fetchMyProgress(): Promise<ServiceResult<ProgressEvolution>> {
  try {
    const res = await apiFetch("progress/me");
    if (res.ok) {
      return { ok: true, data: (await res.json()) as ProgressEvolution, status: res.status };
    }
    if (res.status === 403) {
      return { ok: false, error: ACCESS_DENIED_MESSAGE, status: 403 };
    }
    return { ok: false, error: LOAD_PROGRESS_ERROR, status: res.status };
  } catch {
    return { ok: false, error: LOAD_PROGRESS_ERROR, status: 0 };
  }
}

/**
 * POST /progress (H19 · BE-19.1, solo Miembro autenticado).
 *
 * - 400: fecha inválida/futura o valores fuera de rango.
 * - 403: acceso denegado.
 * - 409: fecha duplicada ("Ya tienes un registro en esa fecha.").
 */
export async function createProgressEntry(
  input: CreateProgressEntryInput,
): Promise<ServiceResult<ProgressEntry>> {
  try {
    const res = await apiFetch("progress", {
      method: "POST",
      body: JSON.stringify(input),
    });

    if (res.status === 201 || res.ok) {
      return { ok: true, data: (await res.json()) as ProgressEntry, status: res.status };
    }
    if (res.status === 403) {
      return { ok: false, error: ACCESS_DENIED_MESSAGE, status: 403 };
    }
    if (res.status === 409) {
      const message = await readErrorMessage(res);
      return { ok: false, error: message ?? DUPLICATE_PROGRESS_DATE_MESSAGE, status: 409 };
    }
    if (res.status === 400) {
      const message = await readErrorMessage(res);
      return { ok: false, error: message ?? CREATE_PROGRESS_ERROR, status: 400 };
    }
    return { ok: false, error: CREATE_PROGRESS_ERROR, status: res.status };
  } catch {
    return { ok: false, error: CREATE_PROGRESS_ERROR, status: 0 };
  }
}
