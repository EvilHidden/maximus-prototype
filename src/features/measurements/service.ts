import { createSeedReferenceData } from "../../db/referenceData";

const seedReferenceData = createSeedReferenceData();

export function createEmptyMeasurementValues() {
  return seedReferenceData.measurementFields.reduce<Record<string, string>>((accumulator, field) => {
    accumulator[field] = "";
    return accumulator;
  }, {});
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
