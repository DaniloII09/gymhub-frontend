import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RoleNavigationLinks } from "@/src/components/dashboard/role-navigation";
import { MemberAccessBoundary } from "@/src/components/member/member-role-guard";
import type { ProgressEvolution } from "@/src/types/progress";
import {
  EMPTY_PROGRESS_DRAFT,
  EMPTY_PROGRESS_MESSAGE,
  formatDelta,
  getProgressSummary,
  PROGRESS_ARM_MESSAGE,
  PROGRESS_CHEST_MESSAGE,
  PROGRESS_FUTURE_DATE_MESSAGE,
  PROGRESS_SAVED_MESSAGE,
  PROGRESS_WAIST_MESSAGE,
  PROGRESS_WEIGHT_MESSAGE,
  SINGLE_ENTRY_NOTE,
  validateProgressDraft,
  weightDeltaTone,
} from "./progress-logic";
import { ProgressView, type ProgressViewProps } from "./progress-view";

const noop = () => {};
// 20/11/2026 21:00 en El Salvador (en UTC ya es 21/11/2026).
const SV_NIGHT = new Date("2026-11-21T03:00:00.000Z");

const singleEvolution: ProgressEvolution = {
  entries: [
    {
      id: 1,
      date: "2026-10-21",
      weightKg: 76,
      chestCm: 98,
      waistCm: 84,
      armCm: 34,
      isBaseline: true,
      createdAt: "2026-10-21T12:00:00.000Z",
      updatedAt: "2026-10-21T12:00:00.000Z",
    },
  ],
  deltas: { weightKg: 0, chestCm: 0, waistCm: 0, armCm: 0 },
};

const multiEvolution: ProgressEvolution = {
  entries: [
    singleEvolution.entries[0],
    {
      id: 2,
      date: "2026-11-18",
      weightKg: 72.5,
      chestCm: 99,
      waistCm: 80.5,
      armCm: 34.8,
      isBaseline: false,
      createdAt: "2026-11-18T12:00:00.000Z",
      updatedAt: "2026-11-18T12:00:00.000Z",
    },
  ],
  deltas: { weightKg: -3.5, chestCm: 1, waistCm: -3.5, armCm: 0.8 },
};

function renderView(overrides: Partial<ProgressViewProps> = {}): string {
  return renderToStaticMarkup(
    <ProgressView
      evolution={multiEvolution}
      loading={false}
      loadError={null}
      draft={EMPTY_PROGRESS_DRAFT}
      fieldErrors={{}}
      submitError={null}
      saving={false}
      savedNotice={false}
      maxDate="2026-11-20"
      onRetry={noop}
      onChangeField={noop}
      onSubmit={noop}
      {...overrides}
    />,
  );
}

describe("validateProgressDraft y helpers (FE-19.1 / FE-19.2)", () => {
  it("acepta hoy en zona El Salvador y valores en límites exactos (20-300 kg, 10-250 cm)", () => {
    const low = validateProgressDraft(
      { date: "2026-11-20", weightKg: "20", chestCm: "10", waistCm: "10", armCm: "10" },
      SV_NIGHT,
    );
    expect(low).toEqual({
      valid: true,
      payload: { date: "2026-11-20", weightKg: 20, chestCm: 10, waistCm: 10, armCm: 10 },
    });

    const high = validateProgressDraft(
      { date: "2026-11-01", weightKg: "300", chestCm: "250", waistCm: "250", armCm: "250" },
      SV_NIGHT,
    );
    expect(high.valid).toBe(true);
  });

  it("rechaza fecha futura (aunque sea mañana UTC si hoy aún es 20/11 en El Salvador)", () => {
    const future = validateProgressDraft(
      { date: "2026-11-21", weightKg: "75", chestCm: "95", waistCm: "80", armCm: "34" },
      SV_NIGHT,
    );
    expect(future).toEqual({
      valid: false,
      errors: { date: PROGRESS_FUTURE_DATE_MESSAGE },
    });
  });

  it("rechaza valores fuera de rango con errores por campo", () => {
    const res = validateProgressDraft(
      { date: "2026-02-29", weightKg: "19.99", chestCm: "250.01", waistCm: "9", armCm: "300" },
      SV_NIGHT,
    );
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.errors).toEqual({
        date: "La fecha 2026-02-29 no existe.",
        weightKg: PROGRESS_WEIGHT_MESSAGE,
        chestCm: PROGRESS_CHEST_MESSAGE,
        waistCm: PROGRESS_WAIST_MESSAGE,
        armCm: PROGRESS_ARM_MESSAGE,
      });
    }
  });

  it("no inventa diferencias con historial vacío o de un único registro y colorea baja de peso", () => {
    expect(getProgressSummary({ entries: [], deltas: null })).toBeNull();
    expect(getProgressSummary(singleEvolution)?.hasDifferences).toBe(false);
    expect(getProgressSummary(multiEvolution)?.hasDifferences).toBe(true);

    expect(formatDelta(-3.5, "kg")).toBe("-3.5 kg");
    expect(formatDelta(1.5, "cm")).toBe("+1.5 cm");
    expect(weightDeltaTone(-3.5)).toBe("positive-loss");
    expect(weightDeltaTone(0)).toBe("neutral");
    expect(weightDeltaTone(1.2)).toBe("neutral");
  });
});

describe("ProgressView y gráficas SVG (FE-19.1 / FE-19.2)", () => {
  it("maneja historial vacío y un único registro sin inventar diferencias", () => {
    const emptyHtml = renderView({ evolution: { entries: [], deltas: null } });
    expect(emptyHtml).toContain(EMPTY_PROGRESS_MESSAGE);
    expect(emptyHtml).not.toContain("<svg");

    const singleHtml = renderView({ evolution: singleEvolution });
    expect(singleHtml).toContain(SINGLE_ENTRY_NOTE);
    expect(singleHtml).toContain("Registro inicial");
    expect(singleHtml).not.toContain("Diferencia:");
    expect(singleHtml).toContain("Evolución del peso");
    expect(singleHtml).not.toContain("NaN");
  });

  it("muestra tarjetas de diferencia (peso negativo en verde), dos gráficas SVG e historial", () => {
    const html = renderView();

    expect(html).toContain("Evolución del peso");
    expect(html).toContain("Evolución de medidas corporales");
    expect(html).toContain("Diferencia: -3.5 kg");
    expect(html).toContain('data-weight-delta-tone="green"');
    expect(html).toContain("Diferencia: +1 cm");
    expect(html).toContain("Primer registro");
    expect(html).toContain("21/10/2026");
    expect(html).toContain("18/11/2026");
  });

  it("renderiza errores por campo, error de fecha duplicada, guardado y estado de error de carga", () => {
    const html = renderView({
      fieldErrors: { date: PROGRESS_FUTURE_DATE_MESSAGE, weightKg: PROGRESS_WEIGHT_MESSAGE },
      submitError: "Ya tienes un registro en esa fecha.",
      savedNotice: true,
      loadError: "No se pudo cargar.",
    });

    expect(html).toContain(PROGRESS_FUTURE_DATE_MESSAGE);
    expect(html).toContain(PROGRESS_WEIGHT_MESSAGE);
    expect(html).toContain("Ya tienes un registro en esa fecha.");
    expect(html).toContain(PROGRESS_SAVED_MESSAGE);
    expect(html).toContain("Reintentar");
  });
});

describe("Navegación y permisos MEMBER (H19)", () => {
  it("muestra «Mi progreso» solo a MEMBER", () => {
    const memberHtml = renderToStaticMarkup(
      <RoleNavigationLinks status="authenticated" role="MEMBER" />,
    );
    expect(memberHtml).toContain('href="/miembro/progreso"');

    for (const role of ["ADMIN", "TRAINER", "RECEPTION"] as const) {
      const html = renderToStaticMarkup(
        <RoleNavigationLinks status="authenticated" role={role} />,
      );
      expect(html).not.toContain("/miembro/progreso");
    }
  });

  it("MemberAccessBoundary bloquea roles no MEMBER", () => {
    const html = renderToStaticMarkup(
      <MemberAccessBoundary
        status="authenticated"
        user={{
          id: "u3",
          fullName: "Admin",
          email: "ad@gym.test",
          role: "ADMIN",
          mustChangePassword: false,
          isActive: true,
          createdAt: "2026-01-01T00:00:00.000Z",
        }}
      >
        <div>Privado Miembro</div>
      </MemberAccessBoundary>,
    );

    expect(html).toContain("Acceso restringido");
    expect(html).not.toContain("Privado Miembro");
  });
});
