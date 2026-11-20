import { describe, it, expect, vi, beforeEach } from "vitest";
import * as staffService from "./staff-service";
import * as apiClient from "@/src/services/http/api-client";

vi.mock("@/src/services/http/api-client");

describe("Staff Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listStaffAccounts", () => {
    it("devuelve la lista de cuentas paginada", async () => {
      const mockData = {
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
        total: 1,
      };

      vi.mocked(apiClient.apiJson).mockResolvedValue(mockData);

      const result = await staffService.listStaffAccounts(1, 20);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual(mockData);
        expect(result.data.data).toHaveLength(1);
      }
    });

    it("retorna error cuando falla la petición", async () => {
      vi.mocked(apiClient.apiJson).mockRejectedValue(new Error("Network error"));

      const result = await staffService.listStaffAccounts(1);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("No se pudo cargar");
      }
    });
  });

  describe("createStaffAccount", () => {
    it("crea una nueva cuenta de personal", async () => {
      const input = {
        fullName: "María García",
        email: "maria@gym.com",
        role: "RECEPTION" as const,
      };

      const mockResponse = {
        id: "2",
        fullName: "María García",
        role: "RECEPTION" as const,
        temporaryPassword: "TempPass123!",
      };

      vi.mocked(apiClient.apiJson).mockResolvedValue(mockResponse);

      const result = await staffService.createStaffAccount(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.id).toBe("2");
        expect(result.data.temporaryPassword).toBeDefined();
      }
    });

    it("retorna error si el correo ya existe", async () => {
      const input = {
        fullName: "Luis López",
        email: "luis@gym.com",
        role: "TRAINER" as const,
      };

      vi.mocked(apiClient.apiJson).mockRejectedValue(
        new Error("POST /staff respondió 409"),
      );

      const result = await staffService.createStaffAccount(input);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("correo");
      }
    });
  });

  describe("deactivateStaffAccount", () => {
    it("desactiva una cuenta de personal", async () => {
      const userId = "1";
      const mockResponse = { id: userId, isActive: false };

      vi.mocked(apiClient.apiJson).mockResolvedValue(mockResponse);

      const result = await staffService.deactivateStaffAccount(userId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.isActive).toBe(false);
      }
    });

    it("retorna error cuando falla la desactivación", async () => {
      vi.mocked(apiClient.apiJson).mockRejectedValue(
        new Error("PATCH /users/1/status respondió 500"),
      );

      const result = await staffService.deactivateStaffAccount("1");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("desactivar");
      }
    });
  });
});
