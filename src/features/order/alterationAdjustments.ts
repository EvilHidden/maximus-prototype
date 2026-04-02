import type { AlterationServiceSelection } from "../../types";

export const ALTERATION_ADJUSTMENT_STEP = 0.125;
export const ALTERATION_ADJUSTMENT_MIN = -4;
export const ALTERATION_ADJUSTMENT_MAX = 4;
export const ALTERATION_WHOLE_INCH_OPTIONS = [0, 1, 2, 3, 4] as const;
export const ALTERATION_FRACTION_OPTIONS = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875] as const;
const ALTERATION_FRACTION_GLYPHS: Record<string, string> = {
  "1/8": "⅛",
  "1/4": "¼",
  "3/8": "⅜",
  "1/2": "½",
  "5/8": "⅝",
  "3/4": "¾",
  "7/8": "⅞",
};

export function clampAlterationAdjustment(value: number) {
  return Math.min(ALTERATION_ADJUSTMENT_MAX, Math.max(ALTERATION_ADJUSTMENT_MIN, value));
}

export function normalizeAlterationAdjustment(value: number) {
  return Math.round(clampAlterationAdjustment(value) / ALTERATION_ADJUSTMENT_STEP) * ALTERATION_ADJUSTMENT_STEP;
}

export function getAlterationAdjustmentOptions() {
  const options: number[] = [];

  for (let current = ALTERATION_ADJUSTMENT_MIN; current <= ALTERATION_ADJUSTMENT_MAX + 0.0001; current += ALTERATION_ADJUSTMENT_STEP) {
    options.push(normalizeAlterationAdjustment(current));
  }

  return options;
}

export function getAlterationAdjustmentParts(deltaInches: number | null) {
  if (deltaInches === null) {
    return {
      sign: 1 as 1 | -1,
      wholeInches: 0,
      fraction: 0,
    };
  }

  const normalized = normalizeAlterationAdjustment(deltaInches);
  const absoluteValue = Math.abs(normalized);
  const wholeInches = Math.trunc(absoluteValue);
  const fraction = normalizeAlterationAdjustment(absoluteValue - wholeInches);

  return {
    sign: normalized < 0 ? -1 as const : 1 as const,
    wholeInches,
    fraction,
  };
}

export function composeAlterationAdjustment(sign: 1 | -1, wholeInches: number, fraction: number) {
  const absoluteValue = normalizeAlterationAdjustment(wholeInches + fraction);

  if (absoluteValue === 0) {
    return 0;
  }

  return normalizeAlterationAdjustment(absoluteValue * sign);
}

export function formatAlterationFraction(value: number) {
  if (value === 0) {
    return "0";
  }

  const eighths = Math.round(value / ALTERATION_ADJUSTMENT_STEP);
  const gcd = (left: number, right: number): number => (right === 0 ? left : gcd(right, left % right));
  const divisor = gcd(eighths, 8);
  const numerator = eighths / divisor;
  const denominator = 8 / divisor;
  const plainFraction = `${numerator}/${denominator}`;
  return ALTERATION_FRACTION_GLYPHS[plainFraction] ?? plainFraction;
}

export function formatAlterationAdjustment(deltaInches: number | null) {
  if (deltaInches === null) {
    return "";
  }

  const normalized = normalizeAlterationAdjustment(deltaInches);
  const sign = normalized < 0 ? "-" : "+";
  const absoluteValue = Math.abs(normalized);
  const wholeInches = Math.trunc(absoluteValue);
  const eighths = Math.round((absoluteValue - wholeInches) / ALTERATION_ADJUSTMENT_STEP);

  if (eighths === 0) {
    return `${sign}${wholeInches} in`;
  }

  const gcd = (left: number, right: number): number => (right === 0 ? left : gcd(right, left % right));
  const divisor = gcd(eighths, 8);
  const numerator = eighths / divisor;
  const denominator = 8 / divisor;
  const fraction = formatAlterationFraction((numerator / denominator));

  if (wholeInches === 0) {
    return `${sign}${fraction} in`;
  }

  return `${sign}${wholeInches} ${fraction} in`;
}

export function formatAlterationServiceLabel(service: Pick<AlterationServiceSelection, "name" | "supportsAdjustment" | "deltaInches">) {
  if (!service.supportsAdjustment || service.deltaInches === null) {
    return service.name;
  }

  return `${service.name}: ${formatAlterationAdjustment(service.deltaInches)}`;
}

export function hasMissingRequiredAlterationAdjustments(services: Array<Pick<AlterationServiceSelection, "requiresAdjustment" | "deltaInches">>) {
  return services.some((service) => service.requiresAdjustment && service.deltaInches === null);
}
