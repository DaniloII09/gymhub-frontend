import type { Metadata } from "next";
import Link from "next/link";
import { RoleGate } from "@/src/components/auth/role-gate";
import { IncomeReport } from "@/src/components/reports/income-report";

export const metadata: Metadata = {
  title: "Ingresos del periodo",
};

/** H29 · FE-29.1. Reporte de ingresos de un periodo (Administrador). */
export default function AdminIncomeReportPage() {
  return (
    <RoleGate roles={["ADMIN"]}>
      <div className="flex flex-1 flex-col">
        <nav className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 pt-4 text-sm text-zinc-500 sm:px-6 sm:pt-6">
          <Link href="/dashboard" className="hover:text-zinc-800 dark:hover:text-zinc-200">
            Inicio
          </Link>
          <span>/</span>
          <span>Reportes</span>
          <span>/</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Ingresos</span>
        </nav>
        <IncomeReport />
      </div>
    </RoleGate>
  );
}
