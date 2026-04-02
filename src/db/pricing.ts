import type { CustomPricingMatchStatus, CustomSkuSource } from "../types";
import { customPricingCatalog, type CustomPricingBookEntry } from "./customPricingCatalog";

type JacketCanvas = "Fused" | "Half" | "Full";

type CustomPricingInput = {
  selectedGarment: string | null;
  canvas?: string | null;
  includeVest?: boolean;
  bookLabel?: string | null;
  sku?: string | null;
  skuSource?: CustomSkuSource | null;
  pricingMatchKey?: string | null;
};

export type CustomPricingMatch = {
  status: CustomPricingMatchStatus;
  key: string | null;
  resolvedBookLabel: string | null;
  resolvedBookType: string | null;
  resolvedManufacturer: string | null;
  matchReason: "pricing_key" | "exact_sku" | "prefix_sku" | "none";
};

export type CustomPricingResult = {
  price: number;
  match: CustomPricingMatch;
};

function normalizeSku(value: string | null | undefined) {
  return value?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
}

function getCatalogEntryByKey(key: string | null | undefined) {
  if (!key) {
    return null;
  }

  return customPricingCatalog.find((entry) => entry.key === key) ?? null;
}

function getCatalogEntryByExactSku(sku: string | null | undefined) {
  const normalized = normalizeSku(sku);
  if (!normalized) {
    return null;
  }

  return customPricingCatalog.find((entry) => entry.exactSkus.some((candidate) => normalizeSku(candidate) === normalized)) ?? null;
}

function getSuggestedCatalogEntryBySkuPrefix(sku: string | null | undefined) {
  const normalizedSku = normalizeSku(sku);
  if (!normalizedSku) {
    return null;
  }

  const matchingEntries = customPricingCatalog.filter((entry) => (
    entry.skuPrefixes.some((prefix) => normalizedSku.startsWith(normalizeSku(prefix)))
  ));

  return matchingEntries[0] ?? null;
}

function createMatch(status: CustomPricingMatchStatus, entry: CustomPricingBookEntry | null, reason: CustomPricingMatch["matchReason"]): CustomPricingMatch {
  return {
    status,
    key: entry?.key ?? null,
    resolvedBookLabel: entry?.label ?? null,
    resolvedBookType: entry?.bookType ?? null,
    resolvedManufacturer: entry?.manufacturer ?? null,
    matchReason: reason,
  };
}

export function resolveCustomPricingMatch(input: CustomPricingInput): CustomPricingMatch {
  const pricingKeyEntry = getCatalogEntryByKey(input.pricingMatchKey);
  if (pricingKeyEntry) {
    return createMatch("matched", pricingKeyEntry, "pricing_key");
  }

  const exactSkuEntry = getCatalogEntryByExactSku(input.sku);
  if (exactSkuEntry) {
    return createMatch("matched", exactSkuEntry, "exact_sku");
  }

  const suggestedSkuEntry = getSuggestedCatalogEntryBySkuPrefix(input.sku);
  if (suggestedSkuEntry) {
    return createMatch("suggested", suggestedSkuEntry, "prefix_sku");
  }

  return createMatch("unmatched", null, "none");
}

function getCanvasPrice(entry: CustomPricingBookEntry, canvas: string | null | undefined, garment: string | null) {
  if (!garment || !supportsCanvasPricing(garment)) {
    return 0;
  }

  const normalizedCanvas = (canvas ?? "Fused") as JacketCanvas;
  return entry.canvasSurcharges[normalizedCanvas] ?? 0;
}

function getBaseGarmentPrice(entry: CustomPricingBookEntry, garment: string | null) {
  if (!garment) {
    return 0;
  }

  return entry.basePrices[garment as keyof typeof entry.basePrices] ?? getLegacyCustomGarmentPrice(garment);
}

export function supportsCanvasPricing(garment: string | null) {
  return garment === "Two-piece suit" || garment === "Three-piece suit" || garment === "Jacket" || garment === "Overcoat" || garment === "Tuxedo jacket" || garment === "Three-piece tuxedo";
}

export function supportsVestAddOn(garment: string | null) {
  return garment === "Two-piece suit" || garment === "Jacket" || garment === "Tuxedo jacket";
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

export function getCustomGarmentPricingResult(input: string | null | CustomPricingInput): CustomPricingResult {
  let normalizedInput: CustomPricingInput;
  if (typeof input === "string" || input === null) {
    normalizedInput = { selectedGarment: input as string | null };
  } else {
    normalizedInput = input;
  }

  const match = resolveCustomPricingMatch(normalizedInput);
  const entry = match.key ? getCatalogEntryByKey(match.key) : null;

  if (!entry) {
    return {
      price: getLegacyCustomGarmentPrice(normalizedInput.selectedGarment),
      match,
    };
  }

  const basePrice = getBaseGarmentPrice(entry, normalizedInput.selectedGarment);
  const canvasPrice = getCanvasPrice(entry, normalizedInput.canvas, normalizedInput.selectedGarment);
  const vestPrice = normalizedInput.includeVest && supportsVestAddOn(normalizedInput.selectedGarment) ? entry.vestPrice : 0;

  return {
    price: roundCurrency(basePrice + canvasPrice + vestPrice),
    match,
  };
}

export function getCustomGarmentPrice(input: string | null | CustomPricingInput) {
  return getCustomGarmentPricingResult(input).price;
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
