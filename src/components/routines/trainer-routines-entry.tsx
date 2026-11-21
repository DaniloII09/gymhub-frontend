"use client";

import { useSearchParams } from "next/navigation";
import { TrainerRoutines } from "./trainer-routines";

/** Lee `?editId=` de forma segura bajo `<Suspense>` para enlaces directos de edición. */
export function TrainerRoutinesEntry() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("editId");
  const parsed = raw && /^\d+$/.test(raw) ? Number(raw) : null;
  const initialEditId = parsed && Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  return <TrainerRoutines key={initialEditId ?? "default"} initialEditId={initialEditId} />;
}
