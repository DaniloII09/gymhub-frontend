import { describe, expect, it } from "vitest";
import {
  buildMemberClassesRange,
  formatGymDayHeading,
  formatGymShortDate,
  formatGymTime,
  getGymDateKey,
  MS_PER_DAY,
} from "./gym-datetime";

describe("gym-datetime (H07)", () => {
  it("buildMemberClassesRange genera un intervalo exacto de 7 días y nunca 8", () => {
    const now = new Date("2026-11-18T15:30:00.000Z");
    const { from, to } = buildMemberClassesRange(now);

    expect(from.toISOString()).toBe("2026-11-18T15:30:00.000Z");
    expect(to.getTime() - from.getTime()).toBe(7 * MS_PER_DAY);
  });

  it("convierte fechas ISO nocturnas sin desfase de día por UTC (America/El_Salvador)", () => {
    // 2026-12-01T02:00:00.000Z = 30 de noviembre de 2026 a las 20:00 en El Salvador (UTC-6)
    const utcNight = "2026-12-01T02:00:00.000Z";

    expect(getGymDateKey(utcNight)).toBe("2026-11-30");
    expect(formatGymTime(utcNight)).toBe("20:00");
    expect(formatGymShortDate(utcNight)).toBe("30/11/2026");
  });

  it("formatea encabezados de fecha YYYY-MM-DD sin retroceder un día", () => {
    const heading = formatGymDayHeading("2026-11-30");
    expect(heading.toLowerCase()).toContain("30");
    expect(heading.toLowerCase()).toContain("noviembre");
  });
});
