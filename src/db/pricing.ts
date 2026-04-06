import type { CustomPricingMatchStatus } from "../types";
import {
  customPricingTierCatalog,
  defaultJacketCanvasSurcharges,
  supportsJacketConstruction,
  type CustomPricingTierDefinition,
  type JacketCanvas,
  type JacketCanvasSurcharges,
} from "./customPricingCatalog";
import { defaultMaterialOptionsByKind, type MaterialOption } from "./referenceData";

type CustomPricingInput = {
  selectedGarment: string | null;
  canvas?: string | null;
  fabricSku?: string | null;
  pricingTierKey?: string | null;
};

export type CustomPricingMatch = {
  status: CustomPricingMatchStatus;
  key: string | null;
  resolvedTierLabel: string | null;
  resolvedMillLabel: string | null;
  resolvedManufacturer: string | null;
  resolvedBookType: string | null;
  matchReason: "pricing_tier" | "fabric_sku" | "none";
};

export type CustomPricingResult = {
  price: number;
  match: CustomPricingMatch;
};

export type PricingComputationConfig = {
  pricingTiers?: CustomPricingTierDefinition[];
  fabricOptions?: MaterialOption[];
  taxRate?: number;
  customDepositRate?: number;
  jacketCanvasSurcharges?: JacketCanvasSurcharges;
};

export const DEFAULT_TAX_RATE = 0.08875;
export const DEFAULT_CUSTOM_DEPOSIT_RATE = 0.5;

function normalizeSku(value: string | null | undefined) {
  return value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
}

function getPricingTierByKey(
  key: string | null | undefined,
  pricingTiers: CustomPricingTierDefinition[] = customPricingTierCatalog,
) {
  if (!key) {
    return null;
  }

  return pricingTiers.find((tier) => tier.key === key) ?? null;
}

export function findFabricMaterialOptionBySku(
  sku: string | null | undefined,
  fabricOptions: MaterialOption[] = defaultMaterialOptionsByKind.fabric,
) {
  const normalizedSku = normalizeSku(sku);
  if (!normalizedSku) {
    return null;
  }

  return fabricOptions.find((option) => normalizeSku(option.sku) === normalizedSku) ?? null;
}

export function resolvePricingTierKeyForFabricSku(
  sku: string | null | undefined,
  fabricOptions: MaterialOption[] = defaultMaterialOptionsByKind.fabric,
) {
  return findFabricMaterialOptionBySku(sku, fabricOptions)?.pricingTierKey ?? null;
}

function createMatch(
  status: CustomPricingMatchStatus,
  tier: CustomPricingTierDefinition | null,
  reason: CustomPricingMatch["matchReason"],
  fabricOption?: MaterialOption | null,
): CustomPricingMatch {
  return {
    status,
    key: tier?.key ?? null,
    resolvedTierLabel: tier?.label ?? null,
    resolvedMillLabel: fabricOption?.millLabel ?? null,
    resolvedManufacturer: fabricOption?.manufacturer ?? null,
    resolvedBookType: fabricOption?.bookType ?? null,
    matchReason: reason,
  };
}

export function resolveCustomPricingMatch(
  input: CustomPricingInput,
  pricingTiers: CustomPricingTierDefinition[] = customPricingTierCatalog,
  fabricOptions: MaterialOption[] = defaultMaterialOptionsByKind.fabric,
): CustomPricingMatch {
  const directTier = getPricingTierByKey(input.pricingTierKey, pricingTiers);
  if (directTier) {
    const fabricOption = findFabricMaterialOptionBySku(input.fabricSku, fabricOptions);
    return createMatch("matched", directTier, "pricing_tier", fabricOption);
  }

  const fabricOption = findFabricMaterialOptionBySku(input.fabricSku, fabricOptions);
  const resolvedTier = getPricingTierByKey(fabricOption?.pricingTierKey, pricingTiers);
  if (resolvedTier) {
    return createMatch("matched", resolvedTier, "fabric_sku", fabricOption);
  }

  return createMatch("unmatched", null, "none");
}

function getCanvasPrice(
  surcharges: JacketCanvasSurcharges,
  canvas: string | null | undefined,
  garment: string | null,
) {
  if (!garment || !supportsCanvasPricing(garment)) {
    return 0;
  }

  const normalizedCanvas = (canvas ?? "Fused") as JacketCanvas;
  return surcharges[normalizedCanvas] ?? 0;
}

function getBaseGarmentPrice(tier: CustomPricingTierDefinition, garment: string | null) {
  if (!garment) {
    return 0;
  }

  return tier.basePrices[garment as keyof typeof tier.basePrices] ?? getLegacyCustomGarmentPrice(garment);
}

export function supportsCanvasPricing(garment: string | null) {
  return supportsJacketConstruction(garment);
}

export function getLegacyCustomGarmentPrice(garment: string | null) {
  if (!garment) {
    return 0;
  }

  if (garment === "Three-piece suit" || garment === "Three-piece tuxedo") {
    return 2495;
  }

  return 1495;
}

export function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function getCustomGarmentPricingResult(
  input: string | null | CustomPricingInput,
  config: Pick<PricingComputationConfig, "pricingTiers" | "fabricOptions" | "jacketCanvasSurcharges"> = {},
): CustomPricingResult {
  const normalizedInput =
    typeof input === "string" || input === null
      ? { selectedGarment: input as string | null }
      : input;

  const pricingTiers = config.pricingTiers ?? customPricingTierCatalog;
  const fabricOptions = config.fabricOptions ?? defaultMaterialOptionsByKind.fabric;
  const surcharges = config.jacketCanvasSurcharges ?? defaultJacketCanvasSurcharges;
  const match = resolveCustomPricingMatch(normalizedInput, pricingTiers, fabricOptions);
  const tier = match.key ? getPricingTierByKey(match.key, pricingTiers) : null;

  if (!tier) {
    return {
      price: getLegacyCustomGarmentPrice(normalizedInput.selectedGarment),
      match,
    };
  }

  const basePrice = getBaseGarmentPrice(tier, normalizedInput.selectedGarment);
  const canvasPrice = getCanvasPrice(surcharges, normalizedInput.canvas, normalizedInput.selectedGarment);

  return {
    price: roundCurrency(basePrice + canvasPrice),
    match,
  };
}

export function getCustomGarmentPrice(
  input: string | null | CustomPricingInput,
  config: Pick<PricingComputationConfig, "pricingTiers" | "fabricOptions" | "jacketCanvasSurcharges"> = {},
) {
  return getCustomGarmentPricingResult(input, config).price;
}

export function getAlterationServicePrice(
  alterationServiceDefinitions: Array<{ category: string; name: string; price: number }>,
  garmentLabel: string,
  serviceName: string,
) {
  return alterationServiceDefinitions.find((service) => (
    service.category === garmentLabel && service.name === serviceName
  ))?.price ?? 0;
}
