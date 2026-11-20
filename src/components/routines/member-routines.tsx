"use client";

import { useEffect, useState } from "react";
import { AccessDenied } from "@/src/components/access-denied";
import { fetchMyRoutines } from "@/src/services/routines/routines-service";
import type { RoutineRecord } from "@/src/types/routines";
import { MemberRoutinesView } from "./member-routines-view";

/** Contenedor «Mi rutina» de solo lectura para MEMBER (H18 · FE-18.2). */
export function MemberRoutines() {
  const [routines, setRoutines] = useState<RoutineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchMyRoutines().then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.ok) {
        setRoutines(res.data);
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

  if (denied) return <AccessDenied />;

  return (
    <MemberRoutinesView
      routines={routines}
      loading={loading}
      loadError={loadError}
      onRetry={handleRetry}
    />
  );
}
