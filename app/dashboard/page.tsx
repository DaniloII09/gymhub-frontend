import Link from "next/link";
import { LogoutButton } from "../logout-button";
import { SessionInfo } from "../session-info";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-4xl font-semibold">GymHub</h1>
      <SessionInfo />
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/classes"
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 transition-colors"
        >
          📅 Calendario de Clases Grupales
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
}
