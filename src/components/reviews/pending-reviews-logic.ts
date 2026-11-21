import { formatEndDate } from "@/src/types/membership";
import {
  REVIEW_COMMENT_MAX,
  REVIEW_RATING_MAX,
  REVIEW_RATING_MIN,
  type PendingReviewItem,
} from "@/src/types/reviews";

export const RATING_REQUIRED_MESSAGE = "Elige una calificación de 1 a 5 estrellas.";
export const COMMENT_TOO_LONG_MESSAGE = "El comentario no puede superar los 500 caracteres.";
export const EMPTY_PENDING_REVIEWS_MESSAGE =
  "No tienes clases ni sesiones pendientes por calificar.";
export const REVIEW_SAVED_MESSAGE = "¡Gracias! Tu calificación fue registrada.";

export interface ReviewFormErrors {
  rating?: string;
  comment?: string;
}

/** Clave única por objetivo para controlar el formulario abierto y evitar duplicados. */
export function pendingReviewKey(
  item: Pick<PendingReviewItem, "targetType" | "targetId">,
): string {
  return `${item.targetType}-${item.targetId}`;
}

/** Formatea `AAAA-MM-DD` (zona horaria del gimnasio) como `DD/MM/AAAA`. */
export function formatReviewDeadline(reviewDeadline: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewDeadline)) return reviewDeadline;
  return formatEndDate(reviewDeadline);
}

/** Valida calificación obligatoria (1 a 5) y comentario opcional (máx. 500 tras recortar espacios). */
export function validateReviewForm(
  rating: number | null,
  comment: string,
): ReviewFormErrors | null {
  const errors: ReviewFormErrors = {};

  if (
    rating === null ||
    !Number.isInteger(rating) ||
    rating < REVIEW_RATING_MIN ||
    rating > REVIEW_RATING_MAX
  ) {
    errors.rating = RATING_REQUIRED_MESSAGE;
  }

  if (comment.trim().length > REVIEW_COMMENT_MAX) {
    errors.comment = COMMENT_TOO_LONG_MESSAGE;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
