import { useEffect } from "react";

export type StaffFormValues = {
  fullName: string;
  email: string;
  role: "TRAINER" | "RECEPTION" | "ADMIN";
};

export type StaffFormErrors = Partial<Record<keyof StaffFormValues, string>>;

type StaffFormDialogProps = {
  values: StaffFormValues;
  errors: StaffFormErrors;
  saving: boolean;
  serverError: string | null;
  temporaryPassword: string | null;
  onChange: (field: keyof StaffFormValues, value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

const ROLE_OPTIONS = [
  { value: "TRAINER" as const, label: "Entrenador" },
  { value: "RECEPTION" as const, label: "Recepción" },
  { value: "ADMIN" as const, label: "Administrador" },
];

export function StaffFormDialog({
  values,
  errors,
  saving,
  serverError,
  temporaryPassword,
  onChange,
  onSubmit,
  onClose,
}: StaffFormDialogProps) {
  // Scroll al primer campo con error
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const firstError = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstError}"]`);
      element?.focus();
    }
  }, [errors]);

  if (temporaryPassword) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Cuenta creada exitosamente
            </h2>
          </div>

          <div className="space-y-4 px-6 py-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              La cuenta de <strong>{values.fullName}</strong> ha sido creada. Comparte esta
              contraseña temporal con el nuevo usuario:
            </p>

            <div className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="break-all font-mono text-sm font-semibold text-zinc-900 dark:text-white">
                {temporaryPassword}
              </p>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              El usuario deberá cambiar esta contraseña en su primer inicio de sesión.
            </p>
          </div>

          <div className="border-t border-zinc-200 px-6 py-4 text-right dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Nueva cuenta</h2>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4 px-6 py-4"
        >
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-zinc-900 dark:text-white">
              Nombre completo
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={values.fullName}
              onChange={(e) => onChange("fullName", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              placeholder="Juan Pérez"
            />
            {errors.fullName && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.fullName}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-900 dark:text-white">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={values.email}
              onChange={(e) => onChange("email", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              placeholder="juan@gym.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-zinc-900 dark:text-white">
              Rol
            </label>
            <select
              id="role"
              name="role"
              value={values.role}
              onChange={(e) => onChange("role", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="">Selecciona un rol</option>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.role && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.role}</p>}
          </div>

          {serverError && (
            <p className="text-xs text-red-600 dark:text-red-400">{serverError}</p>
          )}
        </form>

        <div className="border-t border-zinc-200 px-6 py-4 text-right dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="ml-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Creando..." : "Crear cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
}
