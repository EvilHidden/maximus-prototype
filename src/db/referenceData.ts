import type { AlterationCategory, AlterationServiceDefinition, CustomGarmentGender, PickupLocation, StaffMember } from "../types";
import type { PrototypeDatabase } from "./schema";
import {
  createAlterationServiceDefinitions,
  createCustomGarmentDefinitions,
  createMeasurementFieldDefinitions,
  createStyleOptionDefinitions,
} from "./runtime/referenceSeed";

export type AppReferenceData = {
  alterationCatalog: AlterationCategory[];
  customGarmentOptionsByGender: Record<CustomGarmentGender, string[]>;
  inHouseTailors: StaffMember[];
  jacketBasedCustomGarments: Set<string>;
  lapelOptions: string[];
  pocketTypeOptions: string[];
  canvasOptions: string[];
  measurementFields: string[];
  pickupLocations: PickupLocation[];
};

const seedLocations: PrototypeDatabase["locations"] = [
  { id: "loc_fifth_avenue", name: "Fifth Avenue" },
  { id: "loc_queens", name: "Queens" },
  { id: "loc_long_island", name: "Long Island" },
];

const seedAlterationServiceDefinitions = createAlterationServiceDefinitions();
const seedCustomGarmentDefinitions = createCustomGarmentDefinitions();
const seedStyleOptionDefinitions = createStyleOptionDefinitions();
const seedMeasurementFieldDefinitions = createMeasurementFieldDefinitions();

export function getMeasurementFieldLabels(database: Pick<PrototypeDatabase, "measurementFieldDefinitions">) {
  return database.measurementFieldDefinitions
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
    database.alterationServiceDefinitions.reduce<Map<string, AlterationCategory>>((categories, service) => {
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
    alterationCatalog,
    customGarmentOptionsByGender,
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
    pickupLocations: database.locations.map((location) => location.name),
  };
}

const seedReferenceData = createReferenceData({
  generatedAt: "",
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
