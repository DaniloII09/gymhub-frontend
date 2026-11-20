"use client";

import { useEffect, useRef, useState } from "react";
import { AccessDenied } from "@/src/components/access-denied";
import { getGymDateKey } from "@/src/lib/gym-datetime";
import {
  createProgressEntry,
  fetchMyProgress,
} from "@/src/services/progress/progress-service";
import type { ProgressEvolution } from "@/src/types/progress";
import {
  EMPTY_PROGRESS_DRAFT,
  validateProgressDraft,
  type ProgressDraft,
  type ProgressFieldErrors,
} from "./progress-logic";
import { ProgressView } from "./progress-view";

/** Contenedor de «Mi progreso» para MEMBER (H19 · FE-19.1 y FE-19.2). */
export function MyProgress() {
  const [evolution, setEvolution] = useState<ProgressEvolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [draft, setDraft] = useState<ProgressDraft>(EMPTY_PROGRESS_DRAFT);
  const [fieldErrors, setFieldErrors] = useState<ProgressFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const savingRef = useRef(false);
  const maxDate = getGymDateKey(new Date());

  useEffect(() => {
    let cancelled = false;
    fetchMyProgress().then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.ok) {
        setEvolution(res.data);
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

  function handleChangeField(field: keyof ProgressDraft, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError(null);
    setSavedNotice(false);
  }

  async function handleSubmit() {
    if (savingRef.current) return;
    const validation = validateProgressDraft(draft, new Date());
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setSubmitError(null);
      setSavedNotice(false);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setFieldErrors({});
    setSubmitError(null);
    setSavedNotice(false);

    const res = await createProgressEntry(validation.payload);

    savingRef.current = false;
    setSaving(false);

    if (!res.ok) {
      setSubmitError(res.error);
      return;
    }

    setDraft(EMPTY_PROGRESS_DRAFT);
    setSavedNotice(true);
    setLoading(true);
    setReloadKey((k) => k + 1);
  }

  if (denied) return <AccessDenied />;

  return (
    <ProgressView
      evolution={evolution}
      loading={loading}
      loadError={loadError}
      draft={draft}
      fieldErrors={fieldErrors}
      submitError={submitError}
      saving={saving}
      savedNotice={savedNotice}
      maxDate={maxDate}
      onRetry={handleRetry}
      onChangeField={handleChangeField}
      onSubmit={() => {
        void handleSubmit();
      }}
    />
  );
}
