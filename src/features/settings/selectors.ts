import type { PrototypeDatabase } from "../../db/schema";

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
  const firstBook = database.customPricingBooks[0];
  return firstBook ? (Object.keys(firstBook.basePrices) as Array<keyof typeof firstBook.basePrices>) : [];
}
