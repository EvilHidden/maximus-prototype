import type { CustomPricingMatchStatus } from "../types";
import {
  getPricingProgramKeyForGarment,
  supportsCustomLiningSurcharge,
  supportsJacketConstruction,
  type CustomPricingTierDefinition,
  type JacketCanvas,
} from "./customPricingCatalog";
import { type MaterialOption } from "./referenceData";

type CustomPricingInput = {
  variationId?: string | null;
  variationLabel?: string | null;
  selectedGarment: string | null;
  canvas?: string | null;
  fabricSku?: string | null;
  pricingTierKey?: string | null;
  customLiningRequested?: boolean;
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
  catalogVariations?: Array<{
    id: string;
    label: string;
    fallbackAmount: number;
  }>;
  catalogVariationTierPrices?: Array<{
    variationId: string;
    tierKey: string;
    amount: number;
    isActive?: boolean;
  }>;
  taxRate?: number;
  customDepositRate?: number;
  jacketCanvasSurcharges?: Record<JacketCanvas, number>;
  customLiningSurchargeAmount?: number;
};

export const DEFAULT_TAX_RATE = 0.08875;
export const DEFAULT_CUSTOM_DEPOSIT_RATE = 0.5;

function normalizeSku(value: string | null | undefined) {
  return value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
}

function getPricingTierByKey(
  key: string | null | undefined,
  pricingTiers: CustomPricingTierDefinition[] = [],
) {
  if (!key) {
    return null;
  }

  return pricingTiers.find((tier) => tier.key === key) ?? null;
}

function getSelectedVariationLabel(input: CustomPricingInput) {
  return input.variationLabel ?? input.selectedGarment ?? null;
}

export function findFabricMaterialOptionBySku(
  sku: string | null | undefined,
  fabricOptions: MaterialOption[] = [],
) {
  const normalizedSku = normalizeSku(sku);
  if (!normalizedSku) {
    return null;
  }

  return fabricOptions.find((option) => normalizeSku(option.sku) === normalizedSku) ?? null;
}

export function resolvePricingTierKeyForFabricSku(
  sku: string | null | undefined,
  fabricOptions: MaterialOption[] = [],
  selectedGarment: string | null = null,
) {
  const fabricOption = findFabricMaterialOptionBySku(sku, fabricOptions);
  if (!fabricOption) {
    return null;
  }

  const programKey = getPricingProgramKeyForGarment(selectedGarment);
  if (programKey && fabricOption.programKey && fabricOption.programKey !== programKey) {
    return null;
  }

  return fabricOption.pricingTierKey ?? null;
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
  pricingTiers: CustomPricingTierDefinition[] = [],
  fabricOptions: MaterialOption[] = [],
): CustomPricingMatch {
  const programKey = getPricingProgramKeyForGarment(getSelectedVariationLabel(input));
  const directTier = getPricingTierByKey(input.pricingTierKey, pricingTiers);
  if (directTier && (!programKey || directTier.programKey === programKey)) {
    const fabricOption = findFabricMaterialOptionBySku(input.fabricSku, fabricOptions);
    return createMatch("matched", directTier, "pricing_tier", fabricOption);
  }

  const fabricOption = findFabricMaterialOptionBySku(input.fabricSku, fabricOptions);
  if (!fabricOption || (programKey && fabricOption.programKey && fabricOption.programKey !== programKey)) {
    return createMatch("unmatched", null, "none");
  }

  const resolvedTier = getPricingTierByKey(fabricOption.pricingTierKey ?? null, pricingTiers);
  if (resolvedTier && (!programKey || resolvedTier.programKey === programKey)) {
    return createMatch("matched", resolvedTier, "fabric_sku", fabricOption);
  }

  return createMatch("unmatched", null, "none");
}

function getCanvasPrice(
  surcharges: Record<JacketCanvas, number>,
  canvas: string | null | undefined,
  garment: string | null,
) {
  if (!garment || !supportsCanvasPricing(garment)) {
    return 0;
  }

  const normalizedCanvas = (canvas ?? "Fused") as JacketCanvas;
  return surcharges[normalizedCanvas] ?? 0;
}

function getCustomLiningPrice(amount: number, requested: boolean | undefined, garment: string | null) {
  if (!requested || !supportsCustomLiningSurcharge(garment)) {
    return 0;
  }

  return amount;
}

function getBaseGarmentPrice(tier: CustomPricingTierDefinition, garment: string | null) {
  if (!garment) {
    return 0;
  }

  return tier.basePrices[garment as keyof typeof tier.basePrices] ?? getLegacyCustomGarmentPrice(garment);
}

function getCatalogVariationBasePrice(
  input: CustomPricingInput,
  tier: CustomPricingTierDefinition | null,
  config: Pick<PricingComputationConfig, "catalogVariations" | "catalogVariationTierPrices">,
) {
  const variationLabel = getSelectedVariationLabel(input);
  const variation = config.catalogVariations?.find((candidate) => (
    (input.variationId && candidate.id === input.variationId) || candidate.label === variationLabel
  )) ?? null;

  if (!variation) {
    return tier ? getBaseGarmentPrice(tier, variationLabel) : getLegacyCustomGarmentPrice(variationLabel);
  }

  if (!tier) {
    return variation.fallbackAmount;
  }

  return config.catalogVariationTierPrices?.find((price) => (
    (price.isActive ?? true) && price.variationId === variation.id && price.tierKey === tier.key
  ))?.amount ?? variation.fallbackAmount;
}

export function supportsCanvasPricing(garment: string | null) {
  return supportsJacketConstruction(garment);
}

export function getLegacyCustomGarmentPrice(garment: string | null) {
  if (!garment) {
    return 0;
  }

  if (garment === "Shirt") {
    return 200;
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
  config: Pick<
    PricingComputationConfig,
    "pricingTiers" | "fabricOptions" | "catalogVariations" | "catalogVariationTierPrices" | "jacketCanvasSurcharges" | "customLiningSurchargeAmount"
  > = {},
): CustomPricingResult {
  const normalizedInput =
    typeof input === "string" || input === null
      ? { selectedGarment: input as string | null }
      : input;

  const pricingTiers = config.pricingTiers ?? [];
  const fabricOptions = config.fabricOptions ?? [];
  const surcharges = config.jacketCanvasSurcharges ?? { Fused: 0, Half: 100, Full: 200 };
  const customLiningSurchargeAmount = config.customLiningSurchargeAmount ?? 200;
  const match = resolveCustomPricingMatch(normalizedInput, pricingTiers, fabricOptions);
  const tier = match.key ? getPricingTierByKey(match.key, pricingTiers) : null;
  const selectedVariationLabel = getSelectedVariationLabel(normalizedInput);
  const canvasPrice = getCanvasPrice(surcharges, normalizedInput.canvas, selectedVariationLabel);
  const customLiningPrice = getCustomLiningPrice(
    customLiningSurchargeAmount,
    normalizedInput.customLiningRequested,
    selectedVariationLabel,
  );

  const basePrice = getCatalogVariationBasePrice(normalizedInput, tier, config);

  return {
    price: roundCurrency(basePrice + canvasPrice + customLiningPrice),
    match,
  };
}

export function getCustomGarmentPrice(
  input: string | null | CustomPricingInput,
  config: Pick<
    PricingComputationConfig,
    "pricingTiers" | "fabricOptions" | "catalogVariations" | "catalogVariationTierPrices" | "jacketCanvasSurcharges" | "customLiningSurchargeAmount"
  > = {},
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
