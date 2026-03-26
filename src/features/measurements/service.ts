import { createSeedMeasurementValueMap } from "../../db/referenceData";

const fractionLabelMap = new Map<number, string>([
  [0, ""],
  [0.125, "⅛"],
  [0.25, "¼"],
  [0.375, "⅜"],
  [0.5, "½"],
  [0.625, "⅝"],
  [0.75, "¾"],
  [0.875, "⅞"],
]);

export function createEmptyMeasurementValues() {
  return createSeedMeasurementValueMap();
}

export function parseMeasurementValue(value: string) {
  if (!value) {
    return { inches: 0, fraction: 0 };
  }

  const numericValue = Number.parseFloat(value);
  if (Number.isNaN(numericValue)) {
    return { inches: 0, fraction: 0 };
  }

  const inches = Math.floor(numericValue);
  const roundedFraction = Math.round((numericValue - inches) * 8) / 8;
  return {
    inches,
    fraction: roundedFraction >= 1 ? 0 : roundedFraction,
  };
}

export function formatMeasurementValue(inches: number, fraction: number) {
  const total = inches + fraction;
  return Number.isInteger(total) ? String(total) : total.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

export function formatMeasurementDisplayValue(value: string) {
  if (!value.trim()) {
    return "";
  }

  const { inches, fraction } = parseMeasurementValue(value);
  const fractionLabel = fractionLabelMap.get(fraction) ?? "";

  if (!fractionLabel) {
    return String(inches);
  }

  return `${inches} ${fractionLabel}`;
}
