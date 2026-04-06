import { describe, expect, it } from "vitest";
import { getCustomGarmentPricingResult } from "./pricing";

describe("custom pricing", () => {
  it("uses fused as the baseline for jacket garments", () => {
    expect(getCustomGarmentPricingResult({
      selectedGarment: "Jacket",
      fabricSku: "DBM562A",
      canvas: "Fused",
    })).toMatchObject({
      price: 1095,
      match: {
        status: "matched",
        key: "basic",
      },
    });
  });

  it("applies half and full canvas surcharges", () => {
    expect(getCustomGarmentPricingResult({
      selectedGarment: "Jacket",
      fabricSku: "DBM562A",
      canvas: "Half",
    }).price).toBe(1195);

    expect(getCustomGarmentPricingResult({
      selectedGarment: "Jacket",
      fabricSku: "DBM562A",
      canvas: "Full",
    }).price).toBe(1295);
  });

  it("does not apply canvas surcharges to overcoats", () => {
    expect(getCustomGarmentPricingResult({
      selectedGarment: "Overcoat",
      fabricSku: "DBM562A",
      canvas: "Full",
    }).price).toBe(1695);
  });

  it("changes price across pricing tiers resolved from fabric SKU", () => {
    expect(getCustomGarmentPricingResult({
      selectedGarment: "Two-piece suit",
      fabricSku: "DBM562A",
      canvas: "Fused",
    }).price).toBe(1495);

    expect(getCustomGarmentPricingResult({
      selectedGarment: "Two-piece suit",
      fabricSku: "FAB-IVR-001",
      canvas: "Fused",
    }).price).toBe(2395);
  });

  it("matches fabric SKU metadata to a pricing tier", () => {
    expect(getCustomGarmentPricingResult({
      selectedGarment: "Jacket",
      fabricSku: "DBM562A",
      canvas: "Fused",
    }).match).toMatchObject({
      status: "matched",
      key: "basic",
      matchReason: "fabric_sku",
      resolvedTierLabel: "Basic",
    });

    expect(getCustomGarmentPricingResult({
      selectedGarment: "Jacket",
      pricingTierKey: "luxury",
    }).match).toMatchObject({
      status: "matched",
      key: "luxury",
      matchReason: "pricing_tier",
    });

    expect(getCustomGarmentPricingResult({
      selectedGarment: "Jacket",
      fabricSku: "UNKNOWN001",
      canvas: "Fused",
    }).match).toMatchObject({
      status: "unmatched",
      key: null,
      matchReason: "none",
    });
  });
});
