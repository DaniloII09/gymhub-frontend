import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RoleNavigationLinks } from "@/src/components/dashboard/role-navigation";
import type { IncomeReport } from "@/src/types/reports";
import {
  addMonths,
  barPercent,
  conceptShares,
  DATES_REQUIRED_MESSAGE,
  defaultRange,
  formatReportDate,
  monthLabel,
  NO_PAYMENTS_MESSAGE,
  presetRange,
  RANGE_ORDER_MESSAGE,
  RANGE_TOO_LONG_MESSAGE,
  rangeText,
  receiptCountText,
  REPORT_DATE_FORMAT_MESSAGE,
  validateRange,
} from "./income-report-logic";
import { IncomeReportView, type IncomeReportViewProps } from "./income-report-view";

const noop = () => {};
// 20/11/2026 a las 00:30 en El Salvador (en UTC ya es 06:30 del mismo día).
const NOW = new Date("2026-11-20T06:30:00.000Z");
// 1/01/2027 a las 20:00 en El Salvador, pero 2/01 en UTC.
const NEW_YEAR_NIGHT = new Date("2027-01-02T02:00:00.000Z");

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

const empty: IncomeReport = {
  from: "2020-01-01",
  to: "2020-01-31",
  totals: { membership: 0, dropIn: 0, personalSession: 0, total: 0, receiptCount: 0 },
  months: [{ month: "2020-01", membership: 0, dropIn: 0, personalSession: 0, total: 0, receiptCount: 0 }],
  message: NO_PAYMENTS_MESSAGE,
};

function renderView(overrides: Partial<IncomeReportViewProps> = {}): string {
  return renderToStaticMarkup(
    <IncomeReportView
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

describe("validateRange (FE-29.1)", () => {
  it("acepta un rango válido", () => {
    expect(validateRange({ from: "2026-09-01", to: "2026-11-30" })).toBeNull();
  });

  it("acepta un solo día", () => {
    expect(validateRange({ from: "2026-11-20", to: "2026-11-20" })).toBeNull();
  });

  it("pide las dos fechas", () => {
    expect(validateRange({ from: "", to: "2026-11-30" })).toBe(DATES_REQUIRED_MESSAGE);
    expect(validateRange({ from: "2026-09-01", to: "" })).toBe(DATES_REQUIRED_MESSAGE);
  });

  it("rechaza otro formato", () => {
    expect(validateRange({ from: "01/09/2026", to: "2026-11-30" })).toBe(REPORT_DATE_FORMAT_MESSAGE);
  });

  it("rechaza una fecha que no existe", () => {
    expect(validateRange({ from: "2026-02-29", to: "2026-03-10" })).toBe("La fecha 2026-02-29 no existe.");
  });

  it("rechaza inicio posterior al fin", () => {
    expect(validateRange({ from: "2026-11-30", to: "2026-09-01" })).toBe(RANGE_ORDER_MESSAGE);
  });

  it("acepta hasta 12 meses y rechaza la misma fecha del año siguiente", () => {
    expect(validateRange({ from: "2026-01-01", to: "2026-12-31" })).toBeNull();
    expect(validateRange({ from: "2026-01-01", to: "2027-01-01" })).toBe(RANGE_TOO_LONG_MESSAGE);
  });
});

describe("rangos y textos (FE-29.1)", () => {
  it("addMonths usa el último día cuando el día no existe", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-11-01", -2)).toBe("2026-09-01");
    expect(addMonths("2026-01-01", -1)).toBe("2025-12-01");
  });

  it("la pantalla abre con los últimos 3 meses hasta hoy", () => {
    expect(defaultRange(NOW)).toEqual({ from: "2026-09-01", to: "2026-11-20" });
  });

  it("los atajos usan la fecha de El Salvador", () => {
    expect(presetRange("thisMonth", NOW)).toEqual({ from: "2026-11-01", to: "2026-11-20" });
    expect(presetRange("thisYear", NOW)).toEqual({ from: "2026-01-01", to: "2026-11-20" });
    // En UTC ya es 2/01/2027, pero en el gimnasio sigue siendo 1/01.
    expect(presetRange("thisMonth", NEW_YEAR_NIGHT)).toEqual({ from: "2027-01-01", to: "2027-01-01" });
    expect(presetRange("last3Months", NEW_YEAR_NIGHT)).toEqual({ from: "2026-11-01", to: "2027-01-01" });
  });

  it("los atajos siempre son rangos válidos", () => {
    for (const preset of ["thisMonth", "last3Months", "thisYear"] as const) {
      expect(validateRange(presetRange(preset, NOW))).toBeNull();
    }
  });

  it("formatea meses y fechas sin correr el día", () => {
    expect(monthLabel("2026-09")).toBe("Septiembre 2026");
    expect(formatReportDate("2026-09-01")).toBe("01/09/2026");
    expect(rangeText(report)).toBe("Del 01/09/2026 al 30/11/2026");
  });

  it("cuenta comprobantes en singular y plural", () => {
    expect(receiptCountText(1)).toBe("1 comprobante");
    expect(receiptCountText(7)).toBe("7 comprobantes");
  });

  it("calcula la parte de cada concepto", () => {
    expect(conceptShares(report.totals).map((s) => [s.label, s.amount, s.percent])).toEqual([
      ["Membresías", 110, 73],
      ["Clases sueltas", 10, 7],
      ["Sesiones personales", 30, 20],
    ]);
    expect(conceptShares(empty.totals).every((s) => s.percent === 0)).toBe(true);
  });

  it("la barra de cada mes es relativa al mes más alto", () => {
    expect(barPercent(120, 120)).toBe(100);
    expect(barPercent(30, 120)).toBe(25);
    expect(barPercent(0, 120)).toBe(0);
    expect(barPercent(0, 0)).toBe(0);
  });
});

describe("IncomeReportView (FE-29.1)", () => {
  it("muestra el total, los tres conceptos y el rango", () => {
    const html = renderView();
    expect(html).toContain("Del 01/09/2026 al 30/11/2026");
    expect(html).toContain("$150.00");
    expect(html).toContain("7 comprobantes");
    expect(html).toContain("Membresías");
    expect(html).toContain("$110.00");
    expect(html).toContain("Clases sueltas");
    expect(html).toContain("Sesiones personales");
    expect(html).toContain("73% del total");
  });

  it("muestra un renglón por mes, también los meses sin pagos, y la fila de total", () => {
    const html = renderView();
    expect(html).toContain("Septiembre 2026");
    expect(html).toContain("Octubre 2026");
    expect(html).toContain("Noviembre 2026");
    expect(html).toContain("$120.00");
    expect(html).toContain("<tfoot");
  });

  it("sin pagos muestra $0.00 y el mensaje del servidor", () => {
    const html = renderView({ report: empty, range: { from: "2020-01-01", to: "2020-01-31" } });
    expect(html).toContain("$0.00");
    expect(html).toContain(NO_PAYMENTS_MESSAGE);
  });

  it("con datos no muestra el mensaje de sin pagos", () => {
    expect(renderView()).not.toContain(NO_PAYMENTS_MESSAGE);
  });

  it("muestra el error del rango bajo las fechas", () => {
    const html = renderView({ rangeError: RANGE_TOO_LONG_MESSAGE });
    expect(html).toContain('role="alert"');
    expect(html).toContain(RANGE_TOO_LONG_MESSAGE);
    expect(html).toContain('aria-invalid="true"');
  });

  it("mientras consulta deshabilita el botón", () => {
    const html = renderView({ loading: true });
    expect(html).toContain("Consultando...");
    expect(html).toMatch(/<button type="submit" disabled=""/);
  });

  it("en la primera carga muestra el aviso de carga", () => {
    const html = renderView({ loading: true, report: null });
    expect(html).toContain("Cargando reporte...");
  });

  it("si falla la carga muestra el error y el botón de reintentar", () => {
    const html = renderView({ loadError: "No pudimos cargar el reporte de ingresos. Intenta de nuevo." });
    expect(html).toContain("No pudimos cargar el reporte de ingresos. Intenta de nuevo.");
    expect(html).toContain("Reintentar");
    expect(html).not.toContain("Ingresos por mes");
  });

  it("ofrece los atajos de rango", () => {
    const html = renderView();
    expect(html).toContain("Este mes");
    expect(html).toContain("Últimos 3 meses");
    expect(html).toContain("Este año");
  });
});

describe("navegación (FE-29.1)", () => {
  it("el Administrador ve el enlace al reporte de ingresos", () => {
    const html = renderToStaticMarkup(<RoleNavigationLinks status="authenticated" role="ADMIN" />);
    expect(html).toContain('href="/admin/reportes/ingresos"');
  });

  it.each(["MEMBER", "RECEPTION", "TRAINER"] as const)("%s no ve el enlace", (role) => {
    const html = renderToStaticMarkup(<RoleNavigationLinks status="authenticated" role={role} />);
    expect(html).not.toContain("/admin/reportes/ingresos");
  });
});
