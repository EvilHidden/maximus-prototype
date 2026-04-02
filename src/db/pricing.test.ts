import { describe, expect, it } from "vitest";
import { getCustomGarmentPricingResult } from "./pricing";

describe("custom pricing", () => {
  it("uses fused as the baseline for jacket-based garments", () => {
    expect(getCustomGarmentPricingResult({
      selectedGarment: "Jacket",
      sku: "MZC2401",
      canvas: "Fused",
    })).toMatchObject({
      price: 1095,
      match: {
        status: "matched",
        key: "marzoni-core",
      },
    });
  });

  it("applies half and full canvas surcharges", () => {
    expect(getCustomGarmentPricingResult({
      selectedGarment: "Jacket",
      sku: "MZC2401",
      canvas: "Half",
    }).price).toBe(1345);

    expect(getCustomGarmentPricingResult({
      selectedGarment: "Jacket",
      sku: "MZC2401",
      canvas: "Full",
    }).price).toBe(1545);
  });

  it("adds the vest upcharge when supported", () => {
    expect(getCustomGarmentPricingResult({
      selectedGarment: "Two-piece suit",
      sku: "MZC2401",
      canvas: "Fused",
      includeVest: true,
    }).price).toBe(1845);
  });

  it("changes price across mill book families", () => {
    expect(getCustomGarmentPricingResult({
      selectedGarment: "Two-piece suit",
      sku: "MZC2401",
      canvas: "Fused",
    }).price).toBe(1495);

    expect(getCustomGarmentPricingResult({
      selectedGarment: "Two-piece suit",
      sku: "DRL2501",
      canvas: "Fused",
    }).price).toBe(2395);
  });

  it("prefers exact SKU matches and falls back to prefix suggestions", () => {
    expect(getCustomGarmentPricingResult({
      selectedGarment: "Jacket",
      sku: "MZC2401",
      canvas: "Fused",
    }).match).toMatchObject({
      status: "matched",
      key: "marzoni-core",
      matchReason: "exact_sku",
    });

    expect(getCustomGarmentPricingResult({
      selectedGarment: "Jacket",
      sku: "LPC8899",
      canvas: "Fused",
    }).match).toMatchObject({
      status: "suggested",
      key: "loro-piana-ceremony",
      matchReason: "prefix_sku",
    });

    expect(getCustomGarmentPricingResult({
      selectedGarment: "Jacket",
      sku: "UNKNOWN001",
      canvas: "Fused",
    }).match).toMatchObject({
      status: "unmatched",
      key: null,
      matchReason: "none",
    });
  });
});
