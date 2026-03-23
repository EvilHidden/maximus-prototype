import { createSeedMeasurementValueMap } from "../../db/referenceData";

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
  const roundedFraction = Math.round((numericValue - inches) * 4) / 4;
  return {
    inches,
    fraction: roundedFraction >= 1 ? 0 : roundedFraction,
  };
}

export function formatMeasurementValue(inches: number, fraction: number) {
  const total = inches + fraction;
  return Number.isInteger(total) ? String(total) : total.toFixed(2).replace(/0$/, "");
}
