import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TrainerRoleGuard } from "@/src/components/trainer/trainer-role-guard";
import { TrainerRoutinesEntry } from "@/src/components/routines/trainer-routines-entry";

export const metadata: Metadata = {
  title: "Rutinas · GymHub",
  description: "Asigna y edita rutinas de entrenamiento para los miembros.",
};

/** H18 · FE-18.1. Asignación y edición de rutinas (solo Entrenador). */
export default function TrainerRoutinesPage() {
  return (
    <TrainerRoleGuard>
      <div className="flex flex-1 flex-col">
        <nav
          aria-label="Migas de pan"
          className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 pt-4 text-sm text-zinc-500 sm:px-6 sm:pt-6"
        >
          <Link href="/dashboard" className="hover:text-zinc-800 dark:hover:text-zinc-200">
            Inicio
          </Link>
          <span aria-hidden>/</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Rutinas</span>
        </nav>
        <Suspense
          fallback={
            <p role="status" className="mx-auto w-full max-w-6xl p-6 text-sm text-zinc-500">
              Cargando rutinas...
            </p>
          }
        >
          <TrainerRoutinesEntry />
        </Suspense>
      </div>
    </TrainerRoleGuard>
  );
}
