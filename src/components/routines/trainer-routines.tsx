"use client";

import { useEffect, useRef, useState } from "react";
import { AccessDenied } from "@/src/components/access-denied";
import {
  createRoutine,
  deleteRoutine,
  fetchTrainerRoutines,
  updateRoutine,
} from "@/src/services/routines/routines-service";
import { fetchTrainerAgenda } from "@/src/services/trainers/trainer-agenda-service";
import {
  ROUTINE_EXERCISES_MAX,
  type RoutineMemberOption,
  type RoutineRecord,
} from "@/src/types/routines";
import {
  collectTrainerMembers,
  createEmptyRoutineDraft,
  createExerciseDraft,
  draftFromRoutine,
  ROUTINE_CREATED_MESSAGE,
  ROUTINE_DELETED_MESSAGE,
  ROUTINE_UPDATED_MESSAGE,
  toggleRoutineDay,
  validateRoutineDraft,
  type ExerciseDraft,
  type RoutineDraft,
  type RoutineFormErrors,
} from "./routine-form-logic";
import { TrainerRoutinesView } from "./trainer-routines-view";

export interface TrainerRoutinesProps {
  /** Identificador opcional recibido por `?editId=` para abrir edición directa. */
  initialEditId?: number | null;
}

/** Gestor de rutinas para TRAINER (H18 · FE-18.1). */
export function TrainerRoutines({ initialEditId = null }: TrainerRoutinesProps) {
  const [routines, setRoutines] = useState<RoutineRecord[]>([]);
  const [memberOptions, setMemberOptions] = useState<RoutineMemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [editingId, setEditingId] = useState<number | null>(() =>
    initialEditId && initialEditId > 0 ? initialEditId : null,
  );
  const [draft, setDraft] = useState<RoutineDraft>(() => createEmptyRoutineDraft());
  const [errors, setErrors] = useState<RoutineFormErrors>({ exerciseRows: {} });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const savingRef = useRef(false);
  const deletingRef = useRef(false);
  const appliedInitialEditRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchTrainerRoutines(), fetchTrainerAgenda()]).then(
      ([routinesRes, agendaRes]) => {
        if (cancelled) return;
        setLoading(false);
        if (!routinesRes.ok) {
          if (routinesRes.status === 403) {
            setDenied(true);
            return;
          }
          setLoadError(routinesRes.error);
          return;
        }
        const loadedRoutines = routinesRes.data;
        const sessions = agendaRes.ok && agendaRes.data ? agendaRes.data : [];
        setRoutines(loadedRoutines);
        setMemberOptions(collectTrainerMembers(sessions, loadedRoutines));
        setLoadError(null);

        if (initialEditId && !appliedInitialEditRef.current) {
          appliedInitialEditRef.current = true;
          const match = loadedRoutines.find((r) => r.id === initialEditId);
          if (match) {
            setDraft(draftFromRoutine(match));
          }
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [reloadKey, initialEditId]);

  function handleRetry() {
    setLoading(true);
    setLoadError(null);
    setReloadKey((k) => k + 1);
  }

  function handleChangeName(value: string) {
    setDraft((prev) => ({ ...prev, name: value }));
    setErrors((prev) => ({ ...prev, name: undefined }));
    setSubmitError(null);
  }

  function handleChangeMemberId(value: string) {
    setDraft((prev) => ({ ...prev, memberId: value }));
    setErrors((prev) => ({ ...prev, memberId: undefined }));
    setSubmitError(null);
  }

  function handleToggleDay(day: number) {
    setDraft((prev) => ({ ...prev, daysOfWeek: toggleRoutineDay(prev.daysOfWeek, day) }));
    setErrors((prev) => ({ ...prev, daysOfWeek: undefined }));
    setSubmitError(null);
  }

  function handleAddExercise() {
    setDraft((prev) => {
      if (prev.exercises.length >= ROUTINE_EXERCISES_MAX) return prev;
      return { ...prev, exercises: [...prev.exercises, createExerciseDraft()] };
    });
    setErrors((prev) => ({ ...prev, exercises: undefined }));
    setSubmitError(null);
  }

  function handleRemoveExercise(index: number) {
    setDraft((prev) => {
      if (prev.exercises.length <= 1) return prev;
      return {
        ...prev,
        exercises: prev.exercises.filter((_, idx) => idx !== index),
      };
    });
    setErrors((prev) => ({ ...prev, exercises: undefined, exerciseRows: {} }));
    setSubmitError(null);
  }

  function handleChangeExercise(
    index: number,
    field: keyof Omit<ExerciseDraft, "key">,
    value: string,
  ) {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((row, idx) =>
        idx === index ? { ...row, [field]: value } : row,
      ),
    }));
    setErrors((prev) => {
      const currentRow = prev.exerciseRows[index];
      if (!currentRow) return prev;
      const nextRow = { ...currentRow, [field]: undefined };
      const remaining = Object.entries(nextRow).filter(([, msg]) => Boolean(msg));
      const nextRows = { ...prev.exerciseRows };
      if (remaining.length === 0) {
        delete nextRows[index];
      } else {
        nextRows[index] = nextRow;
      }
      return { ...prev, exerciseRows: nextRows };
    });
    setSubmitError(null);
  }

  function handleStartEdit(routine: RoutineRecord) {
    if (savingRef.current || deletingRef.current) return;
    setEditingId(routine.id);
    setDraft(draftFromRoutine(routine));
    setErrors({ exerciseRows: {} });
    setSubmitError(null);
    setSuccessMessage(null);
  }

  function handleCancelEdit() {
    if (savingRef.current) return;
    setEditingId(null);
    setDraft(createEmptyRoutineDraft());
    setErrors({ exerciseRows: {} });
    setSubmitError(null);
  }

  async function handleSubmit() {
    if (savingRef.current || deletingRef.current) return;
    const validation = validateRoutineDraft(draft);
    if (!validation.valid) {
      setErrors(validation.errors);
      setSubmitError(null);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setErrors({ exerciseRows: {} });
    setSubmitError(null);
    setSuccessMessage(null);

    const res =
      editingId !== null
        ? await updateRoutine(editingId, validation.payload)
        : await createRoutine(validation.payload);

    savingRef.current = false;
    setSaving(false);

    if (!res.ok) {
      setSubmitError(res.error);
      return;
    }

    const wasEdit = editingId !== null;
    setEditingId(null);
    setDraft(createEmptyRoutineDraft());
    setSuccessMessage(wasEdit ? ROUTINE_UPDATED_MESSAGE : ROUTINE_CREATED_MESSAGE);
    setLoading(true);
    setReloadKey((k) => k + 1);
  }

  async function handleConfirmDelete(routineId: number) {
    if (savingRef.current || deletingRef.current) return;
    deletingRef.current = true;
    setDeletingId(routineId);
    setSubmitError(null);
    setSuccessMessage(null);

    const res = await deleteRoutine(routineId);

    deletingRef.current = false;
    setDeletingId(null);
    setConfirmDeleteId(null);

    if (!res.ok) {
      setSubmitError(res.error);
      return;
    }

    if (editingId === routineId) {
      setEditingId(null);
      setDraft(createEmptyRoutineDraft());
      setErrors({ exerciseRows: {} });
    }
    setRoutines((prev) => prev.filter((item) => item.id !== routineId));
    setSuccessMessage(ROUTINE_DELETED_MESSAGE);
  }

  if (denied) return <AccessDenied />;

  return (
    <TrainerRoutinesView
      routines={routines}
      memberOptions={memberOptions}
      loading={loading}
      loadError={loadError}
      editingId={editingId}
      draft={draft}
      errors={errors}
      submitError={submitError}
      successMessage={successMessage}
      saving={saving}
      confirmDeleteId={confirmDeleteId}
      deletingId={deletingId}
      onRetry={handleRetry}
      onChangeName={handleChangeName}
      onChangeMemberId={handleChangeMemberId}
      onToggleDay={handleToggleDay}
      onAddExercise={handleAddExercise}
      onRemoveExercise={handleRemoveExercise}
      onChangeExercise={handleChangeExercise}
      onSubmit={() => {
        void handleSubmit();
      }}
      onStartEdit={handleStartEdit}
      onCancelEdit={handleCancelEdit}
      onRequestDelete={setConfirmDeleteId}
      onConfirmDelete={(id) => {
        void handleConfirmDelete(id);
      }}
    />
  );
}
