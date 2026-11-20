// Reportes del administrador (Épica 10). Montos en dólares, ya redondeados por
// el backend a centavos.

/** Ingresos separados por concepto (GET /reports/income). */
export interface IncomeBreakdown {
  /** Membresías (Mensual y Trimestral). */
  membership: number;
  /** Clases sueltas. */
  dropIn: number;
  /** Sesiones personales. */
  personalSession: number;
  total: number;
  /** Comprobantes que suman este total. */
  receiptCount: number;
}

export interface IncomeMonth extends IncomeBreakdown {
  /** YYYY-MM. */
  month: string;
}

/** H29 · BE-29.1. Ingresos de un periodo, por concepto y por mes. */
export interface IncomeReport {
  /** YYYY-MM-DD. */
  from: string;
  /** YYYY-MM-DD. */
  to: string;
  totals: IncomeBreakdown;
  /** Todos los meses del rango, también los que no tuvieron pagos. */
  months: IncomeMonth[];
  /** "No hay pagos en ese rango." cuando no hubo comprobantes; si no, null. */
  message: string | null;
}

export type IncomeConcept = "membership" | "dropIn" | "personalSession";

export const INCOME_CONCEPT_LABELS: Record<IncomeConcept, string> = {
  membership: "Membresías",
  dropIn: "Clases sueltas",
  personalSession: "Sesiones personales",
};
