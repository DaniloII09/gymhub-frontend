import { afterEach, describe, expect, it, vi } from "vitest";
import { ACCESS_DENIED_MESSAGE } from "@/src/components/access-denied";
import * as apiClient from "@/src/services/http/api-client";
import type { IncomeReport, OccupancyReport } from "@/src/types/reports";
import {
  fetchIncomeReport,
  fetchOccupancyReport,
  LOAD_INCOME_REPORT_ERROR,
  LOAD_OCCUPANCY_REPORT_ERROR,
  NO_CLASSES_MESSAGE,
} from "./reports-service";

const report: IncomeReport = {
  from: "2026-09-01",
  to: "2026-11-30",
  totals: { membership: 110, dropIn: 10, personalSession: 30, total: 150, receiptCount: 7 },
  months: [
    { month: "2026-09", membership: 25, dropIn: 5, personalSession: 0, total: 30, receiptCount: 2 },
    { month: "2026-10", membership: 0, dropIn: 0, personalSession: 0, total: 0, receiptCount: 0 },
    { month: "2026-11", membership: 85, dropIn: 5, personalSession: 30, total: 120, receiptCount: 5 },
  ],
  message: null,
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

describe("fetchIncomeReport (FE-29.1)", () => {
  it("consulta GET /reports/income con from y to y devuelve el reporte", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue(json(200, report));

    const result = await fetchIncomeReport("2026-09-01", "2026-11-30");

    expect(spy).toHaveBeenCalledWith("reports/income?from=2026-09-01&to=2026-11-30");
    expect(result).toEqual({ ok: true, data: report, status: 200 });
  });

  it("en un 400 devuelve el motivo del servidor", async () => {
    vi.spyOn(apiClient, "apiFetch").mockResolvedValue(
      json(400, { message: "El rango no puede ser mayor a 12 meses.", statusCode: 400 }),
    );

    const result = await fetchIncomeReport("2026-01-01", "2027-01-01");

    expect(result).toEqual({ ok: false, error: "El rango no puede ser mayor a 12 meses.", status: 400 });
  });

  it("en un 400 de validación con varios mensajes los une", async () => {
    vi.spyOn(apiClient, "apiFetch").mockResolvedValue(
      json(400, { message: ["Las fechas deben tener el formato AAAA-MM-DD."], statusCode: 400 }),
    );

    const result = await fetchIncomeReport("01/01/2026", "2026-03-31");

    expect(result).toEqual({
      ok: false,
      error: "Las fechas deben tener el formato AAAA-MM-DD.",
      status: 400,
    });
  });

  it("en un 403 devuelve acceso denegado", async () => {
    vi.spyOn(apiClient, "apiFetch").mockResolvedValue(json(403, { message: "Forbidden resource" }));

    const result = await fetchIncomeReport("2026-09-01", "2026-11-30");

    expect(result).toEqual({ ok: false, error: ACCESS_DENIED_MESSAGE, status: 403 });
  });

  it("en un 500 devuelve el mensaje genérico", async () => {
    vi.spyOn(apiClient, "apiFetch").mockResolvedValue(json(500, { message: "boom" }));

    const result = await fetchIncomeReport("2026-09-01", "2026-11-30");

    expect(result).toEqual({ ok: false, error: LOAD_INCOME_REPORT_ERROR, status: 500 });
  });

  it("si no hay conexión devuelve el mensaje genérico con status 0", async () => {
    vi.spyOn(apiClient, "apiFetch").mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await fetchIncomeReport("2026-09-01", "2026-11-30");

    expect(result).toEqual({ ok: false, error: LOAD_INCOME_REPORT_ERROR, status: 0 });
  });
});

const occupancy: OccupancyReport = {
  from: "2026-09-01",
  to: "2026-11-20",
  totals: { classCount: 2, sessions: 3, capacity: 18, confirmedReservations: 11, occupancyPercent: 61.1 },
  classes: [
    { name: "Spinning Matutino", sessions: 2, capacity: 8, confirmedReservations: 6, occupancyPercent: 75, level: "HIGH" },
    { name: "Yoga Flow", sessions: 1, capacity: 10, confirmedReservations: 5, occupancyPercent: 50, level: "LOW" },
  ],
};

describe("fetchOccupancyReport (FE-28.1)", () => {
  it("consulta GET /reports/occupancy con from y to y devuelve el reporte", async () => {
    const spy = vi.spyOn(apiClient, "apiFetch").mockResolvedValue(json(200, occupancy));

    const result = await fetchOccupancyReport("2026-09-01", "2026-11-20");

    expect(spy).toHaveBeenCalledWith("reports/occupancy?from=2026-09-01&to=2026-11-20");
    expect(result).toEqual({ ok: true, data: occupancy, status: 200 });
  });

  it("en un 400 devuelve el motivo del servidor", async () => {
    vi.spyOn(apiClient, "apiFetch").mockResolvedValue(
      json(400, { message: "La fecha de inicio no puede ser posterior a la de fin.", statusCode: 400 }),
    );

    const result = await fetchOccupancyReport("2026-11-30", "2026-09-01");

    expect(result).toEqual({
      ok: false,
      error: "La fecha de inicio no puede ser posterior a la de fin.",
      status: 400,
    });
  });

  it("en un 404 devuelve el motivo de que no hay clases", async () => {
    vi.spyOn(apiClient, "apiFetch").mockResolvedValue(
      json(404, { message: "No hay clases en ese rango.", statusCode: 404 }),
    );

    const result = await fetchOccupancyReport("2020-01-01", "2020-01-31");

    expect(result).toEqual({ ok: false, error: NO_CLASSES_MESSAGE, status: 404 });
  });

  it("en un 404 sin mensaje usa el texto de la card", async () => {
    vi.spyOn(apiClient, "apiFetch").mockResolvedValue(new Response("", { status: 404 }));

    const result = await fetchOccupancyReport("2020-01-01", "2020-01-31");

    expect(result).toEqual({ ok: false, error: NO_CLASSES_MESSAGE, status: 404 });
  });

  it("en un 403 devuelve acceso denegado", async () => {
    vi.spyOn(apiClient, "apiFetch").mockResolvedValue(json(403, { message: "Forbidden resource" }));

    const result = await fetchOccupancyReport("2026-09-01", "2026-11-20");

    expect(result).toEqual({ ok: false, error: ACCESS_DENIED_MESSAGE, status: 403 });
  });

  it("en un 500 devuelve el mensaje genérico", async () => {
    vi.spyOn(apiClient, "apiFetch").mockResolvedValue(json(500, { message: "boom" }));

    const result = await fetchOccupancyReport("2026-09-01", "2026-11-20");

    expect(result).toEqual({ ok: false, error: LOAD_OCCUPANCY_REPORT_ERROR, status: 500 });
  });

  it("si no hay conexión devuelve el mensaje genérico con status 0", async () => {
    vi.spyOn(apiClient, "apiFetch").mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await fetchOccupancyReport("2026-09-01", "2026-11-20");

    expect(result).toEqual({ ok: false, error: LOAD_OCCUPANCY_REPORT_ERROR, status: 0 });
  });
});
