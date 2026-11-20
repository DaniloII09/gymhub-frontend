import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ACCESS_DENIED_MESSAGE } from "@/src/components/access-denied";
import * as apiClient from "@/src/services/http/api-client";
import {
  CHECK_IN_ERROR,
  LOOKUP_ERROR,
  lookupMembers,
  registerCheckIn,
} from "@/src/services/check-ins/check-ins-service";
import type { CheckInMember, CheckInResult } from "@/src/types/check-ins";
import {
  applyCheckInFailure,
  applyCheckInSuccess,
  applyExceptionReasonChange,
  applySelectMember,
  applyTermChange,
  checkInSuccessMessage,
  EXCEPTION_REASON_LENGTH_MESSAGE,
  formatCheckInTime,
  INITIAL_CHECK_IN_STATE,
  isMembershipCurrent,
  MEMBERSHIP_NOT_CURRENT_ALERT,
  MISSING_EXCEPTION_REASON_MESSAGE,
  nextPaymentLabel,
  NO_MEMBERS_FOUND_MESSAGE,
  NO_NEXT_PAYMENT_DATE_LABEL,
  prepareCheckInSubmission,
  RECENT_CHECK_IN_MESSAGE,
  shouldLookup,
  statusLabel,
  validateExceptionReason,
} from "./check-in-logic";
import { CheckInView, type CheckInViewProps } from "./check-in-view";

const noop = () => {};

const juan: CheckInMember = {
  memberId: "7b0c2c1e-7d1f-4a43-9a52-0f8f3f7f3a10",
  memberCode: "GYM-000001",
  fullName: "Juan Perez",
  membershipStatus: "ACTIVE",
  accessAllowed: true,
  nextPaymentDate: "2026-12-08",
};
const maria: CheckInMember = {
  memberId: "9d2e4e3a-9f3b-4c65-9c74-2b0b5b9b5c32",
  memberCode: "GYM-000002",
  fullName: "Maria Lopez",
  membershipStatus: "PENDING_PAYMENT",
  accessAllowed: false,
  nextPaymentDate: "2026-11-25",
};
const carlos: CheckInMember = {
  memberId: "1e3f5f4b-1a4c-4d76-8d85-3c1c6c0c6d43",
  memberCode: "GYM-000004",
  fullName: "Carlos Ruiz",
  membershipStatus: "EXPIRED",
  accessAllowed: false,
  nextPaymentDate: "2026-11-10",
};
const luis: CheckInMember = {
  memberId: "8c1d3d2f-8e2a-4b54-8b63-1a9a4a8a4b21",
  memberCode: "GYM-000003",
  fullName: "Luis Martinez",
  membershipStatus: "NONE",
  accessAllowed: false,
  nextPaymentDate: null,
};

function mockResponse(res: Response | Error) {
  const spy = vi.spyOn(apiClient, "apiFetch");
  if (res instanceof Error) spy.mockRejectedValue(res);
  else spy.mockResolvedValue(res);
  return spy;
}

afterEach(() => vi.restoreAllMocks());

describe("lógica del check-in (FE-13.1 y FE-14.1)", () => {
  it("no busca con menos de 2 caracteres", () => {
    expect(shouldLookup(" a ")).toBe(false);
    expect(shouldLookup("Ju")).toBe(true);
  });

  it("muestra la hora del ingreso en El Salvador", () => {
    // 18:05 UTC = 12:05 en El Salvador.
    expect(formatCheckInTime("2026-11-19T18:05:00.000Z")).toBe("12:05");
    expect(checkInSuccessMessage("2026-11-19T18:05:00.000Z")).toBe(
      "Ingreso registrado a las 12:05.",
    );
    expect(checkInSuccessMessage("2026-11-19T18:05:00.000Z", true)).toBe(
      "Ingreso excepcional registrado a las 12:05.",
    );
  });

  it("traduce el estado y la próxima fecha de pago", () => {
    expect(statusLabel(juan)).toBe("Activa");
    expect(statusLabel(maria)).toBe("Pendiente de pago");
    expect(statusLabel(carlos)).toBe("Vencida");
    expect(statusLabel(luis)).toBe("Sin membresía");
    expect(nextPaymentLabel(juan)).toBe("08/12/2026");
    expect(nextPaymentLabel(carlos)).toBe("10/11/2026");
    expect(nextPaymentLabel(luis)).toBe(NO_NEXT_PAYMENT_DATE_LABEL);
  });

  it("confía en accessAllowed del backend sin duplicar reglas de estado", () => {
    expect(isMembershipCurrent(juan)).toBe(true);
    expect(isMembershipCurrent(maria)).toBe(false);
    expect(isMembershipCurrent(carlos)).toBe(false);
    expect(isMembershipCurrent(luis)).toBe(false);
    expect(isMembershipCurrent({ accessAllowed: false })).toBe(false);
    expect(isMembershipCurrent({ accessAllowed: true })).toBe(true);

    // Aunque membershipStatus fuera ACTIVE, si accessAllowed es false se exige motivo.
    const deniedDespiteActive: CheckInMember = { ...juan, accessAllowed: false };
    expect(isMembershipCurrent(deniedDespiteActive)).toBe(false);
    expect(prepareCheckInSubmission(deniedDespiteActive, "")).toEqual({
      ok: false,
      reasonError: MISSING_EXCEPTION_REASON_MESSAGE,
    });
  });

  it("valida motivo ausente, corto, largo y válido (5 a 200 caracteres tras recortar)", () => {
    expect(validateExceptionReason("")).toBe(MISSING_EXCEPTION_REASON_MESSAGE);
    expect(validateExceptionReason("    ")).toBe(MISSING_EXCEPTION_REASON_MESSAGE);
    expect(validateExceptionReason("  abcd  ")).toBe(EXCEPTION_REASON_LENGTH_MESSAGE);
    expect(validateExceptionReason("a".repeat(201))).toBe(EXCEPTION_REASON_LENGTH_MESSAGE);

    expect(validateExceptionReason("  12345  ")).toBeNull();
    expect(validateExceptionReason("a".repeat(200))).toBeNull();
    expect(validateExceptionReason(`  ${"a".repeat(200)}  `)).toBeNull();
  });

  it("prepara el envío normal para ACTIVE y exige motivo válido para excepciones", () => {
    expect(prepareCheckInSubmission(juan, "")).toEqual({
      ok: true,
      memberId: juan.memberId,
    });

    expect(prepareCheckInSubmission(maria, "  ")).toEqual({
      ok: false,
      reasonError: MISSING_EXCEPTION_REASON_MESSAGE,
    });
    expect(prepareCheckInSubmission(carlos, "cort")).toEqual({
      ok: false,
      reasonError: EXCEPTION_REASON_LENGTH_MESSAGE,
    });
    expect(prepareCheckInSubmission(luis, "a".repeat(201))).toEqual({
      ok: false,
      reasonError: EXCEPTION_REASON_LENGTH_MESSAGE,
    });
    expect(prepareCheckInSubmission(luis, "  Pagará mañana en recepción  ")).toEqual({
      ok: true,
      memberId: luis.memberId,
      exceptionReason: "Pagará mañana en recepción",
    });
  });

  it("limpia motivo y errores al cambiar de miembro, editar búsqueda o registrar con éxito", () => {
    const withErrors = {
      ...INITIAL_CHECK_IN_STATE,
      term: "car",
      results: [carlos, maria],
      selected: carlos,
      exceptionReason: "abc",
      reasonError: EXCEPTION_REASON_LENGTH_MESSAGE,
      error: "Error previo",
      success: "Ingreso previo",
    };

    const switched = applySelectMember(withErrors, maria);
    expect(switched.selected).toEqual(maria);
    expect(switched.exceptionReason).toBe("");
    expect(switched.reasonError).toBeNull();
    expect(switched.error).toBeNull();
    expect(switched.success).toBeNull();

    const editedReason = applyExceptionReasonChange(
      { ...withErrors, reasonError: MISSING_EXCEPTION_REASON_MESSAGE, error: "Error" },
      "Pagará al salir",
    );
    expect(editedReason.exceptionReason).toBe("Pagará al salir");
    expect(editedReason.reasonError).toBeNull();
    expect(editedReason.error).toBeNull();

    const searched = applyTermChange(withErrors, "ma");
    expect(searched.term).toBe("ma");
    expect(searched.selected).toBeNull();
    expect(searched.exceptionReason).toBe("");
    expect(searched.reasonError).toBeNull();
    expect(searched.error).toBeNull();
    expect(searched.success).toBeNull();

    const failed = applyCheckInFailure({ ...withErrors, registering: true }, "Motivo inválido");
    expect(failed.registering).toBe(false);
    expect(failed.error).toBe("Motivo inválido");
    expect(failed.selected).toEqual(carlos);
    expect(failed.exceptionReason).toBe("abc");

    const exceptionResult: CheckInResult = {
      checkInId: 35,
      memberCode: carlos.memberCode,
      checkedInAt: "2026-11-19T18:05:00.000Z",
      membershipStatus: "EXPIRED",
      isException: true,
    };
    const succeeded = applyCheckInSuccess(
      { ...withErrors, registering: true, exceptionReason: "Pagará hoy" },
      exceptionResult,
    );
    expect(succeeded).toEqual({
      ...INITIAL_CHECK_IN_STATE,
      success: "Ingreso excepcional registrado a las 12:05.",
    });
  });
});

describe("check-ins-service", () => {
  it("lookupMembers busca con el término recortado y devuelve accessAllowed", async () => {
    const spy = mockResponse(Response.json({ data: [juan, maria] }));
    expect(await lookupMembers("  gym-000001 ")).toEqual({
      ok: true,
      data: [juan, maria],
      status: 200,
    });
    expect(spy).toHaveBeenCalledWith("check-ins/lookup?q=gym-000001");
  });

  it("lookupMembers con 403 da acceso denegado y sin conexión el error genérico", async () => {
    mockResponse(new Response("", { status: 403 }));
    expect(await lookupMembers("Juan")).toMatchObject({ error: ACCESS_DENIED_MESSAGE });
    vi.restoreAllMocks();
    mockResponse(new TypeError("Failed to fetch"));
    expect(await lookupMembers("Juan")).toMatchObject({ error: LOOKUP_ERROR, status: 0 });
  });

  it("registerCheckIn envía solo el miembro para ingreso normal y devuelve el ingreso", async () => {
    const result: CheckInResult = {
      checkInId: 21,
      memberCode: "GYM-000001",
      checkedInAt: "2026-11-19T18:05:00.000Z",
      membershipStatus: "ACTIVE",
      isException: false,
    };
    const spy = mockResponse(Response.json(result, { status: 201 }));
    expect(await registerCheckIn(juan.memberId)).toEqual({ ok: true, data: result, status: 201 });
    expect(spy).toHaveBeenCalledWith("check-ins", {
      method: "POST",
      body: JSON.stringify({ memberId: juan.memberId }),
    });
  });

  it("registerCheckIn envía exceptionReason recortado en un ingreso excepcional", async () => {
    const result: CheckInResult = {
      checkInId: 22,
      memberCode: carlos.memberCode,
      checkedInAt: "2026-11-19T18:05:00.000Z",
      membershipStatus: "EXPIRED",
      isException: true,
    };
    const spy = mockResponse(Response.json(result, { status: 201 }));
    expect(await registerCheckIn(carlos.memberId, "  Renueva hoy por la tarde  ")).toEqual({
      ok: true,
      data: result,
      status: 201,
    });
    expect(spy).toHaveBeenCalledWith("check-ins", {
      method: "POST",
      body: JSON.stringify({
        memberId: carlos.memberId,
        exceptionReason: "Renueva hoy por la tarde",
      }),
    });
  });

  it("registerCheckIn con 400 devuelve el mensaje específico del backend", async () => {
    mockResponse(Response.json({ message: MISSING_EXCEPTION_REASON_MESSAGE }, { status: 400 }));
    expect(await registerCheckIn(carlos.memberId)).toEqual({
      ok: false,
      error: MISSING_EXCEPTION_REASON_MESSAGE,
      status: 400,
    });

    vi.restoreAllMocks();
    mockResponse(Response.json({ message: [EXCEPTION_REASON_LENGTH_MESSAGE] }, { status: 400 }));
    expect(await registerCheckIn(carlos.memberId, "abc")).toEqual({
      ok: false,
      error: EXCEPTION_REASON_LENGTH_MESSAGE,
      status: 400,
    });
  });

  it("registerCheckIn con 409 devuelve el mensaje de los 30 minutos", async () => {
    mockResponse(Response.json({ message: RECENT_CHECK_IN_MESSAGE }, { status: 409 }));
    expect(await registerCheckIn(juan.memberId)).toEqual({
      ok: false,
      error: RECENT_CHECK_IN_MESSAGE,
      status: 409,
    });
  });

  it("registerCheckIn con 500 devuelve el error genérico", async () => {
    mockResponse(new Response("", { status: 500 }));
    expect(await registerCheckIn(juan.memberId)).toMatchObject({ error: CHECK_IN_ERROR });
  });
});

describe("CheckInView", () => {
  const render = (props: Partial<CheckInViewProps> = {}) =>
    renderToStaticMarkup(
      <CheckInView
        term=""
        results={[]}
        searching={false}
        searchError={null}
        selected={null}
        exceptionReason=""
        reasonError={null}
        registering={false}
        success={null}
        error={null}
        onTermChange={noop}
        onSelect={noop}
        onExceptionReasonChange={noop}
        onRegister={noop}
        {...props}
      />,
    );

  it("muestra los resultados con su estado", () => {
    const html = render({ term: "ju", results: [juan, luis] });
    expect(html).toContain("Juan Perez");
    expect(html).toContain("GYM-000001");
    expect(html).toContain("Activa");
    expect(html).toContain("Sin membresía");
  });

  it("sin resultados muestra el mensaje de la historia y no hay botón de registrar", () => {
    const html = render({ term: "nadie" });
    expect(html).toContain(NO_MEMBERS_FOUND_MESSAGE);
    expect(html).not.toContain("Registrar ingreso");
  });

  it("con menos de 2 caracteres no muestra el mensaje de vacío", () => {
    expect(render({ term: "n" })).not.toContain(NO_MEMBERS_FOUND_MESSAGE);
  });

  it("mientras busca lo indica", () => {
    expect(render({ term: "Juan", searching: true })).toContain("Buscando...");
  });

  it("para ACTIVE muestra flujo normal sin alerta ni campo de motivo", () => {
    const html = render({ term: "Juan", selected: juan });
    expect(html).toContain("Miembro seleccionado");
    expect(html).toContain("08/12/2026");
    expect(html).toContain("Registrar ingreso");
    expect(html).not.toContain(MEMBERSHIP_NOT_CURRENT_ALERT);
    expect(html).not.toContain("Motivo de excepción");
    expect(html).not.toContain('id="exception-reason"');
  });

  it.each([
    ["PENDING_PAYMENT", maria, "Pendiente de pago", "25/11/2026"],
    ["EXPIRED", carlos, "Vencida", "10/11/2026"],
    ["NONE", luis, "Sin membresía", NO_NEXT_PAYMENT_DATE_LABEL],
  ] as const)(
    "para %s muestra alerta 'Membresía no vigente', estado, fecha de pago y campo obligatorio",
    (_status, member, expectedStatus, expectedDate) => {
      const html = render({ term: member.fullName, selected: member });
      expect(html).toContain(MEMBERSHIP_NOT_CURRENT_ALERT);
      expect(html).toContain('role="alert"');
      expect(html).toContain(expectedStatus);
      expect(html).toContain(expectedDate);
      expect(html).toContain("Motivo de excepción");
      expect(html).toContain('id="exception-reason"');
      expect(html).toContain('aria-required="true"');
      expect(html).toContain("Registrar ingreso excepcional");
    },
  );

  it("muestra el error específico de validación en el campo de motivo con accesibilidad", () => {
    const html = render({
      term: "Carlos",
      selected: carlos,
      exceptionReason: "abc",
      reasonError: EXCEPTION_REASON_LENGTH_MESSAGE,
    });
    expect(html).toContain(EXCEPTION_REASON_LENGTH_MESSAGE);
    expect(html).toContain('id="exception-reason-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="exception-reason-help exception-reason-error"');
  });

  it("mientras registra deshabilita el botón y el motivo", () => {
    const html = render({ term: "Juan", selected: juan, registering: true });
    expect(html).toContain("Registrando...");
    expect(html).toMatch(/<button type="button" disabled=""[^>]*>Registrando/);

    const exceptionalHtml = render({
      term: "Carlos",
      selected: carlos,
      exceptionReason: "Pagará hoy",
      registering: true,
    });
    expect(exceptionalHtml).toMatch(/<textarea id="exception-reason"[^>]*disabled=""/);
  });

  it("muestra el éxito y el error del servidor", () => {
    expect(render({ success: "Ingreso excepcional registrado a las 12:05." })).toContain(
      "Ingreso excepcional registrado a las 12:05.",
    );
    const errorHtml = render({ selected: juan, error: RECENT_CHECK_IN_MESSAGE });
    expect(errorHtml).toContain(RECENT_CHECK_IN_MESSAGE);
    expect(errorHtml).toContain('role="alert"');
  });
});
