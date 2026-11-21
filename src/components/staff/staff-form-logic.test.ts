import { describe, it, expect } from "vitest";
import { validateStaffForm, EMPTY_STAFF_FORM } from "./staff-form-logic";

describe("Staff Form Logic", () => {
  describe("validateStaffForm", () => {
    it("acepta un formulario válido", () => {
      const values = {
        fullName: "Juan Pérez",
        email: "juan@gym.com",
        role: "TRAINER" as const,
      };

      const errors = validateStaffForm(values);

      expect(Object.keys(errors)).toHaveLength(0);
    });

    it("rechaza nombre vacío", () => {
      const values = { ...EMPTY_STAFF_FORM, fullName: "" };
      const errors = validateStaffForm(values);
      expect(errors.fullName).toBeDefined();
    });

    it("rechaza nombre muy corto", () => {
      const values = { ...EMPTY_STAFF_FORM, fullName: "AB" };
      const errors = validateStaffForm(values);
      expect(errors.fullName).toBeDefined();
    });

    it("rechaza nombre muy largo", () => {
      const values = {
        ...EMPTY_STAFF_FORM,
        fullName: "A".repeat(101),
      };
      const errors = validateStaffForm(values);
      expect(errors.fullName).toBeDefined();
    });

    it("rechaza correo vacío", () => {
      const values = { ...EMPTY_STAFF_FORM, email: "" };
      const errors = validateStaffForm(values);
      expect(errors.email).toBeDefined();
    });

    it("rechaza correo inválido", () => {
      const values = { ...EMPTY_STAFF_FORM, email: "invalid-email" };
      const errors = validateStaffForm(values);
      expect(errors.email).toBeDefined();
    });

    it("rechaza correo muy largo", () => {
      const values = {
        ...EMPTY_STAFF_FORM,
        email: "a".repeat(110) + "@example.com",
      };
      const errors = validateStaffForm(values);
      expect(errors.email).toBeDefined();
    });

    it("rechaza rol inválido", () => {
      const values = {
        fullName: "Juan Pérez",
        email: "juan@gym.com",
        role: "INVALID" as unknown as typeof EMPTY_STAFF_FORM.role,
      };
      const errors = validateStaffForm(values);
      expect(errors.role).toBeDefined();
    });

    it("permite espacios al inicio/final en el nombre", () => {
      const values = {
        ...EMPTY_STAFF_FORM,
        fullName: "  Juan Pérez  ",
      };
      const errors = validateStaffForm(values);
      expect(errors.fullName).toBeUndefined();
    });
  });
});
