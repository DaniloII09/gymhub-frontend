import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RoleNavigationLinks } from "@/src/components/dashboard/role-navigation";
import { MemberAccessBoundary } from "@/src/components/member/member-role-guard";
import type { PendingReviewItem } from "@/src/types/reviews";
import {
  COMMENT_TOO_LONG_MESSAGE,
  EMPTY_PENDING_REVIEWS_MESSAGE,
  formatReviewDeadline,
  pendingReviewKey,
  RATING_REQUIRED_MESSAGE,
  REVIEW_SAVED_MESSAGE,
  validateReviewForm,
} from "./pending-reviews-logic";
import { PendingReviewsView, type PendingReviewsViewProps } from "./pending-reviews-view";

const noop = () => {};

const pendingClass: PendingReviewItem = {
  targetType: "CLASS",
  targetId: 12,
  title: "Yoga Matutino",
  trainerId: "trainer-1",
  trainerName: "Carlos Méndez",
  startsAt: "2026-11-17T13:00:00.000Z",
  endsAt: "2026-11-17T14:00:00.000Z",
  reviewDeadline: "2026-11-24",
};

const pendingSession: PendingReviewItem = {
  targetType: "PERSONAL_SESSION",
  targetId: 8,
  title: "Sesión personal",
  trainerId: "trainer-2",
  trainerName: "Lucía Torres",
  startsAt: "2026-11-19T16:00:00.000Z",
  endsAt: "2026-11-19T17:00:00.000Z",
  reviewDeadline: "2026-11-26",
};

function renderView(overrides: Partial<PendingReviewsViewProps> = {}): string {
  return renderToStaticMarkup(
    <PendingReviewsView
      items={[pendingClass, pendingSession]}
      loading={false}
      loadError={null}
      selectedKey={null}
      rating={null}
      comment=""
      formErrors={{}}
      submitError={null}
      submittingKey={null}
      successMessage={null}
      onRetry={noop}
      onStartReview={noop}
      onCancelReview={noop}
      onSelectRating={noop}
      onChangeComment={noop}
      onSubmitReview={noop}
      {...overrides}
    />,
  );
}

describe("validateReviewForm y helpers (FE-22.1)", () => {
  it("exige calificación entre 1 y 5 estrellas", () => {
    expect(validateReviewForm(null, "")).toEqual({ rating: RATING_REQUIRED_MESSAGE });
    expect(validateReviewForm(0, "")).toEqual({ rating: RATING_REQUIRED_MESSAGE });
    expect(validateReviewForm(6, "")).toEqual({ rating: RATING_REQUIRED_MESSAGE });
    expect(validateReviewForm(3.5, "")).toEqual({ rating: RATING_REQUIRED_MESSAGE });
  });

  it("acepta 1..5 estrellas con comentario vacío o de hasta 500 caracteres", () => {
    expect(validateReviewForm(1, "")).toBeNull();
    expect(validateReviewForm(5, "   ")).toBeNull();
    expect(validateReviewForm(4, `  ${"a".repeat(500)}  `)).toBeNull();
  });

  it("rechaza comentarios mayores a 500 caracteres tras recortar espacios", () => {
    expect(validateReviewForm(5, "a".repeat(501))).toEqual({
      comment: COMMENT_TOO_LONG_MESSAGE,
    });
    expect(validateReviewForm(null, "a".repeat(501))).toEqual({
      rating: RATING_REQUIRED_MESSAGE,
      comment: COMMENT_TOO_LONG_MESSAGE,
    });
  });

  it("formatea la fecha límite YYYY-MM-DD como DD/MM/YYYY", () => {
    expect(formatReviewDeadline("2026-11-24")).toBe("24/11/2026");
  });
});

describe("PendingReviewsView (FE-22.1)", () => {
  it("muestra estado de carga, error con reintento y estado vacío", () => {
    const loadingHtml = renderView({ loading: true, items: [] });
    expect(loadingHtml).toContain("Cargando elementos por calificar...");

    const errorHtml = renderView({ loadError: "Error temporal.", items: [] });
    expect(errorHtml).toContain("Error temporal.");
    expect(errorHtml).toContain("Reintentar");

    const emptyHtml = renderView({ items: [] });
    expect(emptyHtml).toContain(EMPTY_PENDING_REVIEWS_MESSAGE);
  });

  it("renderiza clases y sesiones pendientes con nombre, entrenador y fecha límite", () => {
    const html = renderView();

    expect(html).toContain("Clase grupal");
    expect(html).toContain("Yoga Matutino");
    expect(html).toContain("Carlos Méndez");
    expect(html).toContain("24/11/2026");

    expect(html).toContain("Sesión personal");
    expect(html).toContain("Lucía Torres");
    expect(html).toContain("26/11/2026");
  });

  it("renderiza el formulario de 1 a 5 estrellas, errores y bloqueo durante envío", () => {
    const html = renderView({
      selectedKey: pendingReviewKey(pendingClass),
      rating: 4,
      comment: "Buena clase",
      formErrors: { rating: RATING_REQUIRED_MESSAGE, comment: COMMENT_TOO_LONG_MESSAGE },
      submitError: "Ya calificaste esta clase o sesión.",
      submittingKey: pendingReviewKey(pendingClass),
      successMessage: REVIEW_SAVED_MESSAGE,
    });

    expect(html).toContain("1 estrella");
    expect(html).toContain("5 estrellas");
    expect(html).toContain("11/500 caracteres");
    expect(html).toContain(RATING_REQUIRED_MESSAGE);
    expect(html).toContain(COMMENT_TOO_LONG_MESSAGE);
    expect(html).toContain("Ya calificaste esta clase o sesión.");
    expect(html).toContain("Enviando...");
    expect(html).toContain(REVIEW_SAVED_MESSAGE);
  });
});

describe("Navegación y permisos (FE-22.1)", () => {
  it("muestra «Por calificar» solo a MEMBER", () => {
    const memberHtml = renderToStaticMarkup(
      <RoleNavigationLinks status="authenticated" role="MEMBER" />,
    );
    expect(memberHtml).toContain('href="/miembro/por-calificar"');
    expect(memberHtml).toContain("Por calificar");

    for (const role of ["ADMIN", "TRAINER", "RECEPTION"] as const) {
      const html = renderToStaticMarkup(
        <RoleNavigationLinks status="authenticated" role={role} />,
      );
      expect(html).not.toContain("/miembro/por-calificar");
    }
  });

  it("MemberAccessBoundary bloquea roles distintos a MEMBER", () => {
    const html = renderToStaticMarkup(
      <MemberAccessBoundary
        status="authenticated"
        user={{
          id: "u1",
          fullName: "Ana",
          email: "a@gym.test",
          role: "TRAINER",
          mustChangePassword: false,
          isActive: true,
          createdAt: "2026-01-01T00:00:00.000Z",
        }}
      >
        <div>Contenido protegido</div>
      </MemberAccessBoundary>,
    );

    expect(html).toContain("Acceso restringido");
    expect(html).not.toContain("Contenido protegido");
  });
});
