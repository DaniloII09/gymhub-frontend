import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RoleNavigationLinks } from "@/src/components/dashboard/role-navigation";
import { NO_CLASSES_MESSAGE } from "@/src/services/reports/reports-service";
import type { ClassOccupancy, OccupancyReport } from "@/src/types/reports";
import {
  formatPercent,
  occupancyBarWidth,
  occupancyHighlights,
  seatsText,
  sessionsText,
} from "./occupancy-report-logic";
import { OccupancyReportView, type OccupancyReportViewProps } from "./occupancy-report-view";

const noop = () => {};

function item(
  name: string,
  confirmedReservations: number,
  capacity: number,
  occupancyPercent: number,
  level: ClassOccupancy["level"],
  sessions = 1,
): ClassOccupancy {
  return { name, sessions, capacity, confirmedReservations, occupancyPercent, level };
}

// Mismo ejemplo que el PR del backend (datos del seed).
const report: OccupancyReport = {
  from: "2026-09-01",
  to: "2026-11-20",
  totals: { classCount: 7, sessions: 9, capacity: 44, confirmedReservations: 20, occupancyPercent: 45.5 },
  classes: [
    item("CrossFit Funcional", 3, 3, 100, "HIGH"),
    item("Spinning Matutino", 6, 8, 75, "HIGH", 2),
    item("Zumba Ritmos", 2, 3, 66.7, "HIGH"),
    item("Boxeo Fitness", 2, 4, 50, null),
    item("Yoga Flow", 5, 10, 50, "LOW", 2),
    item("Pilates Core", 1, 6, 16.7, "LOW"),
    item("HIIT Nocturno", 1, 10, 10, "LOW"),
  ],
};

function renderView(overrides: Partial<OccupancyReportViewProps> = {}): string {
  return renderToStaticMarkup(
    <OccupancyReportView
      range={{ from: "2026-09-01", to: "2026-11-20" }}
      rangeError={null}
      loading={false}
      loadError={null}
      emptyMessage={null}
      report={report}
      onChangeRange={noop}
      onPreset={noop}
      onSubmit={noop}
      onRetry={noop}
      {...overrides}
    />,
  );
}

function textOf(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

describe("textos y cálculos (FE-28.1)", () => {
  it("muestra el porcentaje siempre con un decimal", () => {
    expect(formatPercent(100)).toBe("100.0 %");
    expect(formatPercent(66.7)).toBe("66.7 %");
    expect(formatPercent(50)).toBe("50.0 %");
    expect(formatPercent(0)).toBe("0.0 %");
  });

  it("cuenta clases y lugares en singular y plural", () => {
    expect(sessionsText(1)).toBe("1 clase");
    expect(sessionsText(9)).toBe("9 clases");
    expect(seatsText(1, 1)).toBe("1 de 1 lugar");
    expect(seatsText(20, 44)).toBe("20 de 44 lugares");
  });

  it("la barra va de 0 a 100 y una clase con reservas siempre se ve", () => {
    expect(occupancyBarWidth(0)).toBe(0);
    expect(occupancyBarWidth(0.4)).toBe(2);
    expect(occupancyBarWidth(66.7)).toBe(66.7);
    expect(occupancyBarWidth(100)).toBe(100);
  });

  it("separa las resaltadas: mayor en orden y menor desde la más baja", () => {
    const { high, low } = occupancyHighlights(report.classes);
    expect(high.map((c) => c.name)).toEqual(["CrossFit Funcional", "Spinning Matutino", "Zumba Ritmos"]);
    expect(low.map((c) => c.name)).toEqual(["HIIT Nocturno", "Pilates Core", "Yoga Flow"]);
  });

  it("ninguna clase aparece en los dos grupos", () => {
    const { high, low } = occupancyHighlights(report.classes);
    const names = new Set(high.map((c) => c.name));
    expect(low.some((c) => names.has(c.name))).toBe(false);
  });

  it("con menos de 6 clases usa los niveles del backend sin dejar ninguna sin marcar", () => {
    const few = [item("A", 3, 4, 75, "HIGH"), item("B", 2, 4, 50, "HIGH"), item("C", 1, 4, 25, "LOW")];
    const { high, low } = occupancyHighlights(few);
    expect(high).toHaveLength(2);
    expect(low).toHaveLength(1);
  });
});

describe("OccupancyReportView (FE-28.1)", () => {
  it("muestra la ocupación general, el rango y los totales", () => {
    const text = textOf(renderView());
    expect(text).toContain("Ocupación de las clases");
    expect(text).toContain("Del 01/09/2026 al 20/11/2026");
    expect(text).toContain("45.5 %");
    expect(text).toContain("7 tipos de clase");
    expect(text).toContain("9 clases");
    expect(text).toContain("20 de 44 lugares reservados");
  });

  it("muestra cada clase de mayor a menor, con su porcentaje con un decimal", () => {
    const html = renderView();
    const table = html.slice(html.indexOf("<tbody>"));
    const order = report.classes.map((c) => table.indexOf(`>${c.name}<`));
    expect(order.every((pos) => pos >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(table).toContain("100.0 %");
    expect(table).toContain("66.7 %");
    expect(table).toContain("16.7 %");
  });

  it("con el mismo porcentaje respeta el orden alfabético que manda el backend", () => {
    const html = renderView();
    const table = html.slice(html.indexOf("<tbody>"));
    expect(table.indexOf(">Boxeo Fitness<")).toBeLessThan(table.indexOf(">Yoga Flow<"));
  });

  it("resalta las 3 de mayor y las 3 de menor ocupación", () => {
    const html = renderView();
    const table = html.slice(html.indexOf("<tbody>"));
    expect(table.match(/Mayor ocupación/g)).toHaveLength(3);
    expect(table.match(/Menor ocupación/g)).toHaveLength(3);
    const highBox = textOf(html.slice(html.indexOf('data-testid="highlight-HIGH"'), html.indexOf('data-testid="highlight-LOW"')));
    expect(highBox).toContain("CrossFit Funcional");
    expect(highBox).not.toContain("HIIT Nocturno");
    const lowBox = textOf(html.slice(html.indexOf('data-testid="highlight-LOW"'), html.indexOf("<table")));
    expect(lowBox).toContain("HIIT Nocturno");
    expect(lowBox).not.toContain("CrossFit Funcional");
  });

  it("una clase sin resaltar muestra un guion", () => {
    const html = renderView();
    const table = html.slice(html.indexOf("<tbody>"));
    const boxeo = table.slice(table.indexOf(">Boxeo Fitness<"), table.indexOf(">Yoga Flow<"));
    expect(boxeo).toContain("—");
    expect(boxeo).not.toContain("ocupación</span>");
  });

  it("si el rango no tiene clases muestra el motivo y no la tabla", () => {
    const html = renderView({ report: null, emptyMessage: NO_CLASSES_MESSAGE });
    expect(html).toContain(NO_CLASSES_MESSAGE);
    expect(html).not.toContain("<table");
    expect(html).not.toContain("Reintentar");
  });

  it("muestra el error del rango bajo las fechas", () => {
    const html = renderView({ rangeError: "El rango no puede ser mayor a 12 meses." });
    expect(html).toContain('role="alert"');
    expect(html).toContain("El rango no puede ser mayor a 12 meses.");
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
    const html = renderView({ report: null, loadError: "No pudimos cargar el reporte de ocupación. Intenta de nuevo." });
    expect(html).toContain("No pudimos cargar el reporte de ocupación.");
    expect(html).toContain("Reintentar");
  });

  it("ofrece los atajos de rango", () => {
    const html = renderView();
    expect(html).toContain("Este mes");
    expect(html).toContain("Últimos 3 meses");
    expect(html).toContain("Este año");
  });
});

describe("navegación (FE-28.1)", () => {
  it("el Administrador ve el enlace al reporte de ocupación", () => {
    const html = renderToStaticMarkup(<RoleNavigationLinks status="authenticated" role="ADMIN" />);
    expect(html).toContain('href="/admin/reportes/ocupacion"');
  });

  it.each(["MEMBER", "RECEPTION", "TRAINER"] as const)("%s no ve el enlace", (role) => {
    const html = renderToStaticMarkup(<RoleNavigationLinks status="authenticated" role={role} />);
    expect(html).not.toContain("/admin/reportes/ocupacion");
  });
});
