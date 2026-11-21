import type { Metadata } from "next";
import Link from "next/link";
import { MemberRoleGuard } from "@/src/components/member/member-role-guard";
import { PendingReviews } from "@/src/components/reviews/pending-reviews";

export const metadata: Metadata = {
  title: "Por calificar · GymHub",
  description: "Califica las clases grupales y sesiones personales a las que asististe.",
};

/** H22 · FE-22.1. Lista de clases y sesiones pendientes de calificación del miembro. */
export default function MemberPendingReviewsPage() {
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
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Por calificar</span>
        </nav>
        <PendingReviews />
      </div>
    </MemberRoleGuard>
  );
}
