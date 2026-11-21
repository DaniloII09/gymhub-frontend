import type { ClassOccupancy, OccupancyLevel } from "@/src/types/reports";

/** Texto de cada nivel de resaltado del backend (H28). */
export const OCCUPANCY_LEVEL_LABELS: Record<Exclude<OccupancyLevel, null>, string> = {
  HIGH: "Mayor ocupación",
  LOW: "Menor ocupación",
};

/** 66.7 → "66.7 %"; 100 → "100.0 %". Siempre con un decimal, como pide la card. */
export function formatPercent(percent: number): string {
  return `${percent.toFixed(1)} %`;
}

export function sessionsText(count: number): string {
  return count === 1 ? "1 clase" : `${count} clases`;
}

/** "6 de 8 lugares". */
export function seatsText(confirmed: number, capacity: number): string {
  return `${confirmed} de ${capacity} ${capacity === 1 ? "lugar" : "lugares"}`;
}

/** Ancho de la barra, de 0 a 100; una clase con alguna reserva siempre se ve. */
export function occupancyBarWidth(percent: number): number {
  if (percent <= 0) return 0;
  return Math.min(100, Math.max(2, percent));
}

export interface OccupancyHighlights {
  high: ClassOccupancy[];
  /** De la menos ocupada a la más ocupada del grupo. */
  low: ClassOccupancy[];
}

/** Clases resaltadas por el backend, separadas por nivel. */
export function occupancyHighlights(classes: ClassOccupancy[]): OccupancyHighlights {
  return {
    high: classes.filter((item) => item.level === "HIGH"),
    low: classes.filter((item) => item.level === "LOW").reverse(),
  };
}
