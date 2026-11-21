import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminAccessBoundary } from "@/src/components/admin/admin-role-guard";
import { RoleNavigationLinks } from "@/src/components/dashboard/role-navigation";
import type { RatingsReport } from "@/src/types/reports";
import {
  formatRatingAverage,
  isLowRating,
  NO_REVIEWS_IN_RANGE_MESSAGE,
  reviewCountText,
} from "./ratings-report-logic";
import { RatingsReportView, type RatingsReportViewProps } from "./ratings-report-view";

const noop = () => {};

const report: RatingsReport = {
  from: "2026-09-01",
  to: "2026-11-30",
  byTrainer: [
    { trainerId: "t2", trainerName: "Carlos Méndez", averageRating: 2.9, reviewCount: 4 },
    { trainerId: "t1", trainerName: "Ana López", averageRating: 3.0, reviewCount: 2 },
    { trainerId: "t3", trainerName: "Lucía Torres", averageRating: 4.5, reviewCount: 6 },
  ],
  byClassName: [
    { className: "Crossfit", averageRating: 2.5, reviewCount: 2 },
    { className: "Yoga Flow", averageRating: 4.0, reviewCount: 5 },
  ],
  message: null,
};

const emptyReport: RatingsReport = {
  from: "2026-01-01",
  to: "2026-01-31",
  byTrainer: [],
  byClassName: [],
  message: NO_REVIEWS_IN_RANGE_MESSAGE,
};

function renderView(overrides: Partial<RatingsReportViewProps> = {}): string {
  return renderToStaticMarkup(
    <RatingsReportView
      tab="trainer"
      range={{ from: "2026-09-01", to: "2026-11-30" }}
      rangeError={null}
      loading={false}
      loadError={null}
      report={report}
      onChangeTab={noop}
      onChangeRange={noop}
      onPreset={noop}
      onSubmit={noop}
      onRetry={noop}
      {...overrides}
    />,
  );
}

describe("ratings-report-logic (FE-23.1)", () => {
  it("resalta estrictamente promedios menores a 3.0 y no resalta 3.0", () => {
    expect(isLowRating(2.9)).toBe(true);
    expect(isLowRating(1.0)).toBe(true);
    expect(isLowRating(3.0)).toBe(false);
    expect(isLowRating(4.3)).toBe(false);
  });

  it("formatea promedios siempre con un decimal y texto de cantidad", () => {
    expect(formatRatingAverage(3)).toBe("3.0");
    expect(formatRatingAverage(4.3)).toBe("4.3");
    expect(reviewCountText(1)).toBe("1 reseña");
    expect(reviewCountText(5)).toBe("5 reseñas");
  });
});

describe("RatingsReportView (FE-23.1)", () => {
  it("respeta el orden del backend en «Por entrenador», formatea 1 decimal y resalta < 3.0", () => {
    const html = renderView({ tab: "trainer" });

    expect(html).toContain("Por entrenador");
    expect(html).toContain("Por clase");
    expect(html).toContain("2.9");
    expect(html).toContain("3.0");
    expect(html).toContain("4.5");
    expect(html).toContain("Menor a 3.0");

    // Solo Carlos Méndez (< 3.0) debe resaltar, manteniendo el orden exacto recibido.
    expect(html.match(/data-low-rating="true"/g)).toHaveLength(1);
    const carlosPos = html.indexOf("Carlos Méndez");
    const anaPos = html.indexOf("Ana López");
    const luciaPos = html.indexOf("Lucía Torres");
    expect(carlosPos).toBeLessThan(anaPos);
    expect(anaPos).toBeLessThan(luciaPos);
  });

  it("muestra «Por clase» con promedios y resaltado < 3.0", () => {
    const html = renderView({ tab: "class" });

    expect(html).toContain("Crossfit");
    expect(html).toContain("2.5");
    expect(html).toContain("Yoga Flow");
    expect(html).toContain("4.0");
    expect(html.match(/data-low-rating="true"/g)).toHaveLength(1);
  });

  it("muestra exactamente «No hay reseñas en ese rango.» si no hay datos", () => {
    const emptyTrainerHtml = renderView({ report: emptyReport, tab: "trainer" });
    expect(emptyTrainerHtml).toContain(NO_REVIEWS_IN_RANGE_MESSAGE);

    const onlyTrainerReviews: RatingsReport = {
      ...report,
      byClassName: [],
    };
    const emptyClassTabHtml = renderView({ report: onlyTrainerReviews, tab: "class" });
    expect(emptyClassTabHtml).toContain(NO_REVIEWS_IN_RANGE_MESSAGE);
  });

  it("muestra estados de carga, error de rango y error con botón Reintentar", () => {
    expect(renderView({ loading: true, report: null })).toContain("Cargando reporte...");
    expect(renderView({ rangeError: "El rango no puede ser mayor a 12 meses." })).toContain(
      "El rango no puede ser mayor a 12 meses.",
    );
    const errHtml = renderView({ loadError: "Fallo de servidor.", report: null });
    expect(errHtml).toContain("Fallo de servidor.");
    expect(errHtml).toContain("Reintentar");
  });
});

describe("Navegación y permisos ADMIN (FE-23.1)", () => {
  it("muestra «Promedios de calificación» solo a ADMIN", () => {
    const adminHtml = renderToStaticMarkup(
      <RoleNavigationLinks status="authenticated" role="ADMIN" />,
    );
    expect(adminHtml).toContain('href="/admin/reportes/calificaciones"');
    expect(adminHtml).toContain("Promedios de calificación");

    for (const role of ["MEMBER", "TRAINER", "RECEPTION"] as const) {
      const html = renderToStaticMarkup(
        <RoleNavigationLinks status="authenticated" role={role} />,
      );
      expect(html).not.toContain("/admin/reportes/calificaciones");
    }
  });

  it("AdminAccessBoundary bloquea roles no ADMIN", () => {
    const html = renderToStaticMarkup(
      <AdminAccessBoundary
        status="authenticated"
        user={{
          id: "u2",
          fullName: "Carlos",
          email: "c@gym.test",
          role: "MEMBER",
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
