import { formatGymShortDate, formatGymTimeRange } from "@/src/lib/gym-datetime";
import {
  REVIEW_COMMENT_MAX,
  REVIEW_TARGET_LABELS,
  type PendingReviewItem,
} from "@/src/types/reviews";
import {
  EMPTY_PENDING_REVIEWS_MESSAGE,
  formatReviewDeadline,
  pendingReviewKey,
  type ReviewFormErrors,
} from "./pending-reviews-logic";

export interface PendingReviewsViewProps {
  items: PendingReviewItem[];
  loading: boolean;
  loadError: string | null;
  selectedKey: string | null;
  rating: number | null;
  comment: string;
  formErrors: ReviewFormErrors;
  submitError: string | null;
  submittingKey: string | null;
  successMessage: string | null;
  onRetry: () => void;
  onStartReview: (item: PendingReviewItem) => void;
  onCancelReview: () => void;
  onSelectRating: (value: number) => void;
  onChangeComment: (value: string) => void;
  onSubmitReview: (item: PendingReviewItem) => void;
}

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

/** Vista presentacional de «Por calificar» (H22 · FE-22.1), sin estado propio. */
export function PendingReviewsView({
  items,
  loading,
  loadError,
  selectedKey,
  rating,
  comment,
  formErrors,
  submitError,
  submittingKey,
  successMessage,
  onRetry,
  onStartReview,
  onCancelReview,
  onSelectRating,
  onChangeComment,
  onSubmitReview,
}: PendingReviewsViewProps) {
  const commentLength = comment.trim().length;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Por calificar
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Califica con estrellas y un comentario opcional las clases grupales y sesiones
            personales a las que asististe en los últimos 7 días.
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          disabled={loading || submittingKey !== null}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Actualizar
        </button>
      </div>

      {successMessage && (
        <p
          role="status"
          className="rounded-xl border border-emerald-500/40 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          {successMessage}
        </p>
      )}

      {loadError && (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
        >
          <p>{loadError}</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-zinc-900 dark:text-red-300"
          >
            Reintentar
          </button>
        </div>
      )}

      {loading && !loadError && (
        <p
          role="status"
          className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900"
        >
          Cargando elementos por calificar...
        </p>
      )}

      {!loading && !loadError && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          {EMPTY_PENDING_REVIEWS_MESSAGE}
        </div>
      )}

      {!loading && !loadError && items.length > 0 && (
        <ul className="flex flex-col gap-4">
          {items.map((item) => {
            const key = pendingReviewKey(item);
            const isSelected = selectedKey === key;
            const isSubmitting = submittingKey === key;
            const anySubmitting = submittingKey !== null;

            return (
              <li
                key={key}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {REVIEW_TARGET_LABELS[item.targetType]}
                    </span>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      Entrenador:{" "}
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {item.trainerName}
                      </span>
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Realizada: {formatGymShortDate(item.startsAt)} ·{" "}
                      {formatGymTimeRange(item.startsAt, item.endsAt)}
                    </p>
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      Fecha límite para calificar: {formatReviewDeadline(item.reviewDeadline)}
                    </p>
                  </div>

                  {!isSelected && (
                    <button
                      type="button"
                      disabled={anySubmitting}
                      onClick={() => onStartReview(item)}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      Calificar
                    </button>
                  )}
                </div>

                {isSelected && (
                  <form
                    noValidate
                    onSubmit={(event) => {
                      event.preventDefault();
                      onSubmitReview(item);
                    }}
                    className="mt-4 space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-800"
                  >
                    <div>
                      <span
                        id={`rating-label-${key}`}
                        className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
                      >
                        Calificación (1 a 5 estrellas)
                      </span>
                      <div
                        role="radiogroup"
                        aria-labelledby={`rating-label-${key}`}
                        className="mt-2 flex flex-wrap items-center gap-2"
                      >
                        {STAR_VALUES.map((star) => {
                          const active = rating !== null && star <= rating;
                          const exact = rating === star;
                          return (
                            <button
                              key={star}
                              type="button"
                              role="radio"
                              aria-checked={exact}
                              aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
                              disabled={isSubmitting}
                              onClick={() => onSelectRating(star)}
                              className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
                                active
                                  ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-950/50 dark:text-amber-300"
                                  : "border-zinc-300 bg-white text-zinc-500 hover:border-amber-300 hover:text-amber-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400"
                              }`}
                            >
                              <span aria-hidden>{active ? "★" : "☆"}</span>
                              <span>{star}</span>
                            </button>
                          );
                        })}
                      </div>
                      {formErrors.rating && (
                        <p role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                          {formErrors.rating}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor={`comment-${key}`}
                          className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                        >
                          Comentario (opcional)
                        </label>
                        <span
                          className={`text-xs ${
                            commentLength > REVIEW_COMMENT_MAX
                              ? "font-semibold text-red-600 dark:text-red-400"
                              : "text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          {commentLength}/{REVIEW_COMMENT_MAX} caracteres
                        </span>
                      </div>
                      <textarea
                        id={`comment-${key}`}
                        name="comment"
                        rows={3}
                        disabled={isSubmitting}
                        value={comment}
                        onChange={(event) => onChangeComment(event.target.value)}
                        aria-invalid={formErrors.comment ? true : undefined}
                        placeholder="Cuéntanos cómo fue tu experiencia con la clase o sesión..."
                        className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 aria-invalid:border-red-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                      {formErrors.comment && (
                        <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {formErrors.comment}
                        </p>
                      )}
                    </div>

                    {submitError && (
                      <p
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                      >
                        {submitError}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onCancelReview}
                        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting ? "Enviando..." : "Enviar calificación"}
                      </button>
                    </div>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
