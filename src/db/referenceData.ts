import type { AlterationCategory, AlterationServiceDefinition, CustomGarmentGender, PickupLocation, StaffMember } from "../types";
import type { PrototypeDatabase } from "./schema";
import {
  createDefaultCatalogItems,
  createDefaultCatalogModifierGroups,
  createDefaultCatalogModifierOptions,
  createDefaultCatalogOptionGroups,
  createDefaultCatalogVariationTierPrices,
  createDefaultCatalogVariations,
  createDefaultFabricCatalogItems,
  createDefaultMillBooks,
  createDefaultPricingPrograms,
  createDefaultPricingTiers,
  customPricingGarments,
  type CustomPricingGarment,
  type CustomPricingTierDefinition,
  type FabricLookupType,
  type JacketCanvas,
  type PricingProgramKey,
} from "./customPricingCatalog";
import {
  createAlterationServiceDefinitions,
  createCustomGarmentDefinitions,
  createMeasurementFieldDefinitions,
  createStyleOptionDefinitions,
} from "./runtime/referenceSeed";

export type MaterialOption = {
  sku: string;
  label: string;
  composition?: string;
  yarn?: string;
  weight?: string;
  programKey?: PricingProgramKey;
  millLabel?: string;
  manufacturer?: string;
  bookId?: string;
  bookType?: string;
  pricingTierKey?: string;
  pricingTierLabel?: string;
  lookupType?: FabricLookupType;
  hasQrCode?: boolean;
  qrCodeRawValue?: string | null;
  qrResolvedUrl?: string | null;
  externalReference?: string | null;
  swatch: string;
  swatchImage?: string;
};

export type PricingProgramView = PrototypeDatabase["pricingPrograms"][number];
export type PricingTierView = PrototypeDatabase["pricingTiers"][number];
export type MillBookView = PrototypeDatabase["millBooks"][number];
export type FabricCatalogView = PrototypeDatabase["fabricCatalogItems"][number];
export type CatalogItemView = PrototypeDatabase["catalogItems"][number];
export type CatalogVariationView = PrototypeDatabase["catalogVariations"][number];
export type CatalogOptionGroupView = PrototypeDatabase["catalogOptionGroups"][number];
export type CatalogModifierGroupView = PrototypeDatabase["catalogModifierGroups"][number];
export type CatalogModifierOptionView = PrototypeDatabase["catalogModifierOptions"][number];
export type CatalogVariationTierPriceView = PrototypeDatabase["catalogVariationTierPrices"][number];

export type CatalogVariationMatrixRow = CatalogVariationView & {
  tierAmounts: Array<{
    tierKey: string;
    tierLabel: string;
    amount: number;
  }>;
};

export type AppReferenceData = {
  organizationName: string;
  defaultLocationId: string;
  taxRate: number;
  customDepositRate: number;
  catalogItems: CatalogItemView[];
  catalogVariations: CatalogVariationView[];
  catalogOptionGroups: CatalogOptionGroupView[];
  catalogModifierGroups: CatalogModifierGroupView[];
  catalogModifierOptions: CatalogModifierOptionView[];
  catalogVariationTierPrices: CatalogVariationTierPriceView[];
  catalogVariationMatrix: CatalogVariationMatrixRow[];
  pricingPrograms: PricingProgramView[];
  pricingTiers: PricingTierView[];
  millBooks: MillBookView[];
  fabricCatalogItems: FabricCatalogView[];
  alterationCatalog: AlterationCategory[];
  customPricingTiers: CustomPricingTierDefinition[];
  customGarmentOptionsByGender: Record<CustomGarmentGender, string[]>;
  customMaterialOptionsByKind: Record<"fabric" | "buttons" | "lining" | "threads", MaterialOption[]>;
  inHouseTailors: StaffMember[];
  jacketCanvasSurcharges: Record<JacketCanvas, number>;
  customLiningSurchargeAmount: number;
  lapelOptions: string[];
  pocketTypeOptions: string[];
  canvasOptions: string[];
  measurementFields: string[];
  pickupLocations: PickupLocation[];
};

const seedLocations: PrototypeDatabase["locations"] = [
  { id: "loc_fifth_avenue", name: "Fifth Avenue", isActive: true },
  { id: "loc_queens", name: "Queens", isActive: true },
  { id: "loc_long_island", name: "Long Island", isActive: true },
];

const seedAlterationServiceDefinitions = createAlterationServiceDefinitions();
const seedCatalogItems = createDefaultCatalogItems();
const seedCatalogVariations = createDefaultCatalogVariations();
const seedCatalogOptionGroups = createDefaultCatalogOptionGroups();
const seedCatalogModifierGroups = createDefaultCatalogModifierGroups();
const seedCatalogModifierOptions = createDefaultCatalogModifierOptions();
const seedCatalogVariationTierPrices = createDefaultCatalogVariationTierPrices();
const seedPricingPrograms = createDefaultPricingPrograms();
const seedPricingTiers = createDefaultPricingTiers();
const seedMillBooks = createDefaultMillBooks();
const seedFabricCatalogItems = createDefaultFabricCatalogItems();
const seedCustomGarmentDefinitions = createCustomGarmentDefinitions();
const seedStyleOptionDefinitions = createStyleOptionDefinitions();
const seedMeasurementFieldDefinitions = createMeasurementFieldDefinitions();

const defaultNonFabricOptionsByKind: Record<"buttons" | "lining" | "threads", MaterialOption[]> = {
  buttons: [
    {
      sku: "BTN-HORN-001",
      label: "Dark Horn",
      composition: "Natural horn",
      weight: "24L",
      swatch: "#4d392d",
    },
    {
      sku: "BTN-SATIN-001",
      label: "Black Satin",
      composition: "Wrapped satin finish",
      weight: "24L",
      swatch: "#1c1c1c",
    },
  ],
  lining: [
    {
      sku: "LIN-BEMB-001",
      label: "Bemberg Twill",
      composition: "100% cupro",
      yarn: "Fine twill",
      weight: "85 g/m",
      swatch: "#566d93",
    },
    {
      sku: "LIN-CHM-001",
      label: "Champagne Paisley",
      composition: "100% viscose",
      yarn: "Jacquard",
      weight: "95 g/m",
      swatch: "#c8ac73",
    },
  ],
  threads: [
    {
      sku: "THR-TONAL-001",
      label: "Tone-on-Tone Navy",
      composition: "Poly-wrapped core thread",
      yarn: "Tex 40",
      weight: "Medium",
      swatch: "#314868",
    },
    {
      sku: "THR-BLK-001",
      label: "Black Construction Thread",
      composition: "Poly-wrapped core thread",
      yarn: "Tex 40",
      weight: "Medium",
      swatch: "#202124",
    },
  ],
};

function getProgramLabel(programs: PrototypeDatabase["pricingPrograms"], programKey: PricingProgramKey) {
  return programs.find((program) => program.key === programKey)?.label ?? programKey;
}

function getMeasurementFieldLabelsFromDefinitions(measurementFieldDefinitions: PrototypeDatabase["measurementFieldDefinitions"]) {
  return measurementFieldDefinitions
    .filter((field) => field.isActive)
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((field) => field.label);
}

function getStyleOptions(
  styleOptions: PrototypeDatabase["styleOptionDefinitions"],
  kind: "lapel" | "pocket_type" | "canvas",
) {
  return styleOptions.filter((option) => option.kind === kind).map((option) => option.label);
}

function buildCustomPricingTiers(database: PrototypeDatabase): CustomPricingTierDefinition[] {
  return database.pricingTiers
    .filter((tier) => tier.isActive)
    .slice()
    .sort((left, right) => {
      if (left.programKey !== right.programKey) {
        return left.programKey.localeCompare(right.programKey);
      }

      return left.sortOrder - right.sortOrder;
    })
    .map((tier) => {
      const basePrices = database.catalogVariationTierPrices
        .filter((price) => price.isActive && price.tierKey === tier.key)
        .reduce<Partial<Record<CustomPricingGarment, number>>>((accumulator, price) => {
          const variationLabel = database.catalogVariations.find((variation) => variation.id === price.variationId)?.label;
          if (variationLabel) {
            accumulator[variationLabel as CustomPricingGarment] = price.amount;
          }
          return accumulator;
        }, {});

      return {
        key: tier.key,
        programKey: tier.programKey,
        programLabel: getProgramLabel(database.pricingPrograms, tier.programKey),
        label: tier.label,
        sortOrder: tier.sortOrder,
        floorPrice: tier.floorPrice,
        basePrices,
      };
    });
}

function buildFabricMaterialOptions(database: PrototypeDatabase): MaterialOption[] {
  return database.fabricCatalogItems
    .filter((item) => item.isActive)
    .slice()
    .sort((left, right) => left.label.localeCompare(right.label))
    .map((item) => {
      const tier = database.pricingTiers.find((candidate) => candidate.key === item.tierKey);
      const book = database.millBooks.find((candidate) => candidate.id === item.bookId);

      return {
        sku: item.sku,
        label: item.label,
        composition: item.composition,
        yarn: item.yarn,
        weight: item.weight,
        programKey: item.programKey,
        millLabel: book?.label ?? "",
        manufacturer: book?.manufacturer ?? "",
        bookId: book?.id,
        bookType: book?.label ?? "",
        pricingTierKey: tier?.key,
        pricingTierLabel: tier?.label,
        lookupType: item.lookupType,
        hasQrCode: item.hasQrCode,
        qrCodeRawValue: item.qrCodeRawValue,
        qrResolvedUrl: item.qrResolvedUrl,
        externalReference: item.externalReference,
        swatch: item.swatch,
        swatchImage: item.swatchImage,
      };
    });
}

function buildCatalogVariationMatrix(database: PrototypeDatabase): CatalogVariationMatrixRow[] {
  const activeTiers = database.pricingTiers
    .filter((tier) => tier.isActive)
    .slice()
    .sort((left, right) => {
      if (left.programKey !== right.programKey) {
        return left.programKey.localeCompare(right.programKey);
      }

      return left.sortOrder - right.sortOrder;
    });

  return database.catalogVariations
    .filter((variation) => variation.isActive)
    .slice()
    .sort((left, right) => left.label.localeCompare(right.label))
    .map((variation) => ({
      ...variation,
      tierAmounts: activeTiers
        .filter((tier) => tier.programKey === variation.programKey)
        .map((tier) => ({
          tierKey: tier.key,
          tierLabel: tier.label,
          amount: database.catalogVariationTierPrices.find((price) => (
            price.isActive && price.variationId === variation.id && price.tierKey === tier.key
          ))?.amount ?? variation.fallbackAmount,
        })),
    }));
}

function getCatalogVariation<TVariation extends { label: string }>(
  catalogVariations: TVariation[],
  garment: string | null | undefined,
) {
  if (!garment) {
    return null;
  }

  return catalogVariations.find((variation) => variation.label === garment) ?? null;
}

function getJacketCanvasSurcharges(modifierOptions: PrototypeDatabase["catalogModifierOptions"]) {
  return {
    Fused: modifierOptions.find((option) => option.optionValue === "Fused" && option.isActive)?.amount ?? 0,
    Half: modifierOptions.find((option) => option.optionValue === "Half" && option.isActive)?.amount ?? 100,
    Full: modifierOptions.find((option) => option.optionValue === "Full" && option.isActive)?.amount ?? 200,
  } satisfies Record<JacketCanvas, number>;
}

function getCustomLiningSurchargeAmount(modifierOptions: PrototypeDatabase["catalogModifierOptions"]) {
  return modifierOptions.find((option) => option.optionValue === "custom_printed" && option.isActive)?.amount ?? 200;
}

export function getMeasurementFieldLabels(database: Pick<PrototypeDatabase, "measurementFieldDefinitions">) {
  return getMeasurementFieldLabelsFromDefinitions(database.measurementFieldDefinitions);
}

export function createMeasurementValueMap(measurementFields: string[]) {
  return measurementFields.reduce<Record<string, string>>((accumulator, field) => {
    accumulator[field] = "";
    return accumulator;
  }, {});
}

export function createSeedMeasurementValueMap() {
  return createMeasurementValueMap(getMeasurementFieldLabels({ measurementFieldDefinitions: seedMeasurementFieldDefinitions }));
}

export function isJacketBasedCustomGarment(
  garment: string | null,
  catalogVariations: Array<Pick<PrototypeDatabase["catalogVariations"][number], "label" | "supportsCanvas">>,
) {
  return Boolean(getCatalogVariation(catalogVariations, garment)?.supportsCanvas);
}

export function supportsCatalogCustomLining(
  garment: string | null,
  catalogVariations: Array<Pick<PrototypeDatabase["catalogVariations"][number], "label" | "supportsCustomLining">>,
) {
  return Boolean(getCatalogVariation(catalogVariations, garment)?.supportsCustomLining);
}

export function getPickupLocationNameById(
  locations: Pick<PrototypeDatabase["locations"][number], "id" | "name">[],
  locationId: string,
) {
  return locations.find((location) => location.id === locationId)?.name ?? "";
}

export function createReferenceData(database: PrototypeDatabase): AppReferenceData {
  const alterationCatalog = Array.from(
    database.alterationServiceDefinitions
      .filter((service) => service.isActive)
      .reduce<Map<string, AlterationCategory>>((categories, service) => {
        const existing = categories.get(service.category);
        if (existing) {
          existing.services.push({
            id: service.id,
            name: service.name,
            price: service.price,
            supportsAdjustment: service.supportsAdjustment,
            requiresAdjustment: service.requiresAdjustment,
          });
          return categories;
        }

        categories.set(service.category, {
          category: service.category,
          services: [{
            id: service.id,
            name: service.name,
            price: service.price,
            supportsAdjustment: service.supportsAdjustment,
            requiresAdjustment: service.requiresAdjustment,
          }],
        });
        return categories;
      }, new Map()).values(),
  );

  const customGarmentOptionsByGender = database.customGarmentDefinitions.reduce<Record<CustomGarmentGender, string[]>>(
    (options, definition) => {
      options[definition.gender].push(definition.label);
      return options;
    },
    { male: [], female: [] },
  );

  return {
    organizationName: database.organizationSettings.organizationName,
    defaultLocationId: database.organizationSettings.defaultLocationId,
    taxRate: database.organizationSettings.taxRate,
    customDepositRate: database.organizationSettings.customDepositRate,
    catalogItems: database.catalogItems
      .filter((item) => item.isActive)
      .slice(),
    catalogVariations: database.catalogVariations
      .filter((variation) => variation.isActive)
      .slice()
      .sort((left, right) => left.label.localeCompare(right.label)),
    catalogOptionGroups: database.catalogOptionGroups
      .filter((group) => group.isActive)
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder),
    catalogModifierGroups: database.catalogModifierGroups
      .filter((group) => group.isActive)
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder),
    catalogModifierOptions: database.catalogModifierOptions
      .filter((option) => option.isActive)
      .slice()
      .sort((left, right) => left.label.localeCompare(right.label)),
    catalogVariationTierPrices: database.catalogVariationTierPrices
      .filter((price) => price.isActive)
      .slice(),
    catalogVariationMatrix: buildCatalogVariationMatrix(database),
    pricingPrograms: database.pricingPrograms
      .filter((program) => program.isActive)
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder),
    pricingTiers: database.pricingTiers
      .filter((tier) => tier.isActive)
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder),
    millBooks: database.millBooks
      .filter((book) => book.isActive)
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder),
    fabricCatalogItems: database.fabricCatalogItems
      .filter((item) => item.isActive)
      .slice(),
    alterationCatalog,
    customPricingTiers: buildCustomPricingTiers(database),
    customGarmentOptionsByGender,
    customMaterialOptionsByKind: {
      fabric: buildFabricMaterialOptions(database),
      buttons: defaultNonFabricOptionsByKind.buttons,
      lining: defaultNonFabricOptionsByKind.lining,
      threads: defaultNonFabricOptionsByKind.threads,
    },
    inHouseTailors: database.staffMembers
      .filter((staffMember) => staffMember.role === "tailor")
      .map((staffMember) => ({
        id: staffMember.id,
        name: staffMember.name,
        primaryLocation: getPickupLocationNameById(database.locations, staffMember.primaryLocationId) as PickupLocation,
      })),
    jacketCanvasSurcharges: getJacketCanvasSurcharges(database.catalogModifierOptions),
    customLiningSurchargeAmount: getCustomLiningSurchargeAmount(database.catalogModifierOptions),
    lapelOptions: getStyleOptions(database.styleOptionDefinitions, "lapel"),
    pocketTypeOptions: getStyleOptions(database.styleOptionDefinitions, "pocket_type"),
    canvasOptions: getStyleOptions(database.styleOptionDefinitions, "canvas"),
    measurementFields: getMeasurementFieldLabelsFromDefinitions(database.measurementFieldDefinitions),
    pickupLocations: database.locations.filter((location) => location.isActive).map((location) => location.name),
  };
}

const seedReferenceData = createReferenceData({
  generatedAt: "",
  organizationSettings: {
    id: "organization_settings_default",
    organizationName: "SAMEpage Tailor OS",
    defaultLocationId: "loc_fifth_avenue",
    taxRate: 0.08875,
    customDepositRate: 0.5,
  },
  locations: seedLocations,
  staffMembers: [
    {
      id: "staff-tailor-luis",
      name: "Luis Rivera",
      role: "tailor",
      primaryLocationId: "loc_fifth_avenue",
    },
    {
      id: "staff-tailor-nina",
      name: "Nina Patel",
      role: "tailor",
      primaryLocationId: "loc_queens",
    },
  ],
  alterationServiceDefinitions: seedAlterationServiceDefinitions,
  catalogItems: seedCatalogItems,
  catalogVariations: seedCatalogVariations,
  catalogOptionGroups: seedCatalogOptionGroups,
  catalogModifierGroups: seedCatalogModifierGroups,
  catalogModifierOptions: seedCatalogModifierOptions,
  catalogVariationTierPrices: seedCatalogVariationTierPrices,
  pricingPrograms: seedPricingPrograms,
  pricingTiers: seedPricingTiers,
  millBooks: seedMillBooks,
  fabricCatalogItems: seedFabricCatalogItems,
  customGarmentDefinitions: seedCustomGarmentDefinitions,
  styleOptionDefinitions: seedStyleOptionDefinitions,
  measurementFieldDefinitions: seedMeasurementFieldDefinitions,
  customers: [],
  customerEvents: [],
  measurementSets: [],
  draftOrders: [],
  orders: [],
  orderScopes: [],
  orderScopeLines: [],
  orderScopeLineComponents: [],
  pickupNotifications: [],
  pickupAppointments: [],
  serviceAppointments: [],
  payments: [],
  orderTimelineEvents: [],
  squareLinks: [],
});

export function getSeedReferenceData() {
  return seedReferenceData;
}

export function findAlterationServiceDefinition(
  definitions: Array<Pick<PrototypeDatabase["alterationServiceDefinitions"][number], "id" | "category" | "name" | "price" | "supportsAdjustment" | "requiresAdjustment">>,
  garmentLabel: string,
  serviceId: string | null,
  serviceName: string,
): AlterationServiceDefinition | null {
  const match = definitions.find((definition) => (
    definition.category === garmentLabel && (serviceId ? definition.id === serviceId : definition.name === serviceName)
  ));

  if (!match) {
    return null;
  }

  return {
    id: match.id,
    name: match.name,
    price: match.price,
    supportsAdjustment: match.supportsAdjustment,
    requiresAdjustment: match.requiresAdjustment,
  };
}

export { customPricingGarments };
