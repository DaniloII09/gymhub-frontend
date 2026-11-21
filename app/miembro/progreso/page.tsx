import type { Metadata } from "next";
import Link from "next/link";
import { MemberRoleGuard } from "@/src/components/member/member-role-guard";
import { MyProgress } from "@/src/components/progress/my-progress";

export const metadata: Metadata = {
  title: "Mi progreso · GymHub",
  description: "Registra tu peso y medidas corporales y consulta tu evolución.",
};

/** H19 · FE-19.1 y FE-19.2. Progreso corporal del miembro autenticado. */
export default function MemberProgressPage() {
  return (
    <MemberRoleGuard>
      <div className="flex flex-1 flex-col">
        <nav
          aria-label="Migas de pan"
          className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 pt-4 text-sm text-zinc-500 sm:px-6 sm:pt-6"
        >
          <Link href="/dashboard" className="hover:text-zinc-800 dark:hover:text-zinc-200">
            Inicio
          </Link>
          <span aria-hidden>/</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Mi progreso</span>
        </nav>
        <MyProgress />
      </div>
    </MemberRoleGuard>
  );
}
