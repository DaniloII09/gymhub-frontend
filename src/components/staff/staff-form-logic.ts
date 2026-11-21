import type { StaffFormErrors, StaffFormValues } from "./staff-form-dialog";

export const EMPTY_STAFF_FORM: StaffFormValues = {
  fullName: "",
  email: "",
  role: "TRAINER",
};

export function validateStaffForm(values: StaffFormValues): StaffFormErrors {
  const errors: StaffFormErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "El nombre es requerido.";
  } else if (values.fullName.trim().length < 3) {
    errors.fullName = "El nombre debe tener al menos 3 caracteres.";
  } else if (values.fullName.length > 100) {
    errors.fullName = "El nombre no puede superar los 100 caracteres.";
  }

  if (!values.email.trim()) {
    errors.email = "El correo es requerido.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "El correo no es válido.";
  } else if (values.email.length > 120) {
    errors.email = "El correo no puede superar los 120 caracteres.";
  }

  if (!values.role || !["TRAINER", "RECEPTION", "ADMIN"].includes(values.role)) {
    errors.role = "El rol es requerido.";
  }

  return errors;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const STAFF_FORM_SAVED_MESSAGE = "Cuenta de personal creada exitosamente.";
