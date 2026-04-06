import { describe, expect, it } from "vitest";
import { createPrototypeDatabase } from "./runtime";
import { createReferenceData } from "./referenceData";
import { getCustomGarmentPricingResult } from "./pricing";

function createPricingConfig() {
  const database = createPrototypeDatabase(new Date("2026-04-05T12:00:00.000Z"));
  const referenceData = createReferenceData(database);

  return {
    pricingTiers: referenceData.customPricingTiers,
    fabricOptions: referenceData.customMaterialOptionsByKind.fabric,
    jacketCanvasSurcharges: referenceData.jacketCanvasSurcharges,
    customLiningSurchargeAmount: referenceData.customLiningSurchargeAmount,
  };
}

describe("custom pricing", () => {
  it("uses fused as the baseline for jacket garments", () => {
    expect(getCustomGarmentPricingResult({
      selectedGarment: "Jacket",
      fabricSku: "2501-ELITE-NAVY-001",
      canvas: "Fused",
    }, createPricingConfig())).toMatchObject({
      price: 550,
      match: {
        status: "matched",
        key: "suiting_standard",
      },
    });
  });

  it("applies half and full canvas surcharges", () => {
    expect(getCustomGarmentPricingResult({
      selectedGarment: "Jacket",
      fabricSku: "2501-ELITE-NAVY-001",
      canvas: "Half",
    }, createPricingConfig()).price).toBe(650);

    expect(getCustomGarmentPricingResult({
      selectedGarment: "Jacket",
      fabricSku: "2501-ELITE-NAVY-001",
      canvas: "Full",
    }, createPricingConfig()).price).toBe(750);
  });

  it("does not apply canvas surcharges to overcoats", () => {
    expect(getCustomGarmentPricingResult({
      selectedGarment: "Overcoat",
      fabricSku: "2501-ELITE-NAVY-001",
      canvas: "Full",
    }, createPricingConfig()).price).toBe(950);
  });

  it("changes price across pricing tiers resolved from fabric SKU", () => {
    expect(getCustomGarmentPricingResult({
      selectedGarment: "Two-piece suit",
      fabricSku: "2501-ELITE-NAVY-001",
      canvas: "Fused",
    }, createPricingConfig()).price).toBe(750);

    expect(getCustomGarmentPricingResult({
      selectedGarment: "Two-piece suit",
      fabricSku: "STYLBIELLA-FLANNEL-STEEL-001",
      canvas: "Fused",
    }, createPricingConfig()).price).toBe(3000);
  });

  it("matches fabric SKU metadata to the resolved tier and program", () => {
    expect(getCustomGarmentPricingResult({
      selectedGarment: "Jacket",
      fabricSku: "2501-ELITE-NAVY-001",
      canvas: "Fused",
    }, createPricingConfig()).match).toMatchObject({
      status: "matched",
      key: "suiting_standard",
      matchReason: "fabric_sku",
      resolvedTierLabel: "Standard Fabric (Maximus Brand)",
      resolvedMillLabel: "2501 Elite Wool",
    });

    expect(getCustomGarmentPricingResult({
      selectedGarment: "Shirt",
      pricingTierKey: "shirting_tier_4",
    }, createPricingConfig()).match).toMatchObject({
      status: "matched",
      key: "shirting_tier_4",
      matchReason: "pricing_tier",
    });

    expect(getCustomGarmentPricingResult({
      selectedGarment: "Jacket",
      fabricSku: "UNKNOWN001",
      canvas: "Fused",
    }, createPricingConfig()).match).toMatchObject({
      status: "unmatched",
      key: null,
      matchReason: "none",
    });
  });

  it("does not resolve a shirting fabric against a suiting garment", () => {
    expect(getCustomGarmentPricingResult({
      selectedGarment: "Two-piece suit",
      fabricSku: "BONUCCI-2PLY-BLUE-001",
      canvas: "Half",
    }, createPricingConfig())).toMatchObject({
      price: 1595,
      match: {
        status: "unmatched",
        key: null,
        matchReason: "none",
      },
    });
  });

  it("applies construction and custom lining surcharges even when pricing falls back to the legacy base", () => {
    expect(getCustomGarmentPricingResult({
      selectedGarment: "Two-piece suit",
      fabricSku: "UNKNOWN001",
      canvas: "Half",
    }, createPricingConfig()).price).toBe(1595);

    expect(getCustomGarmentPricingResult({
      selectedGarment: "Jacket",
      fabricSku: "UNKNOWN001",
      canvas: "Full",
      customLiningRequested: true,
    }, createPricingConfig()).price).toBe(1895);
  });

  it("applies custom lining only to jacket-bearing garments", () => {
    expect(getCustomGarmentPricingResult({
      selectedGarment: "Jacket",
      fabricSku: "2501-ELITE-NAVY-001",
      canvas: "Fused",
      customLiningRequested: true,
    }, createPricingConfig()).price).toBe(750);

    expect(getCustomGarmentPricingResult({
      selectedGarment: "Overcoat",
      fabricSku: "2501-ELITE-NAVY-001",
      customLiningRequested: true,
    }, createPricingConfig()).price).toBe(950);
  });
});
