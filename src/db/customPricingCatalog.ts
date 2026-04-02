export type CustomPricingBookEntry = {
  key: string;
  label: string;
  manufacturer: string;
  bookType: string;
  skuPrefixes: string[];
  exactSkus: string[];
  basePrices: Partial<Record<CustomPricingGarment, number>>;
  vestPrice: number;
  canvasSurcharges: {
    Fused: number;
    Half: number;
    Full: number;
  };
};

export type CustomPricingGarment =
  | "Two-piece suit"
  | "Three-piece suit"
  | "Jacket"
  | "Pants"
  | "Vest"
  | "Shirt"
  | "Overcoat"
  | "Tuxedo jacket"
  | "Three-piece tuxedo"
  | "Skirt";

export const customPricingCatalog: CustomPricingBookEntry[] = [
  {
    key: "marzoni-core",
    label: "Marzoni Core",
    manufacturer: "Marzoni",
    bookType: "Core",
    skuPrefixes: ["MZC", "MZN"],
    exactSkus: ["MZC2401", "MZC2402"],
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
    vestPrice: 350,
    canvasSurcharges: {
      Fused: 0,
      Half: 250,
      Full: 450,
    },
  },
  {
    key: "loro-piana-ceremony",
    label: "Loro Piana Ceremony",
    manufacturer: "Loro Piana",
    bookType: "Ceremony",
    skuPrefixes: ["LPC", "LPT"],
    exactSkus: ["LPC2408", "LPT2410"],
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
    vestPrice: 450,
    canvasSurcharges: {
      Fused: 0,
      Half: 300,
      Full: 550,
    },
  },
  {
    key: "dormeuil-luxury",
    label: "Dormeuil Luxury",
    manufacturer: "Dormeuil",
    bookType: "Luxury",
    skuPrefixes: ["DRL", "DRM"],
    exactSkus: ["DRL2501", "DRM2504"],
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
    vestPrice: 500,
    canvasSurcharges: {
      Fused: 0,
      Half: 350,
      Full: 650,
    },
  },
];
