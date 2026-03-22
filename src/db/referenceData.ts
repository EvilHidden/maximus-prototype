import type { AlterationCategory, CustomGarmentGender, PickupLocation } from "../types";
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
  jacketBasedCustomGarments: Set<string>;
  lapelOptions: string[];
  pocketTypeOptions: string[];
  canvasOptions: string[];
  measurementFields: string[];
  pickupLocations: PickupLocation[];
};

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
        existing.services.push({ name: service.name, price: service.price });
        return categories;
      }

      categories.set(service.category, {
        category: service.category,
        services: [{ name: service.name, price: service.price }],
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
    jacketBasedCustomGarments: new Set(
      database.customGarmentDefinitions.filter((definition) => definition.jacketBased).map((definition) => definition.label),
    ),
    lapelOptions: getStyleOptions(database.styleOptionDefinitions, "lapel"),
    pocketTypeOptions: getStyleOptions(database.styleOptionDefinitions, "pocket_type"),
    canvasOptions: getStyleOptions(database.styleOptionDefinitions, "canvas"),
    measurementFields: database.measurementFieldDefinitions
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((field) => field.label),
    pickupLocations: database.locations.map((location) => location.name),
  };
}

export function createSeedReferenceData(): AppReferenceData {
  return createReferenceData({
    generatedAt: "",
    locations: [
      { id: "loc_fifth_avenue", name: "Fifth Avenue" },
      { id: "loc_queens", name: "Queens" },
      { id: "loc_long_island", name: "Long Island" },
    ],
    alterationServiceDefinitions: createAlterationServiceDefinitions(),
    customGarmentDefinitions: createCustomGarmentDefinitions(),
    styleOptionDefinitions: createStyleOptionDefinitions(),
    measurementFieldDefinitions: createMeasurementFieldDefinitions(),
    customers: [],
    customerEvents: [],
    measurementSets: [],
    orders: [],
    orderScopes: [],
    orderScopeLines: [],
    pickupNotifications: [],
    pickupAppointments: [],
    serviceAppointments: [],
    payments: [],
    squareLinks: [],
    airtableLinks: [],
  });
}
