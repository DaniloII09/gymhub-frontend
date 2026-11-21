import { afterEach, describe, expect, it, vi } from "vitest";
import { ACCESS_DENIED_MESSAGE } from "@/src/components/access-denied";
import * as apiClient from "@/src/services/http/api-client";
import type { CreateRoutineInput, RoutineRecord } from "@/src/types/routines";
import {
  createRoutine,
  DELETE_ROUTINE_ERROR,
  deleteRoutine,
  fetchMyRoutines,
  fetchTrainerRoutines,
  LOAD_MY_ROUTINES_ERROR,
  LOAD_TRAINER_ROUTINES_ERROR,
  SAVE_ROUTINE_ERROR,
  updateRoutine,
} from "./routines-service";

const sampleRoutine: RoutineRecord = {
  id: 7,
  name: "Fuerza Base",
  daysOfWeek: [1, 3, 5],
  trainer: { id: "trainer-1", fullName: "Entrenador Uno" },
  member: { id: "11111111-1111-4111-8111-111111111111", fullName: "Juan Pérez", memberCode: "GYM-000001" },
  exercises: [
    { id: 10, sortOrder: 1, name: "Sentadilla", sets: 4, reps: 10, suggestedWeightKg: 60 },
  ],
  createdAt: "2026-11-20T12:00:00.000Z",
  updatedAt: "2026-11-20T12:00:00.000Z",
};

const validInput: CreateRoutineInput = {
  name: "Fuerza Base",
  memberId: "11111111-1111-4111-8111-111111111111",
  daysOfWeek: [1, 3, 5],
  exercises: [{ name: "Sentadilla", sets: 4, reps: 10, suggestedWeightKg: 60 }],
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("routines-service (FE-18.1 / FE-18.2)", () => {
  it("lista rutinas del entrenador y del miembro desde GET /routines/*", async () => {
    const spy = vi
      .spyOn(apiClient, "apiFetch")
      .mockResolvedValueOnce(json(200, { data: [sampleRoutine] }))
      .mockResolvedValueOnce(json(200, { data: [sampleRoutine] }));

    expect(await fetchTrainerRoutines()).toEqual({
      ok: true,
      data: [sampleRoutine],
      status: 200,
    });
    expect(spy).toHaveBeenNthCalledWith(1, "routines/trainer/me");

    expect(await fetchMyRoutines()).toEqual({
      ok: true,
      data: [sampleRoutine],
      status: 200,
    });
    expect(spy).toHaveBeenNthCalledWith(2, "routines/me");
  });

  it("maneja 403 y errores de red al listar rutinas", async () => {
    vi.spyOn(apiClient, "apiFetch").mockResolvedValueOnce(new Response(null, { status: 403 }));
    expect(await fetchTrainerRoutines()).toEqual({
      ok: false,
      error: ACCESS_DENIED_MESSAGE,
      status: 403,
    });

    vi.spyOn(apiClient, "apiFetch").mockResolvedValueOnce(json(500, {}));
    expect(await fetchTrainerRoutines()).toEqual({
      ok: false,
      error: LOAD_TRAINER_ROUTINES_ERROR,
      status: 500,
    });

    vi.spyOn(apiClient, "apiFetch").mockRejectedValueOnce(new Error("offline"));
    expect(await fetchMyRoutines()).toEqual({
      ok: false,
      error: LOAD_MY_ROUTINES_ERROR,
      status: 0,
    });
  });

  it("crea rutina con POST /routines y propaga 404 de miembro inexistente", async () => {
    const spy = vi
      .spyOn(apiClient, "apiFetch")
      .mockResolvedValueOnce(json(201, sampleRoutine))
      .mockResolvedValueOnce(json(404, { message: "No encontramos ese miembro." }));

    expect(await createRoutine(validInput)).toEqual({
      ok: true,
      data: sampleRoutine,
      status: 201,
    });
    expect(spy).toHaveBeenNthCalledWith(1, "routines", {
      method: "POST",
      body: JSON.stringify(validInput),
    });

    expect(await createRoutine(validInput)).toEqual({
      ok: false,
      error: "No encontramos ese miembro.",
      status: 404,
    });
  });

  it("actualiza rutina con PATCH /routines/:id y preserva mensaje 403 de otro entrenador", async () => {
    const spy = vi
      .spyOn(apiClient, "apiFetch")
      .mockResolvedValueOnce(json(200, sampleRoutine))
      .mockResolvedValueOnce(
        json(403, { message: "No puedes modificar una rutina de otro entrenador." }),
      );

    expect(await updateRoutine(7, validInput)).toEqual({
      ok: true,
      data: sampleRoutine,
      status: 200,
    });
    expect(spy).toHaveBeenNthCalledWith(1, "routines/7", {
      method: "PATCH",
      body: JSON.stringify(validInput),
    });

    expect(await updateRoutine(99, validInput)).toEqual({
      ok: false,
      error: "No puedes modificar una rutina de otro entrenador.",
      status: 403,
    });
  });

  it("en 500 al guardar devuelve SAVE_ROUTINE_ERROR y deleteRoutine maneja 204/403/500", async () => {
    vi.spyOn(apiClient, "apiFetch").mockResolvedValueOnce(json(500, {}));
    expect(await createRoutine(validInput)).toEqual({
      ok: false,
      error: SAVE_ROUTINE_ERROR,
      status: 500,
    });

    vi.spyOn(apiClient, "apiFetch")
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        json(403, { message: "No puedes modificar una rutina de otro entrenador." }),
      )
      .mockResolvedValueOnce(json(500, {}));

    expect(await deleteRoutine(7)).toEqual({ ok: true, data: undefined, status: 204 });
    expect(await deleteRoutine(99)).toEqual({
      ok: false,
      error: "No puedes modificar una rutina de otro entrenador.",
      status: 403,
    });
    expect(await deleteRoutine(7)).toEqual({
      ok: false,
      error: DELETE_ROUTINE_ERROR,
      status: 500,
    });
  });
});
