import type { PrototypeDatabase } from "./schema";
import {
  createDefaultCatalogItems,
  createDefaultCatalogModifierGroups,
  createDefaultCatalogModifierOptions,
  createDefaultCatalogOptionGroups,
  createDefaultCatalogVariationTierPrices,
  createDefaultCatalogVariations,
  createDefaultFabricCatalogItems,
  createDefaultGarmentBasePrices,
  createDefaultGarmentSurchargeRules,
  createDefaultMillBooks,
  createDefaultPricingPrograms,
  createDefaultPricingTiers,
} from "./customPricingCatalog";
import {
  createCustomerEvents,
  createCustomers,
  createLocations,
  createMeasurementSets,
} from "./runtime/customerSeed";
import {
  applySeedOrderLifecycleTimestamps,
  createOrderTimelineEvents,
  createOrders,
  createOrderScopeLines,
  createOrderScopeLineComponents,
  createOrderScopes,
  createPayments,
  createSquareLinks,
} from "./runtime/orderSeed";
import {
  createPickupAppointments,
  createPickupNotifications,
  createServiceAppointments,
} from "./runtime/scheduleSeed";
import { createStaffMembers } from "./runtime/staffSeed";
import {
  createAlterationServiceDefinitions,
  createCustomGarmentDefinitions,
  createMeasurementFieldDefinitions,
  createStyleOptionDefinitions,
} from "./runtime/referenceSeed";
import { RuntimeSeedDates, toDateTimeString } from "./runtime/support";

function getSeedDates(referenceDate: Date): RuntimeSeedDates {
  const liveReference = new Date(referenceDate);
  liveReference.setSeconds(0, 0);

  const baseDate = new Date(referenceDate);
  baseDate.setHours(12, 0, 0, 0);

  return {
    baseDate,
    liveReference,
  };
}

function syncCustomerMeasurementStatuses(
  customers: PrototypeDatabase["customers"],
  measurementSets: PrototypeDatabase["measurementSets"],
) {
  const customersWithMeasurements = new Set(measurementSets.map((set) => set.customerId));

  return customers.map((customer) => (
    customersWithMeasurements.has(customer.id)
      ? { ...customer, measurementsStatus: "on_file" as const }
      : customer
  ));
}

export function createPrototypeDatabase(referenceDate = new Date()): PrototypeDatabase {
  const seedDates = getSeedDates(referenceDate);
  const locations = createLocations();
  const staffMembers = createStaffMembers();
  const alterationServiceDefinitions = createAlterationServiceDefinitions();
  const catalogItems = createDefaultCatalogItems();
  const catalogVariations = createDefaultCatalogVariations();
  const catalogOptionGroups = createDefaultCatalogOptionGroups();
  const catalogModifierGroups = createDefaultCatalogModifierGroups();
  const catalogModifierOptions = createDefaultCatalogModifierOptions();
  const catalogVariationTierPrices = createDefaultCatalogVariationTierPrices();
  const pricingPrograms = createDefaultPricingPrograms();
  const pricingTiers = createDefaultPricingTiers();
  const millBooks = createDefaultMillBooks();
  const fabricCatalogItems = createDefaultFabricCatalogItems();
  const garmentBasePrices = createDefaultGarmentBasePrices();
  const garmentSurchargeRules = createDefaultGarmentSurchargeRules();
  const customGarmentDefinitions = createCustomGarmentDefinitions();
  const styleOptionDefinitions = createStyleOptionDefinitions();
  const measurementFieldDefinitions = createMeasurementFieldDefinitions();
  const customers = createCustomers();
  const customerEvents = createCustomerEvents(seedDates);
  const measurementSets = createMeasurementSets();
  const normalizedCustomers = syncCustomerMeasurementStatuses(customers, measurementSets);
  const baseOrders = createOrders(seedDates);
  const orderScopes = createOrderScopes(seedDates);
  const orders = applySeedOrderLifecycleTimestamps(baseOrders, orderScopes);
  const orderScopeLines = createOrderScopeLines(orders, orderScopes, measurementSets);
  const orderScopeLineComponents = createOrderScopeLineComponents(orderScopeLines, orderScopes);
  const pickupNotifications = createPickupNotifications(seedDates);
  const pickupAppointments = createPickupAppointments(seedDates);
  const serviceAppointments = createServiceAppointments(seedDates);
  const payments = createPayments(seedDates, orders, orderScopes, orderScopeLines);
  const orderTimelineEvents = createOrderTimelineEvents(orders, orderScopes, payments);
  const squareLinks = createSquareLinks(orders);

  return {
    generatedAt: toDateTimeString(seedDates.baseDate),
    organizationSettings: {
      id: "organization_settings_default",
      organizationName: "SAMEpage Tailor OS",
      defaultLocationId: locations[0]?.id ?? "loc_fifth_avenue",
      taxRate: 0.08875,
      customDepositRate: 0.5,
    },
    locations,
    staffMembers,
    alterationServiceDefinitions,
    catalogItems,
    catalogVariations,
    catalogOptionGroups,
    catalogModifierGroups,
    catalogModifierOptions,
    catalogVariationTierPrices,
    pricingPrograms,
    pricingTiers,
    millBooks,
    fabricCatalogItems,
    garmentBasePrices,
    garmentSurchargeRules,
    customGarmentDefinitions,
    styleOptionDefinitions,
    measurementFieldDefinitions,
    customers: normalizedCustomers,
    customerEvents,
    measurementSets,
    draftOrders: [],
    orders,
    orderScopes,
    orderScopeLines,
    orderScopeLineComponents,
    pickupNotifications,
    pickupAppointments,
    serviceAppointments,
    payments,
    orderTimelineEvents,
    squareLinks,
  };
}
