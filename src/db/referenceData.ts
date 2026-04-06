import type { AlterationCategory, AlterationServiceDefinition, CustomGarmentGender, PickupLocation, StaffMember } from "../types";
import type { PrototypeDatabase } from "./schema";
import { createDefaultCustomPricingBooks } from "./customPricingCatalog";
import {
  createAlterationServiceDefinitions,
  createCustomGarmentDefinitions,
  createMeasurementFieldDefinitions,
  createStyleOptionDefinitions,
} from "./runtime/referenceSeed";

export type AppReferenceData = {
  organizationName: string;
  defaultLocationId: string;
  taxRate: number;
  customDepositRate: number;
  alterationCatalog: AlterationCategory[];
  customPricingBooks: PrototypeDatabase["customPricingBooks"];
  customGarmentOptionsByGender: Record<CustomGarmentGender, string[]>;
  customMaterialOptionsByKind: Record<"fabric" | "buttons" | "lining" | "threads", MaterialOption[]>;
  inHouseTailors: StaffMember[];
  jacketBasedCustomGarments: Set<string>;
  lapelOptions: string[];
  pocketTypeOptions: string[];
  canvasOptions: string[];
  measurementFields: string[];
  pickupLocations: PickupLocation[];
};

export type MaterialOption = {
  sku: string;
  label: string;
  composition?: string;
  yarn?: string;
  weight?: string;
  swatch: string;
  swatchImage?: string;
};

const seedLocations: PrototypeDatabase["locations"] = [
  { id: "loc_fifth_avenue", name: "Fifth Avenue", isActive: true },
  { id: "loc_queens", name: "Queens", isActive: true },
  { id: "loc_long_island", name: "Long Island", isActive: true },
];

const seedAlterationServiceDefinitions = createAlterationServiceDefinitions();
const seedCustomPricingBooks = createDefaultCustomPricingBooks();
const seedCustomGarmentDefinitions = createCustomGarmentDefinitions();
const seedStyleOptionDefinitions = createStyleOptionDefinitions();
const seedMeasurementFieldDefinitions = createMeasurementFieldDefinitions();
const seedMaterialOptionsByKind: Record<"fabric" | "buttons" | "lining" | "threads", MaterialOption[]> = {
  fabric: [
    {
      sku: "DBM562A",
      label: "No. 11",
      composition: "100%Wool",
      yarn: "super110s",
      weight: "240g/m",
      swatch: "#556070",
      swatchImage: "/material-swatches/dbm562a.webp",
    },
    {
      sku: "FAB-MID-001",
      label: "Midnight Navy Stretch Wool",
      composition: "98% wool, 2% elastane",
      yarn: "Super 130s",
      weight: "280 g/m",
      swatch: "#1f3657",
    },
    {
      sku: "FAB-IVR-001",
      label: "Ivory Stretch Wool",
      composition: "96% wool, 4% elastane",
      yarn: "Super 120s",
      weight: "270 g/m",
      swatch: "#e9dfcb",
    },
  ],
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

export function getMeasurementFieldLabels(database: Pick<PrototypeDatabase, "measurementFieldDefinitions">) {
  return database.measurementFieldDefinitions
    .filter((field) => field.isActive)
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((field) => field.label);
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
  jacketBasedCustomGarments: Iterable<string>,
) {
  return Boolean(garment && new Set(jacketBasedCustomGarments).has(garment));
}

export function getPickupLocationNameById(
  locations: Pick<PrototypeDatabase["locations"][number], "id" | "name">[],
  locationId: string,
) {
  return locations.find((location) => location.id === locationId)?.name ?? "";
}

function getStyleOptions(
  styleOptions: PrototypeDatabase["styleOptionDefinitions"],
  kind: "lapel" | "pocket_type" | "canvas",
) {
  return styleOptions.filter((option) => option.kind === kind).map((option) => option.label);
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
    alterationCatalog,
    customPricingBooks: database.customPricingBooks.filter((book) => book.isActive),
    customGarmentOptionsByGender,
    customMaterialOptionsByKind: seedMaterialOptionsByKind,
    inHouseTailors: database.staffMembers
      .filter((staffMember) => staffMember.role === "tailor")
      .map((staffMember) => ({
        id: staffMember.id,
        name: staffMember.name,
        primaryLocation: getPickupLocationNameById(database.locations, staffMember.primaryLocationId) as PickupLocation,
      })),
    jacketBasedCustomGarments: new Set(
      database.customGarmentDefinitions.filter((definition) => definition.jacketBased).map((definition) => definition.label),
    ),
    lapelOptions: getStyleOptions(database.styleOptionDefinitions, "lapel"),
    pocketTypeOptions: getStyleOptions(database.styleOptionDefinitions, "pocket_type"),
    canvasOptions: getStyleOptions(database.styleOptionDefinitions, "canvas"),
    measurementFields: getMeasurementFieldLabels(database),
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
  customPricingBooks: seedCustomPricingBooks,
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
