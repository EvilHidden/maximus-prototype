import { describe, expect, it } from "vitest";
import { createEmptyMeasurementValues, formatMeasurementDisplayValue, formatMeasurementValue, parseMeasurementValue } from "./service";

describe("measurement service utilities", () => {
  it("creates an empty value map for every seeded measurement field", () => {
    const values = createEmptyMeasurementValues();

    expect(values).toHaveProperty("Chest", "");
    expect(values).toHaveProperty("Waist", "");
    expect(Object.values(values).every((value) => value === "")).toBe(true);
  });

  it("parses mixed decimal inch values into inches and eighth fractions", () => {
    expect(parseMeasurementValue("41.25")).toEqual({ inches: 41, fraction: 0.25 });
    expect(parseMeasurementValue("41.125")).toEqual({ inches: 41, fraction: 0.125 });
    expect(parseMeasurementValue("")).toEqual({ inches: 0, fraction: 0 });
  });

  it("formats inch values back into compact strings", () => {
    expect(formatMeasurementValue(41, 0)).toBe("41");
    expect(formatMeasurementValue(41, 0.5)).toBe("41.5");
    expect(formatMeasurementValue(41, 0.125)).toBe("41.125");
  });

  it("formats display values with fraction glyphs", () => {
    expect(formatMeasurementDisplayValue("29.125")).toBe("29 ⅛");
    expect(formatMeasurementDisplayValue("29.25")).toBe("29 ¼");
    expect(formatMeasurementDisplayValue("29.375")).toBe("29 ⅜");
    expect(formatMeasurementDisplayValue("29.5")).toBe("29 ½");
    expect(formatMeasurementDisplayValue("29.625")).toBe("29 ⅝");
    expect(formatMeasurementDisplayValue("29.75")).toBe("29 ¾");
    expect(formatMeasurementDisplayValue("29.875")).toBe("29 ⅞");
    expect(formatMeasurementDisplayValue("29")).toBe("29");
  });
});
