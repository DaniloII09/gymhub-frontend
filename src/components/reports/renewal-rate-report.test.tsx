import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminAccessBoundary } from "@/src/components/admin/admin-role-guard";
import { RoleNavigationLinks } from "@/src/components/dashboard/role-navigation";
import type { RenewalRateReport } from "@/src/types/reports";
import {
  RANGE_ORDER_MESSAGE,
  RANGE_TOO_LONG_MESSAGE,
  REPORT_DATE_FORMAT_MESSAGE,
  validateRange,
} from "./income-report-logic";
import {
  EMPTY_RENEWAL_RANGE_MESSAGE,
  formatRenewalRate,
  NO_RENEWAL_DATA_LABEL,
  renewalBarPercent,
} from "./renewal-rate-logic";
import {
  RenewalRateReportView,
  type RenewalRateReportViewProps,
} from "./renewal-rate-report-view";

const noop = () => {};

const report: RenewalRateReport = {
  from: "2026-09-01",
  to: "2026-11-30",
  totals: { expiredCount: 12, renewedCount: 9, renewalRate: 75 },
  months: [
    { month: "2026-09", expiredCount: 5, renewedCount: 4, renewalRate: 80 },
    { month: "2026-10", expiredCount: 0, renewedCount: 0, renewalRate: null },
    { month: "2026-11", expiredCount: 7, renewedCount: 5, renewalRate: 71.4 },
  ],
  message: null,
};

const emptyReport: RenewalRateReport = {
  from: "2020-01-01",
  to: "2020-03-31",
  totals: { expiredCount: 0, renewedCount: 0, renewalRate: null },
  months: [
    { month: "2020-01", expiredCount: 0, renewedCount: 0, renewalRate: null },
    { month: "2020-02", expiredCount: 0, renewedCount: 0, renewalRate: null },
    { month: "2020-03", expiredCount: 0, renewedCount: 0, renewalRate: null },
  ],
  message: EMPTY_RENEWAL_RANGE_MESSAGE,
};

function renderView(overrides: Partial<RenewalRateReportViewProps> = {}): string {
  return renderToStaticMarkup(
    <RenewalRateReportView
      range={{ from: "2026-09-01", to: "2026-11-30" }}
      rangeError={null}
      loading={false}
      loadError={null}
      report={report}
      onChangeRange={noop}
      onPreset={noop}
      onSubmit={noop}
      onRetry={noop}
      {...overrides}
    />,
  );
}

describe("renewal-rate-logic y validaciones de rango (FE-30.1)", () => {
  it("muestra «Sin datos» cuando no hay vencimientos y 1 decimal cuando sí los hay", () => {
    expect(formatRenewalRate(null, 0)).toBe(NO_RENEWAL_DATA_LABEL);
    expect(formatRenewalRate(0, 0)).toBe(NO_RENEWAL_DATA_LABEL);
    expect(formatRenewalRate(0, 3)).toBe("0.0%");
    expect(formatRenewalRate(75, 4)).toBe("75.0%");
    expect(formatRenewalRate(71.4, 7)).toBe("71.4%");

    expect(renewalBarPercent(null, 0)).toBe(0);
    expect(renewalBarPercent(0, 3)).toBe(0);
    expect(renewalBarPercent(75, 4)).toBe(75);
  });

  it("detecta fechas inválidas, inicio posterior al fin y rango mayor a 12 meses", () => {
    expect(validateRange({ from: "01-09-2026", to: "2026-11-30" })).toBe(
      REPORT_DATE_FORMAT_MESSAGE,
    );
    expect(validateRange({ from: "2026-02-29", to: "2026-03-10" })).toBe(
      "La fecha 2026-02-29 no existe.",
    );
    expect(validateRange({ from: "2026-12-01", to: "2026-11-01" })).toBe(RANGE_ORDER_MESSAGE);
    expect(validateRange({ from: "2026-01-01", to: "2027-01-01" })).toBe(RANGE_TOO_LONG_MESSAGE);
  });
});

describe("RenewalRateReportView (FE-30.1)", () => {
  it("renderiza tarjetas de vencidas, renovadas y tasa, gráfica mensual y «Sin datos» sin 0%", () => {
    const html = renderView();

    expect(html).toContain("Membresías vencidas");
    expect(html).toContain("12");
    expect(html).toContain("9");
    expect(html).toContain("75.0%");
    expect(html).toContain("80.0%");
    expect(html).toContain("71.4%");
    expect(html).toContain(NO_RENEWAL_DATA_LABEL);
    expect(html).toContain('data-month-status="no-data"');
    expect(html).not.toContain(">0.0%<");
    expect(html).not.toContain(">0%<");
  });

  it("cuando todo el rango carece de vencimientos muestra «No hay membresías vencidas en ese rango.»", () => {
    const html = renderView({ report: emptyReport });

    expect(html).toContain(EMPTY_RENEWAL_RANGE_MESSAGE);
    expect(html).toContain(NO_RENEWAL_DATA_LABEL);
    expect(html).not.toContain("Gráfica de barras mensual (%)");
  });

  it("muestra carga, errores de fecha y botón Reintentar en fallo de servidor", () => {
    expect(renderView({ loading: true, report: null })).toContain("Cargando reporte...");
    expect(renderView({ rangeError: RANGE_TOO_LONG_MESSAGE })).toContain(RANGE_TOO_LONG_MESSAGE);

    const errHtml = renderView({ loadError: "Error de servidor.", report: null });
    expect(errHtml).toContain("Error de servidor.");
    expect(errHtml).toContain("Reintentar");
  });
});

describe("Navegación y permisos ADMIN (FE-30.1)", () => {
  it("muestra «Tasa de renovación» solo a ADMIN", () => {
    const adminHtml = renderToStaticMarkup(
      <RoleNavigationLinks status="authenticated" role="ADMIN" />,
    );
    expect(adminHtml).toContain('href="/admin/reportes/renovaciones"');
    expect(adminHtml).toContain("Tasa de renovación");

    for (const role of ["MEMBER", "TRAINER", "RECEPTION"] as const) {
      const html = renderToStaticMarkup(
        <RoleNavigationLinks status="authenticated" role={role} />,
      );
      expect(html).not.toContain("/admin/reportes/renovaciones");
    }
  });

  it("AdminAccessBoundary restringe la pantalla a ADMIN", () => {
    const html = renderToStaticMarkup(
      <AdminAccessBoundary
        status="authenticated"
        user={{
          id: "u4",
          fullName: "Recepción",
          email: "r@gym.test",
          role: "RECEPTION",
          mustChangePassword: false,
          isActive: true,
          createdAt: "2026-01-01T00:00:00.000Z",
        }}
      >
        <div>Solo Admin</div>
      </AdminAccessBoundary>,
    );

    expect(html).toContain("Acceso restringido");
    expect(html).not.toContain("Solo Admin");
  });
});
