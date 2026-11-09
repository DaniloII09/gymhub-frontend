import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createClass,
  fetchTrainers,
  fetchWeeklyClasses,
  updateClass,
} from "./classes-service";
import * as apiClient from "@/src/services/http/api-client";
import type { GymClass } from "@/src/types/classes";

const mockClass: GymClass = {
  id: 1,
  name: "Spinning Matutino",
  trainerId: "11111111-1111-4111-8111-111111111111",
  trainer: {
    id: "11111111-1111-4111-8111-111111111111",
    fullName: "Entrenador Demo",
    email: "entrenador@gymhub.test",
  },
  startsAt: "2026-12-01T18:00:00.000Z",
  endsAt: "2026-12-01T18:50:00.000Z",
  capacity: 20,
  confirmedReservations: 12,
  status: "SCHEDULED",
  createdAt: "2026-11-08T20:00:00.000Z",
  updatedAt: "2026-11-08T20:00:00.000Z",
};

describe("classes-service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchWeeklyClasses", () => {
    it("obtiene las clases de la semana mediante apiFetch", async () => {
      const apiFetchSpy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue(
        new Response(JSON.stringify([mockClass]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const from = new Date("2026-12-01T00:00:00.000Z");
      const to = new Date("2026-12-07T23:59:59.000Z");

      const result = await fetchWeeklyClasses(from, to);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].name).toBe("Spinning Matutino");
      expect(apiFetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("classes?from="),
      );
    });

    it("maneja error en la respuesta del backend sin lanzar excepción", async () => {
      vi.spyOn(apiClient, "apiFetch").mockResolvedValue(
        new Response(
          JSON.stringify({ message: "Error al consultar clases." }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        ),
      );

      const result = await fetchWeeklyClasses(new Date(), new Date());

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Error al consultar clases.");
      expect(result.status).toBe(500);
    });
  });

  describe("createClass", () => {
    it("programa una clase con éxito (HTTP 201)", async () => {
      vi.spyOn(apiClient, "apiFetch").mockResolvedValue(
        new Response(JSON.stringify(mockClass), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const input = {
        name: "Spinning Matutino",
        trainerId: "11111111-1111-4111-8111-111111111111",
        startsAt: "2026-12-01T18:00:00.000Z",
        endsAt: "2026-12-01T18:50:00.000Z",
        capacity: 20,
      };

      const result = await createClass(input);

      expect(result.ok).toBe(true);
      expect(result.data?.status).toBe("SCHEDULED");
    });

    it("captura conflicto HTTP 409 por cruce de horario y devuelve el error para el formulario sin cerrarlo", async () => {
      const conflictMsg =
        'El entrenador ya tiene asignada la clase "Spinning 18:00" (18:00 a 18:50) que se cruza con ese horario.';

      vi.spyOn(apiClient, "apiFetch").mockResolvedValue(
        new Response(JSON.stringify({ message: conflictMsg }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const input = {
        name: "Spinning Tarde",
        trainerId: "11111111-1111-4111-8111-111111111111",
        startsAt: "2026-12-01T18:30:00.000Z",
        endsAt: "2026-12-01T19:20:00.000Z",
        capacity: 20,
      };

      const result = await createClass(input);

      expect(result.ok).toBe(false);
      expect(result.status).toBe(409);
      expect(result.error).toBe(conflictMsg);
    });
  });

  describe("updateClass", () => {
    it("captura conflicto HTTP 409 al intentar reducir cupo por debajo de reservas confirmadas", async () => {
      const capacityConflictMsg =
        "El cupo no puede ser menor a las 12 reservas confirmadas.";

      vi.spyOn(apiClient, "apiFetch").mockResolvedValue(
        new Response(JSON.stringify({ message: capacityConflictMsg }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await updateClass(1, { capacity: 10 });

      expect(result.ok).toBe(false);
      expect(result.status).toBe(409);
      expect(result.error).toBe(capacityConflictMsg);
    });

    it("actualiza el cupo con éxito cuando es igual o mayor a reservas confirmadas", async () => {
      const updatedClass = { ...mockClass, capacity: 15 };
      vi.spyOn(apiClient, "apiFetch").mockResolvedValue(
        new Response(JSON.stringify(updatedClass), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await updateClass(1, { capacity: 15 });

      expect(result.ok).toBe(true);
      expect(result.data?.capacity).toBe(15);
    });
  });

  describe("fetchTrainers", () => {
    it("obtiene la lista de entrenadores filtrando por rol TRAINER", async () => {
      const staffResponse = {
        data: [
          {
            id: "t1",
            fullName: "Entrenador Uno",
            email: "entrenador1@gymhub.test",
            role: "TRAINER",
            isActive: true,
          },
          {
            id: "r1",
            fullName: "Recepcionista Uno",
            email: "recepcion@gymhub.test",
            role: "RECEPTION",
            isActive: true,
          },
        ],
        total: 2,
        page: 1,
        pageSize: 100,
      };

      vi.spyOn(apiClient, "apiFetch").mockResolvedValue(
        new Response(JSON.stringify(staffResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const trainers = await fetchTrainers();

      expect(trainers).toHaveLength(1);
      expect(trainers[0].fullName).toBe("Entrenador Uno");
    });
  });
});

