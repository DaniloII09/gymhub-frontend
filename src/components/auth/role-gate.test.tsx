import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ACCESS_DENIED_MESSAGE, AccessDenied } from "@/src/components/access-denied";
import { gateDecision } from "./role-gate";

const ENROLL_ROLES = ["RECEPTION", "ADMIN"] as const;

describe("gateDecision", () => {
  it("espera mientras la sesión se rehidrata", () => {
    expect(gateDecision("loading", null, ENROLL_ROLES)).toBe("loading");
  });

  it.each(["RECEPTION", "ADMIN"] as const)("deja pasar a %s a la inscripción", (role) => {
    expect(gateDecision("authenticated", role, ENROLL_ROLES)).toBe("allowed");
  });

  it.each(["MEMBER", "TRAINER"] as const)("niega la inscripción a %s", (role) => {
    expect(gateDecision("authenticated", role, ENROLL_ROLES)).toBe("denied");
  });

  it("sin sesión espera la redirección a /login en vez de negar", () => {
    expect(gateDecision("unauthenticated", null, ENROLL_ROLES)).toBe("loading");
  });
});

describe("AccessDenied", () => {
  it("muestra el mensaje de la historia", () => {
    expect(renderToStaticMarkup(<AccessDenied />)).toContain(ACCESS_DENIED_MESSAGE);
  });
});

describe("SCRUM-57 · Proteger rutas y menú según rol", () => {
  describe("Criterio 1: Un Miembro que entra a /admin/planes ve acceso denegado", () => {
    it("Un usuario MEMBER debe ver acceso denegado en rutas ADMIN", () => {
      const decision = gateDecision("authenticated", "MEMBER", ["ADMIN"]);
      expect(decision).toBe("denied");
    });
  });

  describe("Criterio 2: Sin sesión, /miembro redirige a /login", () => {
    it("Usuario sin autenticar debe esperar redirección", () => {
      const decision = gateDecision("unauthenticated", null, ["MEMBER"]);
      expect(decision).toBe("loading");
    });
  });

  describe("Criterio 3: Cada rol ve solo sus opciones en menú", () => {
    it("Admin puede acceder a /admin/planes", () => {
      const decision = gateDecision("authenticated", "ADMIN", ["ADMIN"]);
      expect(decision).toBe("allowed");
    });

    it("Member puede acceder a /miembro/clases", () => {
      const decision = gateDecision("authenticated", "MEMBER", ["MEMBER"]);
      expect(decision).toBe("allowed");
    });

    it("Trainer puede acceder a /entrenador/agenda", () => {
      const decision = gateDecision("authenticated", "TRAINER", ["TRAINER"]);
      expect(decision).toBe("allowed");
    });

    it("Reception puede acceder a /recepcion/check-in", () => {
      const decision = gateDecision("authenticated", "RECEPTION", ["RECEPTION"]);
      expect(decision).toBe("allowed");
    });
  });
});
