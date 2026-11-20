import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminAccessBoundary } from "@/src/components/admin/admin-role-guard";
import { gateDecision } from "@/src/components/auth/role-gate";
import { RoleNavigationLinks } from "@/src/components/dashboard/role-navigation";
import { LOAD_PENDING_CHARGES_ERROR } from "@/src/services/payments/pending-charges-service";
import type { AuthUser } from "@/src/types/auth";
import type { PendingChargeItem, PendingChargesPage } from "@/src/types/payments";
import { totalPages } from "./my-payments-logic";
import {
  changePendingChargesFilter,
  changePendingChargesPage,
  daysLateText,
  formatChargeDueDate,
  formatOwedAmount,
  INITIAL_PENDING_CHARGES_QUERY,
  isCriticallyLate,
  memberCodeText,
  NO_PENDING_CHARGES_ADMIN_MESSAGE,
  PENDING_CHARGE_FILTER_OPTIONS,
} from "./pending-charges-logic";
import { PendingChargesView, type PendingChargesViewProps } from "./pending-charges-view";

const noop = () => {};

const criticalCharge: PendingChargeItem = {
  chargeId: 101,
  memberCode: "GYM-000010",
  fullName: "Ana Gómez",
  concept: "Membresía Trimestral",
  amount: 65,
  dueDate: "2026-10-01",
  daysLate: 31,
};

const borderCharge: PendingChargeItem = {
  chargeId: 102,
  memberCode: null,
  fullName: "Luis Méndez",
  concept: "Sesión personal con Coach",
  amount: 15.5,
  dueDate: "2026-10-21",
  daysLate: 30,
};

const currentCharge: PendingChargeItem = {
  chargeId: 103,
  memberCode: "GYM-000025",
  fullName: "Sofía Castro",
  concept: "Membresía Mensual",
  amount: 25,
  dueDate: "2026-11-20",
  daysLate: 0,
};

const samplePage: PendingChargesPage = {
  data: [criticalCharge, borderCharge, currentCharge],
  totalOwed: 1425.5,
  total: 3,
  page: 1,
  pageSize: 20,
};

const render = (props: Partial<PendingChargesViewProps> = {}) =>
  renderToStaticMarkup(
    <PendingChargesView
      typeFilter=""
      loading={false}
      error={null}
      result={samplePage}
      onTypeChange={noop}
      onPageChange={noop}
      onRetry={noop}
      {...props}
    />,
  );

describe("lógica de pagos pendientes (FE-17.1)", () => {
  it("al cambiar el filtro vuelve a la página 1", () => {
    const onPageThree = { page: 3, type: "" as const };
    expect(changePendingChargesFilter(onPageThree, "MEMBERSHIP")).toEqual({
      page: 1,
      type: "MEMBERSHIP",
    });
    expect(changePendingChargesFilter({ page: 2, type: "MEMBERSHIP" }, "PERSONAL_SESSION")).toEqual({
      page: 1,
      type: "PERSONAL_SESSION",
    });
    expect(changePendingChargesFilter({ page: 4, type: "PERSONAL_SESSION" }, "")).toEqual(
      INITIAL_PENDING_CHARGES_QUERY,
    );
  });

  it("mantiene la paginación dentro de los límites", () => {
    expect(totalPages({ total: 0, pageSize: 20 })).toBe(1);
    expect(totalPages({ total: 20, pageSize: 20 })).toBe(1);
    expect(totalPages({ total: 21, pageSize: 20 })).toBe(2);
    expect(totalPages({ total: 45, pageSize: 20 })).toBe(3);

    expect(changePendingChargesPage({ page: 1, type: "" }, 2, 3)).toEqual({ page: 2, type: "" });
    expect(changePendingChargesPage({ page: 1, type: "MEMBERSHIP" }, 0, 3)).toEqual({
      page: 1,
      type: "MEMBERSHIP",
    });
    expect(changePendingChargesPage({ page: 2, type: "" }, 5, 3)).toEqual({ page: 3, type: "" });
  });

  it("resalta solo cuando los días de atraso son mayores a 30", () => {
    expect(isCriticallyLate(0)).toBe(false);
    expect(isCriticallyLate(30)).toBe(false);
    expect(isCriticallyLate(31)).toBe(true);
    expect(isCriticallyLate(90)).toBe(true);
  });

  it("formatea días de atraso, código nulo, montos con 2 decimales y fechas sin desfase", () => {
    expect(daysLateText(0)).toBe("0 días");
    expect(daysLateText(1)).toBe("1 día");
    expect(daysLateText(31)).toBe("31 días");
    expect(memberCodeText(null)).toBe("—");
    expect(memberCodeText("GYM-000010")).toBe("GYM-000010");
    expect(formatOwedAmount(25)).toBe("$25.00");
    expect(formatOwedAmount(1425.5)).toBe("$1,425.50");
    expect(formatChargeDueDate("2026-10-01")).toBe("01/10/2026");
    expect(formatChargeDueDate("2026-12-31")).toBe("31/12/2026");
  });

  it("ofrece exactamente los filtros admitidos por el backend", () => {
    expect(PENDING_CHARGE_FILTER_OPTIONS.map((o) => o.value)).toEqual([
      "",
      "MEMBERSHIP",
      "PERSONAL_SESSION",
    ]);
  });
});

describe("PendingChargesView (FE-17.1)", () => {
  it("muestra la tabla con columnas, código nulo, fechas sin desfase y total adeudado del servidor", () => {
    const html = render();
    for (const heading of [
      "Miembro",
      "Código",
      "Concepto",
      "Monto",
      "Fecha de vencimiento",
      "Días de atraso",
    ]) {
      expect(html).toContain(heading);
    }

    expect(html).toContain("Ana Gómez");
    expect(html).toContain("GYM-000010");
    expect(html).toContain("Membresía Trimestral");
    expect(html).toContain("$65.00");
    expect(html).toContain("01/10/2026");
    expect(html).toContain("31 días");

    // Código null se presenta de forma segura
    expect(html).toContain("Luis Méndez");
    expect(html).toContain(">—<");
    expect(html).toContain("21/10/2026");
    expect(html).toContain("30 días");

    // Total adeudado viene de `totalOwed` (no de sumar solo la página actual) con 2 decimales
    expect(html).toContain("<tfoot");
    expect(html).toContain("Total adeudado");
    expect(html).toContain("$1,425.50");
  });

  it("respeta el orden y los días de atraso enviados por el servidor sin reordenar", () => {
    const unsortedFromServer: PendingChargesPage = {
      ...samplePage,
      data: [currentCharge, criticalCharge],
    };
    const html = render({ result: unsortedFromServer });
    const tbody = html.slice(html.indexOf("<tbody>"), html.indexOf("</tbody>"));
    expect(tbody.indexOf("Sofía Castro")).toBeLessThan(tbody.indexOf("Ana Gómez"));
  });

  it("resalta únicamente los cobros con más de 30 días de atraso", () => {
    const html = render();
    const tbody = html.slice(html.indexOf("<tbody>"), html.indexOf("</tbody>"));
    const anaRow = tbody.slice(tbody.indexOf("<tr"), tbody.indexOf("Luis Méndez"));
    const luisRow = tbody.slice(tbody.indexOf("Luis Méndez"), tbody.indexOf("Sofía Castro"));

    expect(anaRow).toContain('data-critical-overdue="true"');
    expect(anaRow).toContain("bg-red-50/70");
    expect(anaRow).toContain("bg-red-100");
    expect(luisRow).not.toContain('data-critical-overdue="true"');
    expect(luisRow).not.toContain("bg-red-50/70");
  });

  it("muestra el filtro por tipo de cobro con el valor seleccionado", () => {
    const html = render({ typeFilter: "PERSONAL_SESSION" });
    expect(html).toContain('id="pending-charge-type"');
    expect(html).toContain("Todos");
    expect(html).toContain("Membresía");
    expect(html).toContain("Sesión personal");
    expect(html).not.toContain("DROP_IN");
    expect(html).toMatch(/<option value="PERSONAL_SESSION" selected=""/);
  });

  it("muestra paginación cuando supera 20 cobros y deshabilita los extremos", () => {
    const page1 = render({
      result: { ...samplePage, total: 45, page: 1, pageSize: 20 },
    });
    expect(page1).toContain("Página 1 de 3");
    expect(page1).toMatch(/<button type="button" disabled=""[^>]*>Anterior/);
    expect(page1).toMatch(/<button type="button"[^>]*>Siguiente/);
    expect(page1).not.toMatch(/<button type="button" disabled=""[^>]*>Siguiente/);

    const page3 = render({
      result: { ...samplePage, total: 45, page: 3, pageSize: 20 },
    });
    expect(page3).toContain("Página 3 de 3");
    expect(page3).toMatch(/<button type="button" disabled=""[^>]*>Siguiente/);
  });

  it("no muestra paginación cuando cabe en una página", () => {
    const html = render({ result: { ...samplePage, total: 3, page: 1, pageSize: 20 } });
    expect(html).not.toContain("Anterior");
    expect(html).not.toContain("Siguiente");
  });

  it("si no hay resultados muestra exactamente 'No hay pagos pendientes.' y mantiene el filtro", () => {
    const html = render({
      typeFilter: "MEMBERSHIP",
      result: { data: [], totalOwed: 0, total: 0, page: 1, pageSize: 20 },
    });
    expect(html).toContain(NO_PENDING_CHARGES_ADMIN_MESSAGE);
    expect(html).not.toContain("<table");
    expect(html).toContain('id="pending-charge-type"');
  });

  it("maneja los estados de carga inicial, actualización y error con reintento", () => {
    const initialLoading = render({ loading: true, result: null });
    expect(initialLoading).toContain("Cargando pagos pendientes...");
    expect(initialLoading).not.toContain("<table");

    const updating = render({ loading: true, result: { ...samplePage, total: 45, page: 2 } });
    expect(updating).toContain('aria-busy="true"');
    expect(updating).toContain("Actualizando...");

    const failed = render({ error: LOAD_PENDING_CHARGES_ERROR, result: null });
    expect(failed).toContain('role="alert"');
    expect(failed).toContain(LOAD_PENDING_CHARGES_ERROR);
    expect(failed).toContain("Reintentar");
    expect(failed).not.toContain("<table");
  });
});

describe("acceso por rol y navegación (FE-17.1)", () => {
  const makeUser = (role: AuthUser["role"]): AuthUser => ({
    id: "u-1",
    email: "user@gymhub.test",
    fullName: "Usuario Test",
    role,
    mustChangePassword: false,
    isActive: true,
    createdAt: "2026-11-01T00:00:00.000Z",
  });

  it("solo ADMIN ve el enlace a Pagos pendientes en RoleNavigationLinks", () => {
    const admin = renderToStaticMarkup(<RoleNavigationLinks status="authenticated" role="ADMIN" />);
    expect(admin).toContain('href="/admin/pagos-pendientes"');
    expect(admin).toContain("Pagos pendientes");

    for (const role of ["MEMBER", "RECEPTION", "TRAINER"] as const) {
      const html = renderToStaticMarkup(<RoleNavigationLinks status="authenticated" role={role} />);
      expect(html).not.toContain("/admin/pagos-pendientes");
    }
  });

  it("RoleGate y AdminAccessBoundary restringen la pantalla exclusivamente a ADMIN", () => {
    expect(gateDecision("authenticated", "ADMIN", ["ADMIN"])).toBe("allowed");
    for (const role of ["MEMBER", "RECEPTION", "TRAINER"] as const) {
      expect(gateDecision("authenticated", role, ["ADMIN"])).toBe("denied");
      const deniedHtml = renderToStaticMarkup(
        <AdminAccessBoundary status="authenticated" user={makeUser(role)}>
          <span>Contenido admin</span>
        </AdminAccessBoundary>,
      );
      expect(deniedHtml).toContain("Acceso restringido");
      expect(deniedHtml).not.toContain("Contenido admin");
    }

    const allowedHtml = renderToStaticMarkup(
      <AdminAccessBoundary status="authenticated" user={makeUser("ADMIN")}>
        <span>Contenido admin</span>
      </AdminAccessBoundary>,
    );
    expect(allowedHtml).toContain("Contenido admin");
  });
});
