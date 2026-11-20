import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StaffAdmin } from "./staff-admin";
import * as staffService from "@/src/services/staff/staff-service";

vi.mock("@/src/services/staff/staff-service");

describe("StaffAdmin Component - SCRUM-58", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Criterio 1: Tabla con nombre, correo, rol y estado, paginada de 20 en 20", () => {
    it("muestra la tabla con 20 registros por página", async () => {
      const mockAccounts = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        fullName: `Personal ${i}`,
        email: `personal${i}@gym.com`,
        role: (["TRAINER", "RECEPTION", "ADMIN"] as const)[i % 3],
        isActive: i % 2 === 0,
      }));

      vi.mocked(staffService.listStaffAccounts).mockResolvedValue({
        ok: true,
        data: {
          data: mockAccounts,
          pageSize: 20,
          page: 1,
          total: 25,
        },
      });

      render(<StaffAdmin />);

      await waitFor(() => {
        expect(screen.getByText("Personal 0")).toBeInTheDocument();
        expect(screen.getByText("Personal 19")).toBeInTheDocument();
      });

      expect(screen.getByText("25 cuentas")).toBeInTheDocument();
    });

    it("permite navegar entre páginas", async () => {
      const mockPage1 = {
        ok: true,
        data: {
          data: [
            {
              id: "1",
              fullName: "Juan Pérez",
              email: "juan@gym.com",
              role: "TRAINER" as const,
              isActive: true,
            },
          ],
          pageSize: 20,
          page: 1,
          total: 25,
        },
      };

      vi.mocked(staffService.listStaffAccounts).mockResolvedValue(mockPage1);

      const { rerender } = render(<StaffAdmin />);

      await waitFor(() => {
        expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
      });

      const nextButton = screen.getByLabelText("Página siguiente");
      fireEvent.click(nextButton);

      // La página debe cambiar y hacer una nueva petición
      await waitFor(() => {
        expect(staffService.listStaffAccounts).toHaveBeenCalledWith(2, 20);
      });
    });
  });

  describe("Criterio 2: Desactivar una cuenta pide confirmación", () => {
    it("muestra diálogo de confirmación antes de desactivar", async () => {
      const mockAccount = {
        id: "1",
        fullName: "Juan Pérez",
        email: "juan@gym.com",
        role: "TRAINER" as const,
        isActive: true,
      };

      vi.mocked(staffService.listStaffAccounts).mockResolvedValue({
        ok: true,
        data: {
          data: [mockAccount],
          pageSize: 20,
          page: 1,
          total: 1,
        },
      });

      render(<StaffAdmin />);

      await waitFor(() => {
        expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
      });

      const deactivateButton = screen.getByText("Desactivar");
      fireEvent.click(deactivateButton);

      await waitFor(() => {
        expect(
          screen.getByText(/¿Estás seguro de que deseas desactivar/),
        ).toBeInTheDocument();
      });
    });

    it("no desactiva si el usuario cancela", async () => {
      const mockAccount = {
        id: "1",
        fullName: "Juan Pérez",
        email: "juan@gym.com",
        role: "TRAINER" as const,
        isActive: true,
      };

      vi.mocked(staffService.listStaffAccounts).mockResolvedValue({
        ok: true,
        data: {
          data: [mockAccount],
          pageSize: 20,
          page: 1,
          total: 1,
        },
      });

      render(<StaffAdmin />);

      await waitFor(() => {
        expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
      });

      const deactivateButton = screen.getByText("Desactivar");
      fireEvent.click(deactivateButton);

      await waitFor(() => {
        expect(
          screen.getByText(/¿Estás seguro de que deseas desactivar/),
        ).toBeInTheDocument();
      });

      const cancelButton = screen.getAllByText("Cancelar")[0];
      fireEvent.click(cancelButton);

      expect(staffService.deactivateStaffAccount).not.toHaveBeenCalled();
    });
  });

  describe("Criterio 3: Después de crear una cuenta, aparece en la tabla sin recargar", () => {
    it("muestra la nueva cuenta en la tabla después de crearla", async () => {
      const initialAccount = {
        id: "1",
        fullName: "Juan Pérez",
        email: "juan@gym.com",
        role: "TRAINER" as const,
        isActive: true,
      };

      const newAccount = {
        id: "2",
        fullName: "María García",
        email: "maria@gym.com",
        role: "RECEPTION" as const,
        isActive: true,
      };

      vi.mocked(staffService.listStaffAccounts).mockResolvedValue({
        ok: true,
        data: {
          data: [initialAccount],
          pageSize: 20,
          page: 1,
          total: 1,
        },
      });

      vi.mocked(staffService.createStaffAccount).mockResolvedValue({
        ok: true,
        data: {
          id: newAccount.id,
          fullName: newAccount.fullName,
          role: newAccount.role,
          temporaryPassword: "TempPass123!",
        },
      });

      render(<StaffAdmin />);

      await waitFor(() => {
        expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
      });

      const newButton = screen.getByText("Nueva cuenta");
      fireEvent.click(newButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue("")).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText("Juan Pérez");
      const emailInput = screen.getByPlaceholderText("juan@gym.com");
      const roleSelect = screen.getByDisplayValue("TRAINER");

      fireEvent.change(nameInput, { target: { value: "María García" } });
      fireEvent.change(emailInput, { target: { value: "maria@gym.com" } });
      fireEvent.change(roleSelect, { target: { value: "RECEPTION" } });

      const submitButton = screen.getByText("Crear cuenta");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Cuenta creada exitosamente")).toBeInTheDocument();
        expect(screen.getByText("TempPass123!")).toBeInTheDocument();
      });

      // Después de crear, se recarga la lista
      vi.mocked(staffService.listStaffAccounts).mockResolvedValue({
        ok: true,
        data: {
          data: [initialAccount, newAccount],
          pageSize: 20,
          page: 1,
          total: 2,
        },
      });

      const listeButton = screen.getByText("Listo");
      fireEvent.click(listeButton);

      await waitFor(() => {
        expect(screen.getByText("María García")).toBeInTheDocument();
        expect(screen.getByText("2 cuentas")).toBeInTheDocument();
      });
    });
  });

  describe("Validación de formulario", () => {
    it("rechaza nombres vacíos", async () => {
      vi.mocked(staffService.listStaffAccounts).mockResolvedValue({
        ok: true,
        data: {
          data: [],
          pageSize: 20,
          page: 1,
          total: 0,
        },
      });

      render(<StaffAdmin />);

      const newButton = screen.getByText("Nueva cuenta");
      fireEvent.click(newButton);

      await waitFor(() => {
        expect(screen.getByText("Nueva cuenta")).toBeInTheDocument();
      });

      const submitButton = screen.getByText("Crear cuenta");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/El nombre es requerido/)).toBeInTheDocument();
      });
    });
  });
});
