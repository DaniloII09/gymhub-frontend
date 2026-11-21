/** Reglas de presentación para promedios de calificación (H23 · FE-23.1). */

export type RatingsTab = "trainer" | "class";

export const LOW_RATING_THRESHOLD = 3.0;
export const NO_REVIEWS_IN_RANGE_MESSAGE = "No hay reseñas en ese rango.";

export const RATINGS_TAB_LABELS: Record<RatingsTab, string> = {
  trainer: "Por entrenador",
  class: "Por clase",
};

/** Promedio estrictamente menor a 3.0 se resalta como alerta. */
export function isLowRating(averageRating: number): boolean {
  return averageRating < LOW_RATING_THRESHOLD;
}

/** Formatea siempre con exactamente un decimal (ej. 3 -> "3.0"). */
export function formatRatingAverage(averageRating: number): string {
  return averageRating.toFixed(1);
}

export function reviewCountText(count: number): string {
  return count === 1 ? "1 reseña" : `${count} reseñas`;
}
