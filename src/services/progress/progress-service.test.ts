import { afterEach, describe, expect, it, vi } from "vitest";
import { ACCESS_DENIED_MESSAGE } from "@/src/components/access-denied";
import * as apiClient from "@/src/services/http/api-client";
import type { ProgressEntry, ProgressEvolution } from "@/src/types/progress";
import {
  CREATE_PROGRESS_ERROR,
  createProgressEntry,
  DUPLICATE_PROGRESS_DATE_MESSAGE,
  fetchMyProgress,
  LOAD_PROGRESS_ERROR,
} from "./progress-service";

const entry1: ProgressEntry = {
  id: 1,
  date: "2026-10-21",
  weightKg: 76,
  chestCm: 98,
  waistCm: 84,
  armCm: 34,
  isBaseline: true,
  createdAt: "2026-10-21T15:00:00.000Z",
  updatedAt: "2026-10-21T15:00:00.000Z",
};

const evolution: ProgressEvolution = {
  entries: [entry1],
  deltas: { weightKg: 0, chestCm: 0, waistCm: 0, armCm: 0 },
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

describe("progress-service (FE-19.1 / FE-19.2)", () => {
  it("obtiene historial y deltas desde GET /progress/me", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue(json(200, evolution));

    const result = await fetchMyProgress();

    expect(spy).toHaveBeenCalledWith("progress/me");
    expect(result).toEqual({ ok: true, data: evolution, status: 200 });
  });

  it("maneja 403, 500 y fallo de red al consultar GET /progress/me", async () => {
    vi.spyOn(apiClient, "apiFetch").mockResolvedValueOnce(json(403, {}));
    expect(await fetchMyProgress()).toEqual({
      ok: false,
      error: ACCESS_DENIED_MESSAGE,
      status: 403,
    });

    vi.spyOn(apiClient, "apiFetch").mockResolvedValueOnce(json(500, {}));
    expect(await fetchMyProgress()).toEqual({
      ok: false,
      error: LOAD_PROGRESS_ERROR,
      status: 500,
    });

    vi.spyOn(apiClient, "apiFetch").mockRejectedValueOnce(new Error("network"));
    expect(await fetchMyProgress()).toEqual({
      ok: false,
      error: LOAD_PROGRESS_ERROR,
      status: 0,
    });
  });

  it("envía POST /progress y retorna 201, 400 o 409 duplicado", async () => {
    const input = {
      date: "2026-10-21",
      weightKg: 76,
      chestCm: 98,
      waistCm: 84,
      armCm: 34,
    };

    const spy = vi
      .spyOn(apiClient, "apiFetch")
      .mockResolvedValueOnce(json(201, entry1))
      .mockResolvedValueOnce(json(409, { message: DUPLICATE_PROGRESS_DATE_MESSAGE }))
      .mockResolvedValueOnce(json(400, { message: "La fecha no puede ser futura." }));

    expect(await createProgressEntry(input)).toEqual({
      ok: true,
      data: entry1,
      status: 201,
    });
    expect(spy).toHaveBeenNthCalledWith(1, "progress", {
      method: "POST",
      body: JSON.stringify(input),
    });

    expect(await createProgressEntry(input)).toEqual({
      ok: false,
      error: DUPLICATE_PROGRESS_DATE_MESSAGE,
      status: 409,
    });

    expect(await createProgressEntry(input)).toEqual({
      ok: false,
      error: "La fecha no puede ser futura.",
      status: 400,
    });
  });

  it("en 500 o sin red al guardar retorna CREATE_PROGRESS_ERROR", async () => {
    const input = {
      date: "2026-10-21",
      weightKg: 76,
      chestCm: 98,
      waistCm: 84,
      armCm: 34,
    };

    vi.spyOn(apiClient, "apiFetch").mockResolvedValueOnce(json(500, {}));
    expect(await createProgressEntry(input)).toEqual({
      ok: false,
      error: CREATE_PROGRESS_ERROR,
      status: 500,
    });

    vi.spyOn(apiClient, "apiFetch").mockRejectedValueOnce(new Error("timeout"));
    expect(await createProgressEntry(input)).toEqual({
      ok: false,
      error: CREATE_PROGRESS_ERROR,
      status: 0,
    });
  });
});
