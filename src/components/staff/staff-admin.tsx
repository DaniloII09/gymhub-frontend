"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createStaffAccount,
  deactivateStaffAccount,
  listStaffAccounts,
} from "@/src/services/staff/staff-service";
import type { StaffAccount, StaffPage } from "@/src/types/staff";
import { DeactivateStaffDialog } from "./deactivate-staff-dialog";
import { StaffFormDialog, type StaffFormValues, type StaffFormErrors } from "./staff-form-dialog";
import {
  EMPTY_STAFF_FORM,
  validateStaffForm,
  STAFF_FORM_SAVED_MESSAGE,
} from "./staff-form-logic";
import { StaffTable } from "./staff-table";

type Editor = { mode: "create" };

const TOAST_MS = 4000;
const PAGE_SIZE = 20;

export function StaffAdmin() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<StaffPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [editor, setEditor] = useState<Editor | null>(null);
  const [values, setValues] = useState<StaffFormValues>(EMPTY_STAFF_FORM);
  const [errors, setErrors] = useState<StaffFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const [toDeactivate, setToDeactivate] = useState<StaffAccount | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listStaffAccounts(page, PAGE_SIZE).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setData(res.data);
        setLoadError(null);
      } else {
        setLoadError(res.error);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [page, reloadKey]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }

  function openEditor() {
    setEditor({ mode: "create" });
    setValues(EMPTY_STAFF_FORM);
    setErrors({});
    setServerError(null);
    setTemporaryPassword(null);
  }

  function handleChange(field: keyof StaffFormValues, value: string) {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError(null);
  }

  async function handleSubmit() {
    if (!editor) return;
    const found = validateStaffForm(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    setServerError(null);
    const result = await createStaffAccount(values);
    setSaving(false);

    if (!result.ok) {
      if (result.error.includes("correo")) {
        setErrors({ email: result.error });
      } else {
        setServerError(result.error);
      }
      return;
    }

    setTemporaryPassword(result.data.temporaryPassword);
  }

  function closeForm() {
    if (temporaryPassword) {
      setEditor(null);
      setValues(EMPTY_STAFF_FORM);
      setErrors({});
      setServerError(null);
      setTemporaryPassword(null);
      showToast(STAFF_FORM_SAVED_MESSAGE);
      reload();
    } else {
      setEditor(null);
    }
  }

  async function handleDeactivate() {
    if (!toDeactivate) return;
    setDeactivating(true);
    setDeactivateError(null);
    const result = await deactivateStaffAccount(toDeactivate.id);
    setDeactivating(false);
    if (!result.ok) {
      setDeactivateError(result.error);
      return;
    }
    setToDeactivate(null);
    showToast(`${toDeactivate.fullName} ha sido desactivado.`);
    reload();
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cuentas del Personal</h1>
          <p className="text-sm text-zinc-500">Gestiona los accesos de entrenadores, recepción y administradores.</p>
        </div>
        <button
          type="button"
          onClick={openEditor}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Nueva cuenta
        </button>
      </div>

      {toast && (
        <p
          role="status"
          className="rounded-lg border border-emerald-500/40 bg-emerald-50 px-4 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          {toast}
        </p>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <StaffTable
          accounts={data?.data ?? []}
          loading={loading}
          error={loadError}
          onRetry={reload}
          onDeactivate={(account) => {
            setDeactivateError(null);
            setToDeactivate(account);
          }}
        />
        {data && !loading && !loadError && (
          <div className="flex items-center justify-between border-t border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-800">
            <span>{data.total} cuentas</span>
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                aria-label="Página anterior"
                className="disabled:opacity-40"
              >
                ‹
              </button>
              {page} de {totalPages}
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                aria-label="Página siguiente"
                className="disabled:opacity-40"
              >
                ›
              </button>
            </span>
          </div>
        )}
      </div>

      {editor && (
        <StaffFormDialog
          values={values}
          errors={errors}
          saving={saving}
          serverError={serverError}
          temporaryPassword={temporaryPassword}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      )}

      {toDeactivate && (
        <DeactivateStaffDialog
          account={toDeactivate}
          busy={deactivating}
          error={deactivateError}
          onConfirm={handleDeactivate}
          onCancel={() => setToDeactivate(null)}
        />
      )}
    </div>
  );
}
