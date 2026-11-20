import Link from "next/link";
import { TrainerRoleGuard } from "@/src/components/trainer/trainer-role-guard";
import { LogoutButton } from "../logout-button";

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  return (
    <TrainerRoleGuard>
      <div className="flex flex-1 flex-col">
        <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/dashboard" className="text-lg font-semibold text-zinc-900 dark:text-white">
              GymHub · Entrenador
            </Link>
            <div className="flex items-center gap-2">
              <LogoutButton />
            </div>
          </div>
        </nav>
        <div className="flex flex-1">{children}</div>
      </div>
    </TrainerRoleGuard>
  );
}
