import { afterEach, describe, expect, it, vi } from "vitest";
import { ACCESS_DENIED_MESSAGE } from "@/src/components/access-denied";
import * as apiClient from "@/src/services/http/api-client";
import type { PendingReviewItem, ReviewRecord } from "@/src/types/reviews";
import {
  CREATE_REVIEW_ERROR,
  createReview,
  fetchPendingReviews,
  LOAD_PENDING_REVIEWS_ERROR,
} from "./reviews-service";

const pendingItems: PendingReviewItem[] = [
  {
    targetType: "CLASS",
    targetId: 12,
    title: "Yoga Matutino",
    trainerId: "trainer-1",
    trainerName: "Carlos Méndez",
    startsAt: "2026-11-17T13:00:00.000Z",
    endsAt: "2026-11-17T14:00:00.000Z",
    reviewDeadline: "2026-11-24",
  },
  {
    targetType: "PERSONAL_SESSION",
    targetId: 8,
    title: "Sesión personal",
    trainerId: "trainer-2",
    trainerName: "Lucía Torres",
    startsAt: "2026-11-19T16:00:00.000Z",
    endsAt: "2026-11-19T17:00:00.000Z",
    reviewDeadline: "2026-11-26",
  },
];

const savedReview: ReviewRecord = {
  id: 31,
  targetType: "CLASS",
  targetId: 12,
  title: "Yoga Matutino",
  trainerId: "trainer-1",
  trainerName: "Carlos Méndez",
  rating: 5,
  comment: "Excelente ritmo.",
  createdAt: "2026-11-20T18:00:00.000Z",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchPendingReviews (FE-22.1)", () => {
  it("consulta GET /reviews/pending y retorna la lista del backend sin refiltrar", async () => {
    const spy = vi
      .spyOn(apiClient, "apiFetch")
      .mockResolvedValue(json(200, { data: pendingItems }));

    const result = await fetchPendingReviews();

    expect(spy).toHaveBeenCalledWith("reviews/pending");
    expect(result).toEqual({ ok: true, data: pendingItems, status: 200 });
  });

  it("en 403 retorna ACCESS_DENIED_MESSAGE", async () => {
    vi.spyOn(apiClient, "apiFetch").mockResolvedValue(
      json(403, { message: "Forbidden", statusCode: 403 }),
    );

    const result = await fetchPendingReviews();

    expect(result).toEqual({ ok: false, error: ACCESS_DENIED_MESSAGE, status: 403 });
  });

  it("en 500 o fallo de red retorna el error genérico de carga", async () => {
    vi.spyOn(apiClient, "apiFetch").mockResolvedValueOnce(json(500, {}));
    expect(await fetchPendingReviews()).toEqual({
      ok: false,
      error: LOAD_PENDING_REVIEWS_ERROR,
      status: 500,
    });

    vi.spyOn(apiClient, "apiFetch").mockRejectedValueOnce(new Error("offline"));
    expect(await fetchPendingReviews()).toEqual({
      ok: false,
      error: LOAD_PENDING_REVIEWS_ERROR,
      status: 0,
    });
  });
});

describe("createReview (FE-22.1)", () => {
  it("envía POST /reviews recortando comentario y omitiéndolo si queda vacío", async () => {
    const spy = vi
      .spyOn(apiClient, "apiFetch")
      .mockResolvedValueOnce(json(201, savedReview))
      .mockResolvedValueOnce(json(201, { ...savedReview, comment: null }));

    const withComment = await createReview({
      targetType: "CLASS",
      targetId: 12,
      rating: 5,
      comment: "  Excelente ritmo.  ",
    });

    expect(spy).toHaveBeenNthCalledWith(1, "reviews", {
      method: "POST",
      body: JSON.stringify({
        targetType: "CLASS",
        targetId: 12,
        rating: 5,
        comment: "Excelente ritmo.",
      }),
    });
    expect(withComment).toEqual({ ok: true, data: savedReview, status: 201 });

    await createReview({
      targetType: "CLASS",
      targetId: 12,
      rating: 4,
      comment: "    ",
    });

    expect(spy).toHaveBeenNthCalledWith(2, "reviews", {
      method: "POST",
      body: JSON.stringify({
        targetType: "CLASS",
        targetId: 12,
        rating: 4,
      }),
    });
  });

  it("muestra mensajes reales del backend en 409 (asistencia, plazo vencido o duplicada)", async () => {
    const conflicts = [
      "Solo puedes calificar clases a las que asististe.",
      "El plazo de 7 días para calificar ya venció.",
      "Ya calificaste esta clase o sesión.",
    ];

    for (const message of conflicts) {
      vi.spyOn(apiClient, "apiFetch").mockResolvedValueOnce(json(409, { message }));
      const result = await createReview({ targetType: "CLASS", targetId: 12, rating: 5 });
      expect(result).toEqual({ ok: false, error: message, status: 409 });
    }
  });

  it("en 403 preserva el mensaje real cuando la sesión fue NO_SHOW o no realizada", async () => {
    vi.spyOn(apiClient, "apiFetch").mockResolvedValueOnce(
      json(403, { message: "Solo puedes calificar sesiones que se realizaron." }),
    );

    const result = await createReview({
      targetType: "PERSONAL_SESSION",
      targetId: 8,
      rating: 2,
    });

    expect(result).toEqual({
      ok: false,
      error: "Solo puedes calificar sesiones que se realizaron.",
      status: 403,
    });
  });

  it("en 403 sin cuerpo legible usa ACCESS_DENIED_MESSAGE y en 400/404 muestra el detalle real", async () => {
    vi.spyOn(apiClient, "apiFetch").mockResolvedValueOnce(new Response(null, { status: 403 }));
    expect(
      await createReview({ targetType: "CLASS", targetId: 12, rating: 5 }),
    ).toEqual({ ok: false, error: ACCESS_DENIED_MESSAGE, status: 403 });

    vi.spyOn(apiClient, "apiFetch").mockResolvedValueOnce(
      json(400, { message: ["El comentario no puede superar los 500 caracteres."] }),
    );
    expect(
      await createReview({ targetType: "CLASS", targetId: 12, rating: 5, comment: "x".repeat(501) }),
    ).toEqual({
      ok: false,
      error: "El comentario no puede superar los 500 caracteres.",
      status: 400,
    });

    vi.spyOn(apiClient, "apiFetch").mockResolvedValueOnce(
      json(404, { message: "No encontramos esa clase." }),
    );
    expect(
      await createReview({ targetType: "CLASS", targetId: 999, rating: 5 }),
    ).toEqual({ ok: false, error: "No encontramos esa clase.", status: 404 });
  });

  it("en 500 o error de red devuelve CREATE_REVIEW_ERROR", async () => {
    vi.spyOn(apiClient, "apiFetch").mockResolvedValueOnce(json(500, {}));
    expect(
      await createReview({ targetType: "CLASS", targetId: 12, rating: 5 }),
    ).toEqual({ ok: false, error: CREATE_REVIEW_ERROR, status: 500 });

    vi.spyOn(apiClient, "apiFetch").mockRejectedValueOnce(new Error("timeout"));
    expect(
      await createReview({ targetType: "CLASS", targetId: 12, rating: 5 }),
    ).toEqual({ ok: false, error: CREATE_REVIEW_ERROR, status: 0 });
  });
});
