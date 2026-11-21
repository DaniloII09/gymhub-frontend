import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RoleNavigationLinks } from "@/src/components/dashboard/role-navigation";
import { MemberAccessBoundary } from "@/src/components/member/member-role-guard";
import { TrainerAccessBoundary } from "@/src/components/trainer/trainer-role-guard";
import { ROUTINE_EXERCISES_MAX, type RoutineRecord } from "@/src/types/routines";
import type { TrainerAgendaSession } from "@/src/types/trainer-agenda";
import { MemberRoutinesView } from "./member-routines-view";
import {
  collectTrainerMembers,
  createEmptyRoutineDraft,
  createExerciseDraft,
  draftFromRoutine,
  EMPTY_MEMBER_ROUTINES_MESSAGE,
  EMPTY_TRAINER_ROUTINES_MESSAGE,
  EXERCISE_NAME_MESSAGE,
  EXERCISE_REPS_MESSAGE,
  EXERCISE_SETS_MESSAGE,
  EXERCISE_WEIGHT_MESSAGE,
  formatRoutineDays,
  formatWeightKg,
  ROUTINE_DAYS_MESSAGE,
  ROUTINE_EXERCISES_MESSAGE,
  ROUTINE_MEMBER_MESSAGE,
  ROUTINE_NAME_MESSAGE,
  toggleRoutineDay,
  validateRoutineDraft,
  type RoutineDraft,
} from "./routine-form-logic";
import { TrainerRoutinesView, type TrainerRoutinesViewProps } from "./trainer-routines-view";

const noop = () => {};
const MEMBER_ID = "11111111-1111-4111-8111-111111111111";

const sampleRoutine: RoutineRecord = {
  id: 7,
  name: "Hipertrofia Base",
  daysOfWeek: [1, 3, 5],
  trainer: { id: "trainer-1", fullName: "Entrenador Demo" },
  member: { id: MEMBER_ID, fullName: "Juan Pérez", memberCode: "GYM-000001" },
  exercises: [
    { id: 1, sortOrder: 1, name: "Sentadilla", sets: 4, reps: 10, suggestedWeightKg: 60 },
    { id: 2, sortOrder: 2, name: "Plancha", sets: 3, reps: 40, suggestedWeightKg: 0 },
  ],
  createdAt: "2026-11-20T10:00:00.000Z",
  updatedAt: "2026-11-20T10:00:00.000Z",
};

function validDraft(): RoutineDraft {
  return {
    name: "Fuerza Inicial",
    memberId: MEMBER_ID,
    daysOfWeek: [1, 5],
    exercises: [
      createExerciseDraft({
        name: "Press de banca",
        sets: "4",
        reps: "12",
        suggestedWeightKg: "50",
      }),
    ],
  };
}

function renderTrainerView(overrides: Partial<TrainerRoutinesViewProps> = {}): string {
  return renderToStaticMarkup(
    <TrainerRoutinesView
      routines={[sampleRoutine]}
      memberOptions={[{ id: MEMBER_ID, fullName: "Juan Pérez", memberCode: "GYM-000001" }]}
      loading={false}
      loadError={null}
      editingId={null}
      draft={createEmptyRoutineDraft()}
      errors={{ exerciseRows: {} }}
      submitError={null}
      successMessage={null}
      saving={false}
      confirmDeleteId={null}
      deletingId={null}
      onRetry={noop}
      onChangeName={noop}
      onChangeMemberId={noop}
      onToggleDay={noop}
      onAddExercise={noop}
      onRemoveExercise={noop}
      onChangeExercise={noop}
      onSubmit={noop}
      onStartEdit={noop}
      onCancelEdit={noop}
      onRequestDelete={noop}
      onConfirmDelete={noop}
      {...overrides}
    />,
  );
}

describe("validateRoutineDraft y helpers (FE-18.1)", () => {
  it("acepta valores válidos en límites inferiores y superiores", () => {
    const maxExercises = Array.from({ length: ROUTINE_EXERCISES_MAX }, (_, idx) =>
      createExerciseDraft({
        name: `Ejercicio ${idx + 1}`,
        sets: idx === 0 ? "1" : "10",
        reps: idx === 0 ? "1" : "50",
        suggestedWeightKg: idx === 0 ? "0" : "300",
      }),
    );

    const res = validateRoutineDraft({
      name: "ABC",
      memberId: MEMBER_ID,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      exercises: maxExercises,
    });

    expect(res.valid).toBe(true);
    if (res.valid) {
      expect(res.payload.exercises).toHaveLength(15);
      expect(res.payload.daysOfWeek).toEqual([1, 2, 3, 4, 5, 6, 7]);
    }

    expect(validateRoutineDraft({ ...validDraft(), name: "A".repeat(60) }).valid).toBe(true);
  });

  it("rechaza nombre, miembro y días fuera de rango antes de enviar", () => {
    const shortName = validateRoutineDraft({ ...validDraft(), name: "AB" });
    expect(shortName.valid).toBe(false);
    if (!shortName.valid) expect(shortName.errors.name).toBe(ROUTINE_NAME_MESSAGE);

    const longName = validateRoutineDraft({ ...validDraft(), name: "A".repeat(61) });
    expect(longName.valid).toBe(false);
    if (!longName.valid) expect(longName.errors.name).toBe(ROUTINE_NAME_MESSAGE);

    const badMember = validateRoutineDraft({ ...validDraft(), memberId: "no-uuid" });
    expect(badMember.valid).toBe(false);
    if (!badMember.valid) expect(badMember.errors.memberId).toBe(ROUTINE_MEMBER_MESSAGE);

    const noDays = validateRoutineDraft({ ...validDraft(), daysOfWeek: [] });
    expect(noDays.valid).toBe(false);
    if (!noDays.valid) expect(noDays.errors.daysOfWeek).toBe(ROUTINE_DAYS_MESSAGE);
  });

  it("rechaza 0 o >15 ejercicios y marca fila + campos inválidos individualmente", () => {
    const emptyExercises = validateRoutineDraft({ ...validDraft(), exercises: [] });
    expect(emptyExercises.valid).toBe(false);
    if (!emptyExercises.valid) {
      expect(emptyExercises.errors.exercises).toBe(ROUTINE_EXERCISES_MESSAGE);
    }

    const tooMany = validateRoutineDraft({
      ...validDraft(),
      exercises: Array.from({ length: 16 }, () =>
        createExerciseDraft({ name: "Sentadilla", sets: "3", reps: "10", suggestedWeightKg: "20" }),
      ),
    });
    expect(tooMany.valid).toBe(false);
    if (!tooMany.valid) {
      expect(tooMany.errors.exercises).toBe(ROUTINE_EXERCISES_MESSAGE);
    }

    const perRow = validateRoutineDraft({
      ...validDraft(),
      exercises: [
        createExerciseDraft({ name: "Sentadilla", sets: "4", reps: "10", suggestedWeightKg: "60" }),
        createExerciseDraft({ name: "   ", sets: "0", reps: "51", suggestedWeightKg: "301" }),
      ],
    });
    expect(perRow.valid).toBe(false);
    if (!perRow.valid) {
      expect(perRow.errors.exerciseRows[0]).toBeUndefined();
      expect(perRow.errors.exerciseRows[1]).toEqual({
        name: EXERCISE_NAME_MESSAGE,
        sets: EXERCISE_SETS_MESSAGE,
        reps: EXERCISE_REPS_MESSAGE,
        suggestedWeightKg: EXERCISE_WEIGHT_MESSAGE,
      });
    }
  });

  it("calcula días, formatos y deduplica miembros visibles del entrenador", () => {
    expect(toggleRoutineDay([1, 5], 3)).toEqual([1, 3, 5]);
    expect(toggleRoutineDay([1, 3, 5], 3)).toEqual([1, 5]);
    expect(formatRoutineDays([5, 1])).toBe("Lunes, Viernes");
    expect(formatWeightKg(0)).toBe("0 kg");
    expect(formatWeightKg(62.5)).toBe("62.5 kg");

    const sessions: TrainerAgendaSession[] = [
      {
        id: 1,
        startsAt: "2026-11-21T14:00:00.000Z",
        endsAt: "2026-11-21T15:00:00.000Z",
        member: { id: MEMBER_ID, fullName: "Juan Pérez", email: "j@gym.test" },
        chargeStatus: "PAID",
        status: "SCHEDULED",
        outcome: null,
        resultRecordedAt: null,
      },
      {
        id: 2,
        startsAt: "2026-11-21T16:00:00.000Z",
        endsAt: "2026-11-21T17:00:00.000Z",
        member: { id: "22222222-2222-4222-8222-222222222222", fullName: "Ana Gómez", email: "a@gym.test" },
        chargeStatus: "PAID",
        status: "SCHEDULED",
        outcome: null,
        resultRecordedAt: null,
      },
    ];

    expect(collectTrainerMembers(sessions, [sampleRoutine])).toEqual([
      { id: "22222222-2222-4222-8222-222222222222", fullName: "Ana Gómez", memberCode: null },
      { id: MEMBER_ID, fullName: "Juan Pérez", memberCode: "GYM-000001" },
    ]);
    expect(draftFromRoutine(sampleRoutine).exercises).toHaveLength(2);
  });
});

describe("Vistas TrainerRoutinesView y MemberRoutinesView (H18)", () => {
  it("marca visualmente filas y campos inválidos, bloquea >15 ejercicios y muestra error 403", () => {
    const html = renderTrainerView({
      editingId: 99,
      draft: {
        ...validDraft(),
        exercises: Array.from({ length: 15 }, (_, idx) =>
          createExerciseDraft({ name: `Ej ${idx}`, sets: "3", reps: "10", suggestedWeightKg: "10" }),
        ),
      },
      errors: {
        exerciseRows: {
          1: { sets: EXERCISE_SETS_MESSAGE },
        },
      },
      submitError: "No puedes modificar una rutina de otro entrenador.",
    });

    expect(html).toContain("Editar rutina #99");
    expect(html).toContain('data-invalid-row="true"');
    expect(html).toContain("Fila inválida");
    expect(html).toContain(EXERCISE_SETS_MESSAGE);
    expect(html).toContain("Alcanzaste el máximo de 15 ejercicios por rutina.");
    expect(html).toContain("No puedes modificar una rutina de otro entrenador.");
  });

  it("muestra estado vacío en lista del entrenador y solo lectura en Mi rutina", () => {
    expect(renderTrainerView({ routines: [] })).toContain(EMPTY_TRAINER_ROUTINES_MESSAGE);

    const memberEmptyHtml = renderToStaticMarkup(
      <MemberRoutinesView routines={[]} loading={false} loadError={null} onRetry={noop} />,
    );
    expect(memberEmptyHtml).toContain(EMPTY_MEMBER_ROUTINES_MESSAGE);

    const memberHtml = renderToStaticMarkup(
      <MemberRoutinesView
        routines={[sampleRoutine]}
        loading={false}
        loadError={null}
        onRetry={noop}
      />,
    );
    expect(memberHtml).toContain("Hipertrofia Base");
    expect(memberHtml).toContain("Entrenador Demo");
    expect(memberHtml).toContain("Lunes, Miércoles, Viernes");
    expect(memberHtml).toContain("Sentadilla");
    expect(memberHtml).toContain("60 kg");
    expect(memberHtml).toContain("0 kg");
    expect(memberHtml).not.toContain("Asignar rutina");
    expect(memberHtml).not.toContain("Editar");
  });
});

describe("Navegación y guards de rol (H18)", () => {
  it("muestra /entrenador/rutinas solo a TRAINER y /miembro/rutina solo a MEMBER", () => {
    const trainerHtml = renderToStaticMarkup(
      <RoleNavigationLinks status="authenticated" role="TRAINER" />,
    );
    expect(trainerHtml).toContain('href="/entrenador/rutinas"');
    expect(trainerHtml).toContain('href="/entrenador/agenda"');
    expect(trainerHtml).not.toContain("/miembro/rutina");

    const memberHtml = renderToStaticMarkup(
      <RoleNavigationLinks status="authenticated" role="MEMBER" />,
    );
    expect(memberHtml).toContain('href="/miembro/rutina"');
    expect(memberHtml).not.toContain("/entrenador/rutinas");
  });

  it("guards bloquean roles no autorizados", () => {
    const trainerGuardHtml = renderToStaticMarkup(
      <TrainerAccessBoundary
        status="authenticated"
        user={{
          id: "u1",
          fullName: "Juan",
          email: "j@gym.test",
          role: "MEMBER",
          mustChangePassword: false,
          isActive: true,
          createdAt: "2026-01-01T00:00:00.000Z",
        }}
      >
        <div>Privado Trainer</div>
      </TrainerAccessBoundary>,
    );
    expect(trainerGuardHtml).toContain("Acceso restringido");
    expect(trainerGuardHtml).not.toContain("Privado Trainer");

    const memberGuardHtml = renderToStaticMarkup(
      <MemberAccessBoundary
        status="authenticated"
        user={{
          id: "u2",
          fullName: "Coach",
          email: "c@gym.test",
          role: "TRAINER",
          mustChangePassword: false,
          isActive: true,
          createdAt: "2026-01-01T00:00:00.000Z",
        }}
      >
        <div>Privado Member</div>
      </MemberAccessBoundary>,
    );
    expect(memberGuardHtml).toContain("Acceso restringido");
    expect(memberGuardHtml).not.toContain("Privado Member");
  });
});
