import { ACCESS_DENIED_MESSAGE } from "@/src/components/access-denied";
import { apiFetch } from "@/src/services/http/api-client";
import { readErrorMessage } from "@/src/services/http/error-message";
import type {
  CreateRoutineInput,
  RoutineRecord,
  UpdateRoutineInput,
} from "@/src/types/routines";
import type { ServiceResult } from "@/src/types/service-result";

export const LOAD_TRAINER_ROUTINES_ERROR =
  "No pudimos cargar tus rutinas asignadas. Intenta de nuevo.";
export const LOAD_MY_ROUTINES_ERROR =
  "No pudimos cargar tus rutinas. Intenta de nuevo.";
export const SAVE_ROUTINE_ERROR =
  "No pudimos guardar la rutina. Intenta de nuevo.";
export const DELETE_ROUTINE_ERROR =
  "No pudimos eliminar la rutina. Intenta de nuevo.";

/** GET /routines/trainer/me (solo Entrenador). */
export async function fetchTrainerRoutines(): Promise<ServiceResult<RoutineRecord[]>> {
  return fetchRoutineList("routines/trainer/me", LOAD_TRAINER_ROUTINES_ERROR);
}

/** GET /routines/me (solo Miembro). */
export async function fetchMyRoutines(): Promise<ServiceResult<RoutineRecord[]>> {
  return fetchRoutineList("routines/me", LOAD_MY_ROUTINES_ERROR);
}

/** POST /routines (solo Entrenador). */
export async function createRoutine(
  input: CreateRoutineInput,
): Promise<ServiceResult<RoutineRecord>> {
  return sendRoutine("routines", "POST", input, SAVE_ROUTINE_ERROR);
}

/** PATCH /routines/:routineId (solo Entrenador dueño). */
export async function updateRoutine(
  routineId: number,
  input: UpdateRoutineInput,
): Promise<ServiceResult<RoutineRecord>> {
  return sendRoutine(`routines/${routineId}`, "PATCH", input, SAVE_ROUTINE_ERROR);
}

/** DELETE /routines/:routineId (solo Entrenador dueño). */
export async function deleteRoutine(routineId: number): Promise<ServiceResult<void>> {
  try {
    const res = await apiFetch(`routines/${routineId}`, { method: "DELETE" });
    if (res.status === 204 || res.ok) {
      return { ok: true, data: undefined, status: res.status };
    }
    if (res.status === 403 || res.status === 404) {
      const message = await readErrorMessage(res);
      return {
        ok: false,
        error: message ?? (res.status === 403 ? ACCESS_DENIED_MESSAGE : DELETE_ROUTINE_ERROR),
        status: res.status,
      };
    }
    return { ok: false, error: DELETE_ROUTINE_ERROR, status: res.status };
  } catch {
    return { ok: false, error: DELETE_ROUTINE_ERROR, status: 0 };
  }
}

async function fetchRoutineList(
  endpoint: string,
  fallbackError: string,
): Promise<ServiceResult<RoutineRecord[]>> {
  try {
    const res = await apiFetch(endpoint);
    if (res.ok) {
      const body = (await res.json()) as { data: RoutineRecord[] };
      return { ok: true, data: body.data, status: res.status };
    }
    if (res.status === 403) {
      const message = await readErrorMessage(res);
      return { ok: false, error: message ?? ACCESS_DENIED_MESSAGE, status: 403 };
    }
    return { ok: false, error: fallbackError, status: res.status };
  } catch {
    return { ok: false, error: fallbackError, status: 0 };
  }
}

async function sendRoutine(
  endpoint: string,
  method: "POST" | "PATCH",
  body: CreateRoutineInput | UpdateRoutineInput,
  fallbackError: string,
): Promise<ServiceResult<RoutineRecord>> {
  try {
    const res = await apiFetch(endpoint, {
      method,
      body: JSON.stringify(body),
    });
    if (res.ok) {
      return { ok: true, data: (await res.json()) as RoutineRecord, status: res.status };
    }
    if (res.status === 400 || res.status === 403 || res.status === 404) {
      const message = await readErrorMessage(res);
      return {
        ok: false,
        error: message ?? (res.status === 403 ? ACCESS_DENIED_MESSAGE : fallbackError),
        status: res.status,
      };
    }
    return { ok: false, error: fallbackError, status: res.status };
  } catch {
    return { ok: false, error: fallbackError, status: 0 };
  }
}
