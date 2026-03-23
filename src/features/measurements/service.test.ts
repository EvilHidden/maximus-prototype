import { describe, expect, it } from "vitest";
import { createEmptyMeasurementValues, formatMeasurementValue, parseMeasurementValue } from "./service";

describe("measurement service utilities", () => {
  it("creates an empty value map for every seeded measurement field", () => {
    const values = createEmptyMeasurementValues();

    expect(values).toHaveProperty("Chest", "");
    expect(values).toHaveProperty("Waist", "");
    expect(Object.values(values).every((value) => value === "")).toBe(true);
  });

  it("parses mixed decimal inch values into inches and quarter fractions", () => {
    expect(parseMeasurementValue("41.25")).toEqual({ inches: 41, fraction: 0.25 });
    expect(parseMeasurementValue("")).toEqual({ inches: 0, fraction: 0 });
  });

  it("formats inch values back into compact strings", () => {
    expect(formatMeasurementValue(41, 0)).toBe("41");
    expect(formatMeasurementValue(41, 0.5)).toBe("41.5");
  });
});
