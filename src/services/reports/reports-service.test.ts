import { afterEach, describe, expect, it, vi } from "vitest";
import { ACCESS_DENIED_MESSAGE } from "@/src/components/access-denied";
import * as apiClient from "@/src/services/http/api-client";
import type { IncomeReport } from "@/src/types/reports";
import { fetchIncomeReport, LOAD_INCOME_REPORT_ERROR } from "./reports-service";

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
