import type { Metadata } from "next";
import Link from "next/link";
import { AdminRoleGuard } from "@/src/components/admin/admin-role-guard";
import { RatingsReport } from "@/src/components/reports/ratings-report";

export const metadata: Metadata = {
  title: "Promedios de calificación · GymHub",
  description: "Consulta los promedios de calificación por entrenador y por clase.",
};

/** H23 · FE-23.1. Promedios de calificación para Administrador. */
export default function AdminRatingsReportPage() {
  return (
    <AdminRoleGuard>
      <div className="flex flex-1 flex-col">
        <nav
          aria-label="Migas de pan"
          className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 pt-4 text-sm text-zinc-500 sm:px-6 sm:pt-6"
        >
          <Link href="/dashboard" className="hover:text-zinc-800 dark:hover:text-zinc-200">
            Inicio
          </Link>
          <span aria-hidden>/</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            Promedios de calificación
          </span>
        </nav>
        <RatingsReport />
      </div>
    </AdminRoleGuard>
  );
}
