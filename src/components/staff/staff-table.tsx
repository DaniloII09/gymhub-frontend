import type { StaffAccount } from "@/src/types/staff";

type StaffTableProps = {
  accounts: StaffAccount[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onDeactivate: (account: StaffAccount) => void;
};

const ROLE_LABELS = {
  TRAINER: "Entrenador",
  RECEPTION: "Recepción",
  ADMIN: "Administrador",
};

export function StaffTable({
  accounts,
  loading,
  error,
  onRetry,
  onDeactivate,
}: StaffTableProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-sm text-zinc-500">Cargando...</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-sm text-zinc-500">Sin cuentas de personal registradas.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
              Nombre
            </th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
              Correo
            </th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
              Rol
            </th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
              Estado
            </th>
            <th className="px-4 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr
              key={account.id}
              className="border-b border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
            >
              <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{account.fullName}</td>
              <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{account.email}</td>
              <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                {ROLE_LABELS[account.role]}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    account.isActive
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                      : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {account.isActive ? "Activa" : "Inactiva"}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onDeactivate(account)}
                  disabled={!account.isActive}
                  className="text-sm text-red-600 hover:underline disabled:text-zinc-400 dark:text-red-400 dark:disabled:text-zinc-600"
                >
                  Desactivar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
