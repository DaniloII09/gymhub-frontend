/** Tipos para reseñas y calificaciones de clases y sesiones (H22 · SCRUM-146). */

export type ReviewTargetType = "CLASS" | "PERSONAL_SESSION";

export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 5;
export const REVIEW_COMMENT_MAX = 500;

export const REVIEW_TARGET_LABELS: Record<ReviewTargetType, string> = {
  CLASS: "Clase grupal",
  PERSONAL_SESSION: "Sesión personal",
};

/** Elemento elegible entregado por GET /api/v1/reviews/pending. */
export interface PendingReviewItem {
  targetType: ReviewTargetType;
  targetId: number;
  title: string;
  trainerId: string;
  trainerName: string;
  startsAt: string;
  endsAt: string;
  /** Último día en la zona del gimnasio (AAAA-MM-DD) para calificar. */
  reviewDeadline: string;
}

/** Cuerpo de POST /api/v1/reviews. */
export interface CreateReviewInput {
  targetType: ReviewTargetType;
  targetId: number;
  rating: number;
  comment?: string;
}

/** Reseña registrada devuelta por POST /api/v1/reviews. */
export interface ReviewRecord {
  id: number;
  targetType: ReviewTargetType;
  targetId: number;
  title: string;
  trainerId: string;
  trainerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}
