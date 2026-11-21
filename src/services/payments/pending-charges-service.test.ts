import { afterEach, describe, expect, it, vi } from "vitest";
import { ACCESS_DENIED_MESSAGE } from "@/src/components/access-denied";
import * as apiClient from "@/src/services/http/api-client";
import type { PendingChargesPage } from "@/src/types/payments";
import {
  fetchAllPendingCharges,
  LOAD_PENDING_CHARGES_ERROR,
} from "./pending-charges-service";

const samplePage: PendingChargesPage = {
  data: [
    {
      chargeId: 12,
      memberCode: "GYM-000004",
      fullName: "Carlos Ruiz",
      concept: "Membresía Mensual",
      amount: 25,
      dueDate: "2026-10-05",
      daysLate: 46,
    },
  ],
  totalOwed: 25,
  total: 1,
  page: 1,
  pageSize: 20,
};

function mockResponse(res: Response | Error) {
  const spy = vi.spyOn(apiClient, "apiFetch");
  if (res instanceof Error) spy.mockRejectedValue(res);
  else spy.mockResolvedValue(res);
  return spy;
}

afterEach(() => vi.restoreAllMocks());

describe("fetchAllPendingCharges (GET /charges/pending)", () => {
  it("consulta la página 1 sin filtro de tipo por defecto", async () => {
    const spy = mockResponse(Response.json(samplePage));

    const result = await fetchAllPendingCharges();

    expect(spy).toHaveBeenCalledWith("charges/pending?page=1");
    expect(result).toEqual({ ok: true, data: samplePage, status: 200 });
  });

  it("envía página y tipo cuando se filtra por MEMBERSHIP o PERSONAL_SESSION", async () => {
    const spy = mockResponse(Response.json(samplePage));
    await fetchAllPendingCharges(2, "MEMBERSHIP");
    expect(spy).toHaveBeenCalledWith("charges/pending?page=2&type=MEMBERSHIP");

    vi.restoreAllMocks();
    const spy2 = mockResponse(Response.json(samplePage));
    await fetchAllPendingCharges(1, "PERSONAL_SESSION");
    expect(spy2).toHaveBeenCalledWith("charges/pending?page=1&type=PERSONAL_SESSION");
  });

  it("con 403 devuelve el mensaje de acceso denegado", async () => {
    mockResponse(Response.json({ message: "Forbidden" }, { status: 403 }));
    expect(await fetchAllPendingCharges()).toEqual({
      ok: false,
      error: ACCESS_DENIED_MESSAGE,
      status: 403,
    });
  });

  it("con 400 devuelve el mensaje de validación del backend", async () => {
    mockResponse(Response.json({ message: ["type must be a valid enum value"] }, { status: 400 }));
    expect(await fetchAllPendingCharges(1, "MEMBERSHIP")).toEqual({
      ok: false,
      error: "type must be a valid enum value",
      status: 400,
    });
  });

  it("con 500 o error de red devuelve el error genérico", async () => {
    mockResponse(new Response("", { status: 500 }));
    expect(await fetchAllPendingCharges()).toEqual({
      ok: false,
      error: LOAD_PENDING_CHARGES_ERROR,
      status: 500,
    });

    vi.restoreAllMocks();
    mockResponse(new TypeError("Failed to fetch"));
    expect(await fetchAllPendingCharges()).toEqual({
      ok: false,
      error: LOAD_PENDING_CHARGES_ERROR,
      status: 0,
    });
  });
});
