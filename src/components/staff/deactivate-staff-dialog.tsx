import type { StaffAccount } from "@/src/types/staff";

type DeactivateStaffDialogProps = {
  account: StaffAccount;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeactivateStaffDialog({
  account,
  busy,
  error,
  onConfirm,
  onCancel,
}: DeactivateStaffDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Desactivar cuenta
          </h2>
        </div>

        <div className="space-y-4 px-6 py-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            ¿Estás seguro de que deseas desactivar la cuenta de <strong>{account.fullName}</strong>?
          </p>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Esta acción no se puede deshacer. El usuario no podrá iniciar sesión con esta cuenta.
          </p>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <div className="border-t border-zinc-200 px-6 py-4 text-right dark:border-zinc-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="ml-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
          >
            {busy ? "Desactivando..." : "Desactivar"}
          </button>
        </div>
      </div>
    </div>
  );
}
