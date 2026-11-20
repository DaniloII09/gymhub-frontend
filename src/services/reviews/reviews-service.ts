import { ACCESS_DENIED_MESSAGE } from "@/src/components/access-denied";
import { apiFetch } from "@/src/services/http/api-client";
import { readErrorMessage } from "@/src/services/http/error-message";
import type {
  CreateReviewInput,
  PendingReviewItem,
  ReviewRecord,
} from "@/src/types/reviews";
import type { ServiceResult } from "@/src/types/service-result";

export const LOAD_PENDING_REVIEWS_ERROR =
  "No pudimos cargar tus clases y sesiones por calificar. Intenta de nuevo.";
export const CREATE_REVIEW_ERROR =
  "No pudimos guardar tu calificación. Intenta de nuevo.";

/**
 * GET /reviews/pending (H22 · BE-22.1, solo Miembro).
 *
 * Entrega las clases grupales y sesiones personales calificables ya filtradas
 * por el servidor.
 */
export async function fetchPendingReviews(): Promise<ServiceResult<PendingReviewItem[]>> {
  try {
    const res = await apiFetch("reviews/pending");
    if (res.ok) {
      const body = (await res.json()) as { data: PendingReviewItem[] };
      return { ok: true, data: body.data, status: res.status };
    }
    if (res.status === 403) {
      return { ok: false, error: ACCESS_DENIED_MESSAGE, status: 403 };
    }
    return { ok: false, error: LOAD_PENDING_REVIEWS_ERROR, status: res.status };
  } catch {
    return { ok: false, error: LOAD_PENDING_REVIEWS_ERROR, status: 0 };
  }
}

/**
 * POST /reviews (H22 · BE-22.2, solo Miembro).
 *
 * Respeta y devuelve los mensajes reales del backend para:
 * - 400: estrellas o comentario fuera de rango.
 * - 403: sesión no realizada (p. ej. NO_SHOW) o rol sin permiso.
 * - 404: clase o sesión no encontrada.
 * - 409: falta de asistencia, clase/sesión aún no terminada, plazo vencido o reseña duplicada.
 */
export async function createReview(
  input: CreateReviewInput,
): Promise<ServiceResult<ReviewRecord>> {
  const trimmedComment = input.comment?.trim() ?? "";
  const payload: CreateReviewInput = {
    targetType: input.targetType,
    targetId: input.targetId,
    rating: input.rating,
    ...(trimmedComment.length > 0 ? { comment: trimmedComment } : {}),
  };

  try {
    const res = await apiFetch("reviews", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.status === 201 || res.ok) {
      return { ok: true, data: (await res.json()) as ReviewRecord, status: res.status };
    }

    if (res.status === 400 || res.status === 403 || res.status === 404 || res.status === 409) {
      const message = await readErrorMessage(res);
      if (message) {
        return { ok: false, error: message, status: res.status };
      }
      if (res.status === 403) {
        return { ok: false, error: ACCESS_DENIED_MESSAGE, status: 403 };
      }
    }

    return { ok: false, error: CREATE_REVIEW_ERROR, status: res.status };
  } catch {
    return { ok: false, error: CREATE_REVIEW_ERROR, status: 0 };
  }
}
