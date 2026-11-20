import { describe, expect, it } from "vitest";
import { roleHomePath } from "./role-home";

describe("roleHomePath", () => {
  it("envía al entrenador a su jornada", () => {
    expect(roleHomePath("TRAINER")).toBe("/trainer");
  });

  it("usa el dashboard para el resto de roles o sin rol", () => {
    expect(roleHomePath("ADMIN")).toBe("/dashboard");
    expect(roleHomePath("MEMBER")).toBe("/dashboard");
    expect(roleHomePath("RECEPTION")).toBe("/dashboard");
    expect(roleHomePath(null)).toBe("/dashboard");
  });
});
