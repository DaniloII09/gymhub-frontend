"use client";

import { useEffect, useRef, useState } from "react";
import { lookupMembers, registerCheckIn } from "@/src/services/check-ins/check-ins-service";
import type { CheckInMember } from "@/src/types/check-ins";
import {
  applyCheckInFailure,
  applyCheckInSuccess,
  applyExceptionReasonChange,
  applySelectMember,
  applyTermChange,
  INITIAL_CHECK_IN_STATE,
  LOOKUP_DEBOUNCE_MS,
  prepareCheckInSubmission,
  shouldLookup,
} from "./check-in-logic";
import { CheckInView } from "./check-in-view";

/** Check-in en recepción (H13 · FE-13.1, H14 · FE-14.1). */
export function CheckInScreen() {
  const inputRef = useRef<HTMLInputElement>(null);
  // Evita envíos dobles antes de que React repinte el estado `registering`.
  const sendingRef = useRef(false);
  const [state, setState] = useState(INITIAL_CHECK_IN_STATE);

  // Busca 400 ms después de dejar de escribir; con menos de 2 caracteres no busca.
  useEffect(() => {
    if (!shouldLookup(state.term) || state.selected) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, searching: true }));
      lookupMembers(state.term).then((res) => {
        if (cancelled) return;
        setState((prev) =>
          res.ok
            ? { ...prev, searching: false, results: res.data, searchError: null }
            : { ...prev, searching: false, results: [], searchError: res.error },
        );
      });
    }, LOOKUP_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [state.term, state.selected]);

  function handleTermChange(next: string) {
    setState((prev) => applyTermChange(prev, next));
  }

  function handleSelect(member: CheckInMember) {
    setState((prev) => applySelectMember(prev, member));
  }

  function handleExceptionReasonChange(next: string) {
    setState((prev) => applyExceptionReasonChange(prev, next));
  }

  async function handleRegister() {
    if (!state.selected || sendingRef.current) return;

    const submission = prepareCheckInSubmission(state.selected, state.exceptionReason);
    if (!submission.ok) {
      setState((prev) => ({ ...prev, reasonError: submission.reasonError, error: null }));
      return;
    }

    sendingRef.current = true;
    setState((prev) => ({ ...prev, registering: true, reasonError: null, error: null }));
    try {
      const res = await registerCheckIn(submission.memberId, submission.exceptionReason);
      if (!res.ok) {
        setState((prev) => applyCheckInFailure(prev, res.error));
        return;
      }
      // Éxito: limpia el buscador, el motivo y devuelve el foco para el siguiente miembro.
      setState((prev) => applyCheckInSuccess(prev, res.data));
      requestAnimationFrame(() => inputRef.current?.focus());
    } finally {
      sendingRef.current = false;
    }
  }

  return (
    <CheckInView
      term={state.term}
      inputRef={inputRef}
      results={state.results}
      searching={state.searching}
      searchError={state.searchError}
      selected={state.selected}
      exceptionReason={state.exceptionReason}
      reasonError={state.reasonError}
      registering={state.registering}
      success={state.success}
      error={state.error}
      onTermChange={handleTermChange}
      onSelect={handleSelect}
      onExceptionReasonChange={handleExceptionReasonChange}
      onRegister={handleRegister}
    />
  );
}
