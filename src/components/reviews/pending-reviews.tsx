"use client";

import { useEffect, useRef, useState } from "react";
import { AccessDenied } from "@/src/components/access-denied";
import {
  createReview,
  fetchPendingReviews,
} from "@/src/services/reviews/reviews-service";
import type { PendingReviewItem } from "@/src/types/reviews";
import {
  pendingReviewKey,
  REVIEW_SAVED_MESSAGE,
  validateReviewForm,
  type ReviewFormErrors,
} from "./pending-reviews-logic";
import { PendingReviewsView } from "./pending-reviews-view";

/** Pantalla «Por calificar» del miembro (H22 · FE-22.1). */
export function PendingReviews() {
  const [items, setItems] = useState<PendingReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [formErrors, setFormErrors] = useState<ReviewFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Candado síncrono contra envíos dobles antes del siguiente render de React.
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetchPendingReviews().then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.ok) {
        setItems(res.data);
        setLoadError(null);
        return;
      }
      if (res.status === 403) {
        setDenied(true);
        return;
      }
      setLoadError(res.error);
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function handleRetry() {
    setLoading(true);
    setLoadError(null);
    setReloadKey((k) => k + 1);
  }

  function resetDraft() {
    setRating(null);
    setComment("");
    setFormErrors({});
    setSubmitError(null);
  }

  function handleStartReview(item: PendingReviewItem) {
    if (submittingRef.current) return;
    setSelectedKey(pendingReviewKey(item));
    setSuccessMessage(null);
    resetDraft();
  }

  function handleCancelReview() {
    if (submittingRef.current) return;
    setSelectedKey(null);
    resetDraft();
  }

  function handleSelectRating(value: number) {
    setRating(value);
    setFormErrors((prev) => ({ ...prev, rating: undefined }));
    setSubmitError(null);
  }

  function handleChangeComment(value: string) {
    setComment(value);
    setFormErrors((prev) => ({ ...prev, comment: undefined }));
    setSubmitError(null);
  }

  async function handleSubmitReview(item: PendingReviewItem) {
    if (submittingRef.current) return;
    const errors = validateReviewForm(rating, comment);
    if (errors) {
      setFormErrors(errors);
      setSubmitError(null);
      return;
    }
    if (rating === null) return;

    const key = pendingReviewKey(item);
    submittingRef.current = true;
    setSubmittingKey(key);
    setFormErrors({});
    setSubmitError(null);
    setSuccessMessage(null);

    const res = await createReview({
      targetType: item.targetType,
      targetId: item.targetId,
      rating,
      comment,
    });

    submittingRef.current = false;
    setSubmittingKey(null);

    if (!res.ok) {
      setSubmitError(res.error);
      return;
    }

    setItems((prev) => prev.filter((candidate) => pendingReviewKey(candidate) !== key));
    setSelectedKey(null);
    resetDraft();
    setSuccessMessage(REVIEW_SAVED_MESSAGE);
  }

  if (denied) return <AccessDenied />;

  return (
    <PendingReviewsView
      items={items}
      loading={loading}
      loadError={loadError}
      selectedKey={selectedKey}
      rating={rating}
      comment={comment}
      formErrors={formErrors}
      submitError={submitError}
      submittingKey={submittingKey}
      successMessage={successMessage}
      onRetry={handleRetry}
      onStartReview={handleStartReview}
      onCancelReview={handleCancelReview}
      onSelectRating={handleSelectRating}
      onChangeComment={handleChangeComment}
      onSubmitReview={(item) => {
        void handleSubmitReview(item);
      }}
    />
  );
}
