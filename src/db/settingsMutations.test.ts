import { describe, expect, it } from "vitest";
import { createPrototypeDatabase } from "./runtime";
import {
  addMeasurementFieldDefinition,
  updateCustomPricingTierGarmentPrice,
  updateLocationRecord,
  updateMeasurementFieldDefinition,
} from "./mutations";
import { createReferenceData } from "./referenceData";
import { getCustomGarmentPrice } from "./pricing";

describe("settings mutations", () => {
  it("adds and renames measurement fields across saved measurement maps", () => {
    const database = createPrototypeDatabase(new Date("2026-04-05T12:00:00.000Z"));
    const withAddedField = addMeasurementFieldDefinition(database, "Forearm");
    const renamedFieldId = withAddedField.measurementFieldDefinitions.find((field) => field.label === "Forearm")?.id;

    expect(renamedFieldId).toBeTruthy();
    expect(withAddedField.measurementSets.every((set) => "Forearm" in set.values)).toBe(true);
    expect(withAddedField.orderScopeLines.every((line) => !line.measurementSnapshot || "Forearm" in line.measurementSnapshot)).toBe(true);

    const renamedFieldDatabase = updateMeasurementFieldDefinition(withAddedField, renamedFieldId!, { label: "Forearm girth" });
    expect(renamedFieldDatabase.measurementSets.every((set) => "Forearm girth" in set.values)).toBe(true);
    expect(renamedFieldDatabase.measurementSets.every((set) => !("Forearm" in set.values))).toBe(true);
  });

  it("falls forward to another active default location when the current default is deactivated", () => {
    const database = createPrototypeDatabase(new Date("2026-04-05T12:00:00.000Z"));
    const updatedDatabase = updateLocationRecord(database, database.organizationSettings.defaultLocationId, { isActive: false });
    const referenceData = createReferenceData(updatedDatabase);

    expect(updatedDatabase.organizationSettings.defaultLocationId).not.toBe(database.organizationSettings.defaultLocationId);
    expect(referenceData.pickupLocations).not.toContain(
      database.locations.find((location) => location.id === database.organizationSettings.defaultLocationId)?.name ?? "",
    );
  });

  it("uses updated custom pricing tier values for garment pricing", () => {
    const database = createPrototypeDatabase(new Date("2026-04-05T12:00:00.000Z"));
    const targetTier = database.customPricingTiers[0];
    const updatedDatabase = updateCustomPricingTierGarmentPrice(database, targetTier.key, "Two-piece suit", 1777);

    expect(getCustomGarmentPrice({
      selectedGarment: "Two-piece suit",
      pricingTierKey: targetTier.key,
    }, {
      pricingTiers: updatedDatabase.customPricingTiers,
    })).toBe(1777);
  });
});
