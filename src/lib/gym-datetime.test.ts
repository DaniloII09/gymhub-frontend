import { describe, expect, it } from "vitest";
import {
  buildTrainerSlotsRange,
  formatGymDayHeading,
  formatGymShortDate,
  formatGymTime,
  formatUsdPrice,
  getGymDateKey,
  MS_PER_DAY,
} from "./gym-datetime";

describe("gym-datetime (H11)", () => {
  it("buildTrainerSlotsRange construye un intervalo de 14 días y nunca 15", () => {
    const now = new Date("2026-11-18T12:00:00.000Z");
    const { from, to } = buildTrainerSlotsRange(now);

    expect(to.getTime() - from.getTime()).toBe(14 * MS_PER_DAY);
  });

  it("presenta fechas y horas en America/El_Salvador sin desfase UTC", () => {
    const utcNight = "2026-11-24T02:00:00.000Z"; // 23 nov 20:00 SV

    expect(getGymDateKey(utcNight)).toBe("2026-11-23");
    expect(formatGymTime(utcNight)).toBe("20:00");
    expect(formatGymShortDate(utcNight)).toBe("23/11/2026");

    const heading = formatGymDayHeading("2026-11-23");
    expect(heading.toLowerCase()).toContain("23");
    expect(heading.toLowerCase()).toContain("noviembre");
  });

  it("formatea tarifas USD correctamente", () => {
    expect(formatUsdPrice(15)).toBe("$15.00");
    expect(formatUsdPrice(22.5)).toBe("$22.50");
  });
});
