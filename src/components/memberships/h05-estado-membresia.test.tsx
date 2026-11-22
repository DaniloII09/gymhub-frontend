import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "@/src/services/http/api-client";
import { fetchMyMembership } from "@/src/services/memberships/memberships-service";
import { NO_MEMBERSHIP_MESSAGE, RENEW_MESSAGE, type MyMembership } from "@/src/types/membership";
import { MembershipCard } from "./membership-card";

const render = (membership: MyMembership) =>
  renderToStaticMarkup(createElement(MembershipCard, { membership }));

const active: MyMembership = {
  status: "ACTIVE",
  planName: "Mensual",
  planType: "MONTHLY",
  endDate: "2026-12-15",
  daysLeft: 27,
  includedClass: null,
};

describe("H05. Consultar el estado de mi membresía", () => {
  afterEach(() => vi.restoreAllMocks());

  it("AC1: muestra el plan, el estado, la fecha de vencimiento y los días restantes", () => {
    const html = render(active);
    expect(html).toContain("Mensual");
    expect(html).toContain("Activa");
    expect(html).toContain("15/12/2026");
    expect(html).toContain("27 días restantes");
  });

  it("AC2: con membresía Vencida o Pendiente de pago resalta el estado y muestra el mensaje de renovar", () => {
    for (const status of ["EXPIRED", "PENDING_PAYMENT"] as const) {
      const html = render({ ...active, status, daysLeft: 0 });
      expect(html).toContain("ring-2");
      expect(html).toContain('role="alert"');
      expect(html).toContain("Renueva o paga tu membresía en recepción o desde Mis pagos.");
    }
    expect(RENEW_MESSAGE).toBe("Renueva o paga tu membresía en recepción o desde Mis pagos.");
  });

  it("AC3: una clase suelta de hoy muestra el plan Clase suelta, la clase incluida y que vence hoy", () => {
    const html = render({
      ...active,
      planName: "Clase suelta",
      planType: "DROP_IN",
      endDate: "2026-11-21",
      daysLeft: 0,
      includedClass: { name: "Spinning Matutino", startsAt: "2026-11-21T13:00:00.000Z" },
    });
    expect(html).toContain("Clase suelta");
    expect(html).toContain("Spinning Matutino");
    expect(html).toContain("Vence hoy");
  });

  it("AC4: sin membresía muestra \"Aún no tienes una membresía. Acércate a recepción para adquirir un plan.\"", () => {
    const html = render({ status: "NONE", planName: null, planType: null, endDate: null, daysLeft: null, includedClass: null });
    expect(html).toContain(NO_MEMBERSHIP_MESSAGE);
    expect(NO_MEMBERSHIP_MESSAGE).toBe("Aún no tienes una membresía. Acércate a recepción para adquirir un plan.");
    expect(html).not.toContain("Vence el");
  });

  it("AC5: solo consulta la membresía propia: no envía id de otro miembro ni ofrece cómo elegirlo", async () => {
    const spy = vi
      .spyOn(apiClient, "apiFetch")
      .mockResolvedValue(new Response(JSON.stringify(active), { status: 200, headers: { "Content-Type": "application/json" } }));

    await fetchMyMembership();

    expect(spy).toHaveBeenCalledWith("memberships/me");
    expect(render(active)).not.toMatch(/<(input|select|textarea)\b/);
  });
});
