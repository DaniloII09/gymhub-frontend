"use client";

import Link from "next/link";
import { useRole } from "@/src/stores/useAuthStore";

/** Acceso a la inscripción desde el tablero, solo para Recepción y Administrador. */
export function EnrollMemberLink() {
  const role = useRole();
  if (role !== "RECEPTION" && role !== "ADMIN") return null;

  return (
    <Link
      href="/recepcion/miembros/nuevo"
      className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 transition-colors"
    >
      Inscribir miembro
    </Link>
  );
}
