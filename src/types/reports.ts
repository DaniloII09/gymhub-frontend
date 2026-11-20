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

/** HIGH: de mayor ocupación; LOW: de menor; null: sin resaltar. */
export type OccupancyLevel = "HIGH" | "LOW" | null;

/** Clases con un mismo nombre en el rango (GET /reports/occupancy). */
export interface ClassOccupancy {
  name: string;
  /** Clases con ese nombre que cuentan para el reporte. */
  sessions: number;
  /** Suma del cupo máximo. */
  capacity: number;
  /** Suma de reservas confirmadas. */
  confirmedReservations: number;
  /** Reservas confirmadas / cupo × 100, con un decimal. */
  occupancyPercent: number;
  level: OccupancyLevel;
}

export interface OccupancyTotals {
  /** Clases distintas (por nombre). */
  classCount: number;
  sessions: number;
  capacity: number;
  confirmedReservations: number;
  occupancyPercent: number;
}

/** H28 · BE-28.1. Ocupación de las clases ya terminadas en un rango. */
export interface OccupancyReport {
  /** YYYY-MM-DD. */
  from: string;
  /** YYYY-MM-DD. */
  to: string;
  totals: OccupancyTotals;
  /** De mayor a menor ocupación; con el mismo porcentaje, por nombre. */
  classes: ClassOccupancy[];
}

/** Resumen de vencimientos y renovaciones (H30 · GET /reports/renewal-rate). */
export interface RenewalRateSummary {
  expiredCount: number;
  renewedCount: number;
  /** Porcentaje con un decimal; null cuando expiredCount es 0. */
  renewalRate: number | null;
}

export interface RenewalRateMonth extends RenewalRateSummary {
  /** YYYY-MM. */
  month: string;
}

/** H30 · BE-30.1. Tasa de renovación mensual y del rango para el Administrador. */
export interface RenewalRateReport {
  /** YYYY-MM-DD. */
  from: string;
  /** YYYY-MM-DD. */
  to: string;
  totals: RenewalRateSummary;
  months: RenewalRateMonth[];
  /** "No hay membresías vencidas en ese rango." si no hubo vencimientos; si no, null. */
  message: string | null;
}
