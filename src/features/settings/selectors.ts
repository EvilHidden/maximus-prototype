import type { PrototypeDatabase } from "../../db/schema";
import { customPricingGarments } from "../../db/customPricingCatalog";

export function getSortedMeasurementFields(database: PrototypeDatabase) {
  return database.measurementFieldDefinitions
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function getSortedAlterationServices(database: PrototypeDatabase) {
  return database.alterationServiceDefinitions
    .slice()
    .sort((left, right) => {
      const categoryComparison = left.category.localeCompare(right.category);
      if (categoryComparison !== 0) {
        return categoryComparison;
      }

      return left.name.localeCompare(right.name);
    });
}

export function getSortedLocations(database: PrototypeDatabase) {
  return database.locations
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getCustomPricingGarments(database: PrototypeDatabase) {
  void database;
  return [...customPricingGarments];
}

export function getSortedCustomPricingTiers(database: PrototypeDatabase) {
  return database.customPricingTiers
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder);
}
