import type { Metadata } from "next";
import Link from "next/link";
import { MemberRoleGuard } from "@/src/components/member/member-role-guard";
import { MemberRoutines } from "@/src/components/routines/member-routines";

export const metadata: Metadata = {
  title: "Mi rutina · GymHub",
  description: "Consulta tus rutinas de entrenamiento asignadas.",
};

/** H18 · FE-18.2. Consulta de rutinas en solo lectura para el miembro. */
export default function MemberRoutinesPage() {
  return (
    <MemberRoleGuard>
      <div className="flex flex-1 flex-col">
        <nav
          aria-label="Migas de pan"
          className="mx-auto flex w-full max-w-4xl items-center gap-2 px-4 pt-4 text-sm text-zinc-500 sm:px-6 sm:pt-6"
        >
          <Link href="/dashboard" className="hover:text-zinc-800 dark:hover:text-zinc-200">
            Inicio
          </Link>
          <span aria-hidden>/</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Mi rutina</span>
        </nav>
        <MemberRoutines />
      </div>
    </MemberRoleGuard>
  );
}
