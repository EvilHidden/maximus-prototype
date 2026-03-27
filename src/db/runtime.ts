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
  const customGarmentDefinitions = createCustomGarmentDefinitions();
  const styleOptionDefinitions = createStyleOptionDefinitions();
  const measurementFieldDefinitions = createMeasurementFieldDefinitions();
  const customers = createCustomers();
  const customerEvents = createCustomerEvents(seedDates);
  const measurementSets = createMeasurementSets();
  const normalizedCustomers = syncCustomerMeasurementStatuses(customers, measurementSets);
  const orders = createOrders(seedDates);
  const orderScopes = createOrderScopes(seedDates);
  const orderScopeLines = createOrderScopeLines(orders, orderScopes, measurementSets);
  const orderScopeLineComponents = createOrderScopeLineComponents(orderScopeLines, orderScopes);
  const pickupNotifications = createPickupNotifications(seedDates);
  const pickupAppointments = createPickupAppointments(seedDates);
  const serviceAppointments = createServiceAppointments(seedDates);
  const payments = createPayments(seedDates, orders, orderScopes, orderScopeLines);
  const squareLinks = createSquareLinks(orders);

  return {
    generatedAt: toDateTimeString(seedDates.baseDate),
    locations,
    staffMembers,
    alterationServiceDefinitions,
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
    squareLinks,
  };
}
