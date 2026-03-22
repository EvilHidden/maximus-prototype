import type { PrototypeDatabase } from "./schema";
import {
  createCustomerEvents,
  createCustomers,
  createLocations,
  createMeasurementSets,
} from "./runtime/customerSeed";
import {
  createOrders,
  createOrderScopeLines,
  createOrderScopes,
  createPayments,
  createSquareLinks,
} from "./runtime/orderSeed";
import {
  createPickupAppointments,
  createPickupNotifications,
  createServiceAppointments,
} from "./runtime/scheduleSeed";
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

export function createPrototypeDatabase(referenceDate = new Date()): PrototypeDatabase {
  const seedDates = getSeedDates(referenceDate);
  const locations = createLocations();
  const alterationServiceDefinitions = createAlterationServiceDefinitions();
  const customGarmentDefinitions = createCustomGarmentDefinitions();
  const styleOptionDefinitions = createStyleOptionDefinitions();
  const measurementFieldDefinitions = createMeasurementFieldDefinitions();
  const customers = createCustomers();
  const customerEvents = createCustomerEvents(seedDates);
  const measurementSets = createMeasurementSets();
  const orders = createOrders(seedDates);
  const orderScopes = createOrderScopes(seedDates);
  const orderScopeLines = createOrderScopeLines();
  const pickupNotifications = createPickupNotifications(seedDates);
  const pickupAppointments = createPickupAppointments(seedDates);
  const serviceAppointments = createServiceAppointments(seedDates);
  const payments = createPayments(seedDates);
  const squareLinks = createSquareLinks(orders);

  return {
    generatedAt: toDateTimeString(seedDates.baseDate),
    locations,
    alterationServiceDefinitions,
    customGarmentDefinitions,
    styleOptionDefinitions,
    measurementFieldDefinitions,
    customers,
    customerEvents,
    measurementSets,
    orders,
    orderScopes,
    orderScopeLines,
    pickupNotifications,
    pickupAppointments,
    serviceAppointments,
    payments,
    squareLinks,
  };
}
