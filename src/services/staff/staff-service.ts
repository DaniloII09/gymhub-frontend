import { apiJson } from "@/src/services/http/api-client";
import type { StaffAccount, StaffCreatedResponse, StaffPage } from "@/src/types/staff";

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function listStaffAccounts(
  page: number,
  pageSize: number = 20,
): Promise<ServiceResult<StaffPage>> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    const response = await apiJson<{
      data: StaffAccount[];
      pageSize: number;
      page: number;
      total: number;
    }>(`staff?${params.toString()}`);
    return { ok: true, data: response };
  } catch (error) {
    return { ok: false, error: "No se pudo cargar las cuentas del personal." };
  }
}

export type CreateStaffInput = {
  fullName: string;
  email: string;
  role: "TRAINER" | "RECEPTION" | "ADMIN";
};

export async function createStaffAccount(
  input: CreateStaffInput,
): Promise<ServiceResult<StaffCreatedResponse>> {
  try {
    const response = await apiJson<StaffCreatedResponse>("staff", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return { ok: true, data: response };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear la cuenta.";
    if (message.includes("409") || message.includes("Conflict")) {
      return { ok: false, error: "Ese correo ya está registrado." };
    }
    return { ok: false, error: "No se pudo crear la cuenta." };
  }
}

export async function deactivateStaffAccount(
  userId: string,
): Promise<ServiceResult<{ id: string; isActive: boolean }>> {
  try {
    const response = await apiJson<{ id: string; isActive: boolean }>(
      `users/${userId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ isActive: false }),
      },
    );
    return { ok: true, data: response };
  } catch (error) {
    return { ok: false, error: "No se pudo desactivar la cuenta." };
  }
}
