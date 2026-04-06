export type JacketCanvas = "Fused" | "Half" | "Full";

export type JacketCanvasSurcharges = Record<JacketCanvas, number>;

export const customPricingGarments = [
  "Two-piece suit",
  "Three-piece suit",
  "Jacket",
  "Pants",
  "Vest",
  "Shirt",
  "Overcoat",
  "Tuxedo jacket",
  "Three-piece tuxedo",
  "Skirt",
] as const;

export type CustomPricingGarment = (typeof customPricingGarments)[number];

export const jacketConstructionGarments = [
  "Two-piece suit",
  "Three-piece suit",
  "Jacket",
  "Tuxedo jacket",
  "Three-piece tuxedo",
] as const satisfies readonly CustomPricingGarment[];

export function supportsJacketConstruction(garment: string | null) {
  return Boolean(garment && jacketConstructionGarments.includes(garment as (typeof jacketConstructionGarments)[number]));
}

export type CustomPricingTierDefinition = {
  key: string;
  label: string;
  sortOrder: number;
  basePrices: Record<CustomPricingGarment, number>;
};

export const defaultJacketCanvasSurcharges: JacketCanvasSurcharges = {
  Fused: 0,
  Half: 100,
  Full: 200,
};

export const customPricingTierCatalog: CustomPricingTierDefinition[] = [
  {
    key: "basic",
    label: "Basic",
    sortOrder: 0,
    basePrices: {
      "Two-piece suit": 1495,
      "Three-piece suit": 1845,
      Jacket: 1095,
      Pants: 495,
      Vest: 395,
      Shirt: 195,
      Overcoat: 1695,
      "Tuxedo jacket": 1195,
      "Three-piece tuxedo": 1945,
      Skirt: 425,
    },
  },
  {
    key: "standard",
    label: "Standard",
    sortOrder: 1,
    basePrices: {
      "Two-piece suit": 1995,
      "Three-piece suit": 2445,
      Jacket: 1495,
      Pants: 595,
      Vest: 495,
      Shirt: 245,
      Overcoat: 2295,
      "Tuxedo jacket": 1645,
      "Three-piece tuxedo": 2595,
      Skirt: 545,
    },
  },
  {
    key: "luxury",
    label: "Luxury",
    sortOrder: 2,
    basePrices: {
      "Two-piece suit": 2395,
      "Three-piece suit": 2895,
      Jacket: 1795,
      Pants: 695,
      Vest: 545,
      Shirt: 295,
      Overcoat: 2695,
      "Tuxedo jacket": 1895,
      "Three-piece tuxedo": 3095,
      Skirt: 645,
    },
  },
];

export function createDefaultCustomPricingTiers() {
  return customPricingTierCatalog.map((tier) => ({
    ...tier,
    isActive: true,
  }));
}
