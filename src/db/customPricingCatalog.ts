export type JacketCanvas = "Fused" | "Half" | "Full";
export type JacketCanvasSurcharges = Record<JacketCanvas, number>;
export type LiningSelection = "standard" | "custom_printed";
export type PricingProgramKey = "custom_suiting" | "custom_shirting";
export type FabricLookupType = "manual" | "qr" | "both";

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

export type CustomPricingTierDefinition = {
  key: string;
  programKey: PricingProgramKey;
  programLabel: string;
  label: string;
  sortOrder: number;
  floorPrice: number | null;
  basePrices: Partial<Record<CustomPricingGarment, number>>;
};

export type PricingProgramSeed = {
  id: string;
  key: PricingProgramKey;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

export type PricingTierSeed = {
  id: string;
  key: string;
  programKey: PricingProgramKey;
  label: string;
  sortOrder: number;
  floorPrice: number | null;
  isActive: boolean;
};

export type MillBookSeed = {
  id: string;
  key: string;
  programKey: PricingProgramKey;
  tierKey: string;
  label: string;
  manufacturer: string;
  notes: string;
  sortOrder: number;
  isActive: boolean;
};

export type FabricCatalogItemSeed = {
  id: string;
  programKey: PricingProgramKey;
  tierKey: string;
  bookId: string;
  sku: string;
  label: string;
  composition?: string;
  yarn?: string;
  weight?: string;
  lookupType: FabricLookupType;
  hasQrCode: boolean;
  qrCodeRawValue: string | null;
  qrResolvedUrl: string | null;
  externalReference: string | null;
  swatch: string;
  swatchImage?: string;
  isActive: boolean;
};

type GarmentBasePriceSeed = {
  id: string;
  programKey: PricingProgramKey;
  tierKey: string;
  garmentLabel: CustomPricingGarment;
  amount: number;
  isActive: boolean;
};

export type CatalogItemSeed = {
  id: string;
  key: string;
  label: string;
  kind: "product";
  isActive: boolean;
};

export type CatalogVariationSeed = {
  id: string;
  itemId: string;
  key: string;
  label: CustomPricingGarment;
  programKey: PricingProgramKey;
  fallbackAmount: number;
  supportsCanvas: boolean;
  supportsCustomLining: boolean;
  supportsLapel: boolean;
  supportsPocketType: boolean;
  isActive: boolean;
};

export type CatalogOptionGroupSeed = {
  id: string;
  itemId: string;
  key: "fabric" | "buttons" | "lining" | "threads" | "lapel" | "pocket_type";
  label: string;
  sortOrder: number;
  isActive: boolean;
};

export type CatalogModifierGroupSeed = {
  id: string;
  itemId: string;
  key: "canvas" | "custom_lining";
  label: string;
  sortOrder: number;
  isActive: boolean;
};

export type CatalogModifierOptionSeed = {
  id: string;
  groupId: string;
  optionValue: string;
  label: string;
  amount: number;
  isActive: boolean;
};

export type CatalogVariationTierPriceSeed = {
  id: string;
  variationId: string;
  tierKey: string;
  amount: number;
  isActive: boolean;
};

export const suitingGarments = customPricingGarments.filter((garment) => garment !== "Shirt");
export const shirtingGarments = ["Shirt"] as const satisfies readonly CustomPricingGarment[];

const jacketConstructionGarments = [
  "Two-piece suit",
  "Three-piece suit",
  "Jacket",
  "Tuxedo jacket",
  "Three-piece tuxedo",
] as const satisfies readonly CustomPricingGarment[];

const customLiningEligibleGarments = jacketConstructionGarments;

function supportsJacketConstruction(garment: string | null) {
  return Boolean(garment && jacketConstructionGarments.includes(garment as (typeof jacketConstructionGarments)[number]));
}

function supportsCustomLiningSurcharge(garment: string | null) {
  return Boolean(garment && customLiningEligibleGarments.includes(garment as (typeof customLiningEligibleGarments)[number]));
}

export function getPricingProgramKeyForGarment(garment: string | null): PricingProgramKey | null {
  if (!garment) {
    return null;
  }

  return garment === "Shirt" ? "custom_shirting" : "custom_suiting";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export const customCatalogItemId = "catalog_item_custom_garment";

export function getCatalogVariationKeyForGarment(garment: string | null) {
  return garment ? `variation_${slugify(garment)}` : null;
}

function createGarmentPriceSeeds(
  programKey: PricingProgramKey,
  tierKey: string,
  basePrices: Partial<Record<CustomPricingGarment, number>>,
): GarmentBasePriceSeed[] {
  return Object.entries(basePrices).map(([garmentLabel, amount]) => ({
    id: `garment_price_${tierKey}_${garmentLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    programKey,
    tierKey,
    garmentLabel: garmentLabel as CustomPricingGarment,
    amount,
    isActive: true,
  }));
}

export const pricingProgramCatalog: PricingProgramSeed[] = [
  {
    id: "pricing_program_custom_suiting",
    key: "custom_suiting",
    label: "Custom suiting",
    sortOrder: 0,
    isActive: true,
  },
  {
    id: "pricing_program_custom_shirting",
    key: "custom_shirting",
    label: "Custom shirting",
    sortOrder: 1,
    isActive: true,
  },
];

export const MID_TIER_SUITING_FLOOR = 1800;

export const pricingTierCatalog: PricingTierSeed[] = [
  {
    id: "pricing_tier_suiting_standard",
    key: "suiting_standard",
    programKey: "custom_suiting",
    label: "Standard Fabric (Maximus Brand)",
    sortOrder: 0,
    floorPrice: 750,
    isActive: true,
  },
  {
    id: "pricing_tier_suiting_mid",
    key: "suiting_mid",
    programKey: "custom_suiting",
    label: "Mid-Tier Fabric",
    sortOrder: 1,
    floorPrice: MID_TIER_SUITING_FLOOR,
    isActive: true,
  },
  {
    id: "pricing_tier_suiting_italian",
    key: "suiting_italian",
    programKey: "custom_suiting",
    label: "Italian Wool",
    sortOrder: 2,
    floorPrice: 3000,
    isActive: true,
  },
  {
    id: "pricing_tier_shirting_1",
    key: "shirting_tier_1",
    programKey: "custom_shirting",
    label: "Tier 1",
    sortOrder: 0,
    floorPrice: 200,
    isActive: true,
  },
  {
    id: "pricing_tier_shirting_2",
    key: "shirting_tier_2",
    programKey: "custom_shirting",
    label: "Tier 2",
    sortOrder: 1,
    floorPrice: 300,
    isActive: true,
  },
  {
    id: "pricing_tier_shirting_3",
    key: "shirting_tier_3",
    programKey: "custom_shirting",
    label: "Tier 3",
    sortOrder: 2,
    floorPrice: 450,
    isActive: true,
  },
  {
    id: "pricing_tier_shirting_4",
    key: "shirting_tier_4",
    programKey: "custom_shirting",
    label: "Tier 4",
    sortOrder: 3,
    floorPrice: 550,
    isActive: true,
  },
];

export const millBookCatalog: MillBookSeed[] = [
  {
    id: "mill_book_2501_elite_wool",
    key: "2501_elite_wool",
    programKey: "custom_suiting",
    tierKey: "suiting_standard",
    label: "2501 Elite Wool",
    manufacturer: "Maximus",
    notes: "Representative Maximus standard suiting book with QR-supported lookup.",
    sortOrder: 0,
    isActive: true,
  },
  {
    id: "mill_book_2503_performance_wool",
    key: "2503_performance_wool",
    programKey: "custom_suiting",
    tierKey: "suiting_standard",
    label: "2503 Performance Wool",
    manufacturer: "Maximus",
    notes: "Representative Maximus standard suiting book with QR-supported lookup.",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "mill_book_2504_innovative_fiber",
    key: "2504_innovative_fiber",
    programKey: "custom_suiting",
    tierKey: "suiting_standard",
    label: "2504 Innovative Fiber",
    manufacturer: "Maximus",
    notes: "Representative Maximus standard suiting book with QR-supported lookup.",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "mill_book_blasone_ii_huddersfield",
    key: "blasone_ii_huddersfield",
    programKey: "custom_suiting",
    tierKey: "suiting_mid",
    label: "Blasone II Super 110s Huddersfield",
    manufacturer: "Huddersfield",
    notes: "Representative mid-tier suiting book.",
    sortOrder: 0,
    isActive: true,
  },
  {
    id: "mill_book_chelsea_v_huddersfield",
    key: "chelsea_v_huddersfield",
    programKey: "custom_suiting",
    tierKey: "suiting_mid",
    label: "Chelsea V Super 120s Huddersfield",
    manufacturer: "Huddersfield",
    notes: "Representative mid-tier suiting book.",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "mill_book_maurizio_bonucci_merino",
    key: "maurizio_bonucci_merino",
    programKey: "custom_suiting",
    tierKey: "suiting_mid",
    label: "Maurizio Bonucci Machine Washable Ultrafine Merino Wool",
    manufacturer: "Maurizio Bonucci",
    notes: "Representative mid-tier suiting book.",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "mill_book_brunello_fiesta",
    key: "brunello_fiesta",
    programKey: "custom_suiting",
    tierKey: "suiting_mid",
    label: "Brunello Fiesta!",
    manufacturer: "Brunello",
    notes: "Representative mid-tier suiting book.",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "mill_book_giorgio_alberto_liberty",
    key: "giorgio_alberto_liberty",
    programKey: "custom_suiting",
    tierKey: "suiting_mid",
    label: "Giorgio Alberto Liberty Ultrafine Stretch Wool",
    manufacturer: "Giorgio Alberto",
    notes: "Representative mid-tier suiting book.",
    sortOrder: 4,
    isActive: true,
  },
  {
    id: "mill_book_amalfi_ethomas",
    key: "amalfi_ethomas",
    programKey: "custom_suiting",
    tierKey: "suiting_mid",
    label: "Amalfi by EThomas Superfine Jacketing",
    manufacturer: "EThomas",
    notes: "Representative mid-tier suiting book.",
    sortOrder: 5,
    isActive: true,
  },
  {
    id: "mill_book_gladson_new_york_bamboo_iii",
    key: "gladson_new_york_bamboo_iii",
    programKey: "custom_suiting",
    tierKey: "suiting_mid",
    label: "Gladson New York Bamboo III Jacketing",
    manufacturer: "Gladson New York",
    notes: "Representative mid-tier suiting book.",
    sortOrder: 6,
    isActive: true,
  },
  {
    id: "mill_book_stylbiella_noble_flannel",
    key: "stylbiella_noble_flannel",
    programKey: "custom_suiting",
    tierKey: "suiting_italian",
    label: "StylBiella Noble Flannel",
    manufacturer: "StylBiella",
    notes: "Representative Italian suiting book.",
    sortOrder: 0,
    isActive: true,
  },
  {
    id: "mill_book_stylbiella_knight",
    key: "stylbiella_knight",
    programKey: "custom_suiting",
    tierKey: "suiting_italian",
    label: "StylBiella Knight",
    manufacturer: "StylBiella",
    notes: "Representative Italian suiting book.",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "mill_book_zegna_abiti_fantasia",
    key: "zegna_abiti_fantasia",
    programKey: "custom_suiting",
    tierKey: "suiting_italian",
    label: "Ermenegildo Zegna Abiti Fantasia Fancy Suits",
    manufacturer: "Ermenegildo Zegna",
    notes: "Representative Italian suiting book.",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "mill_book_loro_piana_australis",
    key: "loro_piana_australis",
    programKey: "custom_suiting",
    tierKey: "suiting_italian",
    label: "Loro Piana Australis Super 150s Native Australian Merino Wool",
    manufacturer: "Loro Piana",
    notes: "Representative Italian suiting book.",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "mill_book_vbc_vitality",
    key: "vbc_vitality",
    programKey: "custom_suiting",
    tierKey: "suiting_italian",
    label: "Vitale Barberis Canonico Classic Suits Vitality",
    manufacturer: "Vitale Barberis Canonico",
    notes: "Representative Italian suiting book.",
    sortOrder: 4,
    isActive: true,
  },
  {
    id: "mill_book_2507_maximus_elite_cotton",
    key: "2507_maximus_elite_cotton",
    programKey: "custom_shirting",
    tierKey: "shirting_tier_1",
    label: "2507 Maximus Elite Cotton",
    manufacturer: "Maximus",
    notes: "Representative shirting book.",
    sortOrder: 0,
    isActive: true,
  },
  {
    id: "mill_book_2508_maximus_freedom_cotton",
    key: "2508_maximus_freedom_cotton",
    programKey: "custom_shirting",
    tierKey: "shirting_tier_1",
    label: "2508 Maximus Freedom Cotton",
    manufacturer: "Maximus",
    notes: "Representative shirting book.",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "mill_book_2509_activity_shirt",
    key: "2509_activity_shirt",
    programKey: "custom_shirting",
    tierKey: "shirting_tier_1",
    label: "2509 Activity Shirt",
    manufacturer: "Maximus",
    notes: "Representative shirting book.",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "mill_book_2520_flamenco",
    key: "2520_flamenco",
    programKey: "custom_shirting",
    tierKey: "shirting_tier_2",
    label: "2520 Flamenco",
    manufacturer: "Flamenco",
    notes: "Representative shirting book.",
    sortOrder: 0,
    isActive: true,
  },
  {
    id: "mill_book_2521_flamenco",
    key: "2521_flamenco",
    programKey: "custom_shirting",
    tierKey: "shirting_tier_2",
    label: "2521 Flamenco",
    manufacturer: "Flamenco",
    notes: "Representative shirting book.",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "mill_book_maurizio_bonucci_2_ply",
    key: "maurizio_bonucci_2_ply",
    programKey: "custom_shirting",
    tierKey: "shirting_tier_3",
    label: "Maurizio Bonucci 2 Ply Pure Cotton",
    manufacturer: "Maurizio Bonucci",
    notes: "Representative shirting book.",
    sortOrder: 0,
    isActive: true,
  },
  {
    id: "mill_book_maurizio_bonucci_natural_stretch",
    key: "maurizio_bonucci_natural_stretch",
    programKey: "custom_shirting",
    tierKey: "shirting_tier_3",
    label: "Maurizio Bonucci Natural Stretch Pure Cotton Vol II",
    manufacturer: "Maurizio Bonucci",
    notes: "Representative shirting book.",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "mill_book_essence_soktas_noblesse",
    key: "essence_soktas_noblesse",
    programKey: "custom_shirting",
    tierKey: "shirting_tier_4",
    label: "Essence Soktas Noblesse",
    manufacturer: "Soktas",
    notes: "Representative shirting book.",
    sortOrder: 0,
    isActive: true,
  },
  {
    id: "mill_book_essence_soktas_fastforward",
    key: "essence_soktas_fastforward",
    programKey: "custom_shirting",
    tierKey: "shirting_tier_4",
    label: "Essence Soktas FastForward",
    manufacturer: "Soktas",
    notes: "Representative shirting book.",
    sortOrder: 1,
    isActive: true,
  },
];

export const fabricCatalog: FabricCatalogItemSeed[] = [
  {
    id: "fabric_2501_elite_wool_navy",
    programKey: "custom_suiting",
    tierKey: "suiting_standard",
    bookId: "mill_book_2501_elite_wool",
    sku: "2501-ELITE-NAVY-001",
    label: "Elite Wool Navy",
    composition: "100% wool",
    yarn: "Super 110s",
    weight: "260 g/m",
    lookupType: "both",
    hasQrCode: true,
    qrCodeRawValue: "https://www.greyhound.ltd/shop/product/HFW1914-359",
    qrResolvedUrl: "https://www.greyhound.ltd/shop/product/HFW1914-359",
    externalReference: "greyhound.ltd",
    swatch: "#27344d",
    isActive: true,
  },
  {
    id: "fabric_2503_performance_charcoal",
    programKey: "custom_suiting",
    tierKey: "suiting_standard",
    bookId: "mill_book_2503_performance_wool",
    sku: "2503-PERF-CHAR-002",
    label: "Performance Wool Charcoal",
    composition: "100% wool",
    yarn: "Performance wool",
    weight: "250 g/m",
    lookupType: "both",
    hasQrCode: true,
    qrCodeRawValue: "https://www.greyhound.ltd/en_US/shop/product/hfw109007-111238",
    qrResolvedUrl: "https://www.greyhound.ltd/en_US/shop/product/hfw109007-111238",
    externalReference: "greyhound.ltd",
    swatch: "#4a4f59",
    isActive: true,
  },
  {
    id: "fabric_2504_innovative_stone",
    programKey: "custom_suiting",
    tierKey: "suiting_standard",
    bookId: "mill_book_2504_innovative_fiber",
    sku: "2504-INNOV-STONE-003",
    label: "Innovative Fiber Stone",
    composition: "Wool blend",
    yarn: "Performance blend",
    weight: "245 g/m",
    lookupType: "manual",
    hasQrCode: false,
    qrCodeRawValue: null,
    qrResolvedUrl: null,
    externalReference: null,
    swatch: "#8f8a7a",
    isActive: true,
  },
  {
    id: "fabric_blasone_midnight",
    programKey: "custom_suiting",
    tierKey: "suiting_mid",
    bookId: "mill_book_blasone_ii_huddersfield",
    sku: "BLASONE-II-MIDNIGHT-001",
    label: "Blasone Midnight",
    composition: "100% wool",
    yarn: "Super 110s",
    weight: "270 g/m",
    lookupType: "manual",
    hasQrCode: false,
    qrCodeRawValue: null,
    qrResolvedUrl: null,
    externalReference: null,
    swatch: "#1f3657",
    isActive: true,
  },
  {
    id: "fabric_chelsea_graphite",
    programKey: "custom_suiting",
    tierKey: "suiting_mid",
    bookId: "mill_book_chelsea_v_huddersfield",
    sku: "CHELSEA-V-GRAPHITE-001",
    label: "Chelsea Graphite",
    composition: "100% wool",
    yarn: "Super 120s",
    weight: "280 g/m",
    lookupType: "manual",
    hasQrCode: false,
    qrCodeRawValue: null,
    qrResolvedUrl: null,
    externalReference: null,
    swatch: "#3b4b5c",
    isActive: true,
  },
  {
    id: "fabric_bonucci_merino_ink",
    programKey: "custom_suiting",
    tierKey: "suiting_mid",
    bookId: "mill_book_maurizio_bonucci_merino",
    sku: "BONUCCI-MERINO-INK-001",
    label: "Bonucci Ink",
    composition: "Merino wool",
    yarn: "Ultrafine merino",
    weight: "275 g/m",
    lookupType: "manual",
    hasQrCode: false,
    qrCodeRawValue: null,
    qrResolvedUrl: null,
    externalReference: null,
    swatch: "#2a3747",
    isActive: true,
  },
  {
    id: "fabric_stylbiella_flannel_steel",
    programKey: "custom_suiting",
    tierKey: "suiting_italian",
    bookId: "mill_book_stylbiella_noble_flannel",
    sku: "STYLBIELLA-FLANNEL-STEEL-001",
    label: "Noble Flannel Steel",
    composition: "100% wool",
    yarn: "Luxury flannel",
    weight: "320 g/m",
    lookupType: "manual",
    hasQrCode: false,
    qrCodeRawValue: null,
    qrResolvedUrl: null,
    externalReference: null,
    swatch: "#68717d",
    isActive: true,
  },
  {
    id: "fabric_zegna_evening_black",
    programKey: "custom_suiting",
    tierKey: "suiting_italian",
    bookId: "mill_book_zegna_abiti_fantasia",
    sku: "ZEGNA-ABITI-BLACK-001",
    label: "Abiti Fantasia Evening Black",
    composition: "100% wool",
    yarn: "Fancy suiting",
    weight: "290 g/m",
    lookupType: "manual",
    hasQrCode: false,
    qrCodeRawValue: null,
    qrResolvedUrl: null,
    externalReference: null,
    swatch: "#16181d",
    isActive: true,
  },
  {
    id: "fabric_2507_white",
    programKey: "custom_shirting",
    tierKey: "shirting_tier_1",
    bookId: "mill_book_2507_maximus_elite_cotton",
    sku: "2507-ELITE-WHITE-001",
    label: "Elite Cotton White",
    composition: "100% cotton",
    yarn: "Fine cotton",
    weight: "120 g/m",
    lookupType: "manual",
    hasQrCode: false,
    qrCodeRawValue: null,
    qrResolvedUrl: null,
    externalReference: null,
    swatch: "#f3f2ee",
    isActive: true,
  },
  {
    id: "fabric_2520_sky",
    programKey: "custom_shirting",
    tierKey: "shirting_tier_2",
    bookId: "mill_book_2520_flamenco",
    sku: "2520-FLAMENCO-SKY-001",
    label: "Flamenco Sky",
    composition: "100% cotton",
    yarn: "Refined cotton",
    weight: "125 g/m",
    lookupType: "manual",
    hasQrCode: false,
    qrCodeRawValue: null,
    qrResolvedUrl: null,
    externalReference: null,
    swatch: "#c9d8e5",
    isActive: true,
  },
  {
    id: "fabric_bonucci_pinstripe_blue",
    programKey: "custom_shirting",
    tierKey: "shirting_tier_3",
    bookId: "mill_book_maurizio_bonucci_2_ply",
    sku: "BONUCCI-2PLY-BLUE-001",
    label: "2 Ply Blue Stripe",
    composition: "100% cotton",
    yarn: "2 ply",
    weight: "135 g/m",
    lookupType: "manual",
    hasQrCode: false,
    qrCodeRawValue: null,
    qrResolvedUrl: null,
    externalReference: null,
    swatch: "#d9e1ee",
    isActive: true,
  },
  {
    id: "fabric_soktas_noblesse_white",
    programKey: "custom_shirting",
    tierKey: "shirting_tier_4",
    bookId: "mill_book_essence_soktas_noblesse",
    sku: "SOKTAS-NOBLESSE-WHITE-001",
    label: "Noblesse White",
    composition: "100% cotton",
    yarn: "Luxury shirting",
    weight: "140 g/m",
    lookupType: "manual",
    hasQrCode: false,
    qrCodeRawValue: null,
    qrResolvedUrl: null,
    externalReference: null,
    swatch: "#f7f7f3",
    isActive: true,
  },
];

const garmentBasePriceCatalog: GarmentBasePriceSeed[] = [
  ...createGarmentPriceSeeds("custom_suiting", "suiting_standard", {
    "Two-piece suit": 750,
    "Three-piece suit": 1100,
    Jacket: 550,
    Pants: 250,
    Vest: 150,
    Overcoat: 950,
    "Tuxedo jacket": 650,
    "Three-piece tuxedo": 1200,
    Skirt: 225,
  }),
  ...createGarmentPriceSeeds("custom_suiting", "suiting_mid", {
    "Two-piece suit": MID_TIER_SUITING_FLOOR,
    "Three-piece suit": MID_TIER_SUITING_FLOOR + 350,
    Jacket: 1300,
    Pants: 650,
    Vest: 550,
    Overcoat: 2100,
    "Tuxedo jacket": 1450,
    "Three-piece tuxedo": MID_TIER_SUITING_FLOOR + 450,
    Skirt: 575,
  }),
  ...createGarmentPriceSeeds("custom_suiting", "suiting_italian", {
    "Two-piece suit": 3000,
    "Three-piece suit": 3350,
    Jacket: 2200,
    Pants: 1100,
    Vest: 1000,
    Overcoat: 3300,
    "Tuxedo jacket": 2350,
    "Three-piece tuxedo": 3450,
    Skirt: 1025,
  }),
  ...createGarmentPriceSeeds("custom_shirting", "shirting_tier_1", {
    Shirt: 200,
  }),
  ...createGarmentPriceSeeds("custom_shirting", "shirting_tier_2", {
    Shirt: 300,
  }),
  ...createGarmentPriceSeeds("custom_shirting", "shirting_tier_3", {
    Shirt: 450,
  }),
  ...createGarmentPriceSeeds("custom_shirting", "shirting_tier_4", {
    Shirt: 550,
  }),
];

export const catalogItemCatalog: CatalogItemSeed[] = [
  {
    id: customCatalogItemId,
    key: "custom_garment",
    label: "Custom Garment",
    kind: "product",
    isActive: true,
  },
];

export const catalogVariationCatalog: CatalogVariationSeed[] = customPricingGarments.map((garment) => ({
  id: getCatalogVariationKeyForGarment(garment) ?? `variation_${slugify(garment)}`,
  itemId: customCatalogItemId,
  key: getCatalogVariationKeyForGarment(garment) ?? `variation_${slugify(garment)}`,
  label: garment,
  programKey: getPricingProgramKeyForGarment(garment) ?? "custom_suiting",
  fallbackAmount: getLegacyFallbackAmountForGarment(garment),
  supportsCanvas: supportsJacketConstruction(garment),
  supportsCustomLining: supportsCustomLiningSurcharge(garment),
  supportsLapel: supportsJacketConstruction(garment),
  supportsPocketType: supportsJacketConstruction(garment),
  isActive: true,
}));

export const catalogOptionGroupCatalog: CatalogOptionGroupSeed[] = [
  { id: "catalog_option_group_fabric", itemId: customCatalogItemId, key: "fabric", label: "Fabric", sortOrder: 0, isActive: true },
  { id: "catalog_option_group_buttons", itemId: customCatalogItemId, key: "buttons", label: "Buttons", sortOrder: 1, isActive: true },
  { id: "catalog_option_group_lining", itemId: customCatalogItemId, key: "lining", label: "Lining", sortOrder: 2, isActive: true },
  { id: "catalog_option_group_threads", itemId: customCatalogItemId, key: "threads", label: "Threads", sortOrder: 3, isActive: true },
  { id: "catalog_option_group_lapel", itemId: customCatalogItemId, key: "lapel", label: "Lapel", sortOrder: 4, isActive: true },
  { id: "catalog_option_group_pocket_type", itemId: customCatalogItemId, key: "pocket_type", label: "Pockets", sortOrder: 5, isActive: true },
];

export const catalogModifierGroupCatalog: CatalogModifierGroupSeed[] = [
  { id: "catalog_modifier_group_canvas", itemId: customCatalogItemId, key: "canvas", label: "Canvas", sortOrder: 0, isActive: true },
  { id: "catalog_modifier_group_custom_lining", itemId: customCatalogItemId, key: "custom_lining", label: "Custom printed lining", sortOrder: 1, isActive: true },
];

export const catalogModifierOptionCatalog: CatalogModifierOptionSeed[] = [
  { id: "catalog_modifier_option_canvas_fused", groupId: "catalog_modifier_group_canvas", optionValue: "Fused", label: "Fused canvas", amount: 0, isActive: true },
  { id: "catalog_modifier_option_canvas_half", groupId: "catalog_modifier_group_canvas", optionValue: "Half", label: "Half canvas", amount: 100, isActive: true },
  { id: "catalog_modifier_option_canvas_full", groupId: "catalog_modifier_group_canvas", optionValue: "Full", label: "Full canvas", amount: 200, isActive: true },
  { id: "catalog_modifier_option_custom_lining_standard", groupId: "catalog_modifier_group_custom_lining", optionValue: "standard", label: "Standard lining", amount: 0, isActive: true },
  { id: "catalog_modifier_option_custom_lining_printed", groupId: "catalog_modifier_group_custom_lining", optionValue: "custom_printed", label: "Custom printed lining", amount: 200, isActive: true },
];

export const catalogVariationTierPriceCatalog: CatalogVariationTierPriceSeed[] = garmentBasePriceCatalog.map((price) => ({
  id: `catalog_variation_tier_price_${slugify(price.garmentLabel)}_${price.tierKey}`,
  variationId: getCatalogVariationKeyForGarment(price.garmentLabel) ?? `variation_${slugify(price.garmentLabel)}`,
  tierKey: price.tierKey,
  amount: price.amount,
  isActive: price.isActive,
}));

export function getLegacyFallbackAmountForGarment(garment: string | null) {
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

export function createDefaultPricingPrograms() {
  return pricingProgramCatalog.map((program) => ({ ...program }));
}

export function createDefaultPricingTiers() {
  return pricingTierCatalog.map((tier) => ({ ...tier }));
}

export function createDefaultMillBooks() {
  return millBookCatalog.map((book) => ({ ...book }));
}

export function createDefaultFabricCatalogItems() {
  return fabricCatalog.map((fabric) => ({ ...fabric }));
}

export function createDefaultCatalogItems() {
  return catalogItemCatalog.map((item) => ({ ...item }));
}

export function createDefaultCatalogVariations() {
  return catalogVariationCatalog.map((variation) => ({ ...variation }));
}

export function createDefaultCatalogOptionGroups() {
  return catalogOptionGroupCatalog.map((group) => ({ ...group }));
}

export function createDefaultCatalogModifierGroups() {
  return catalogModifierGroupCatalog.map((group) => ({ ...group }));
}

export function createDefaultCatalogModifierOptions() {
  return catalogModifierOptionCatalog.map((option) => ({ ...option }));
}

export function createDefaultCatalogVariationTierPrices() {
  return catalogVariationTierPriceCatalog.map((price) => ({ ...price }));
}
