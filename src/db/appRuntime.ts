import {
  adaptAppointments,
  adaptClosedOrderHistory,
  adaptCustomerOrders,
  adaptCustomers,
  adaptMeasurementSets,
  adaptOpenOrders,
} from "./adapters";
import { createReferenceData, type AppReferenceData } from "./referenceData";
import { createPrototypeDatabase } from "./runtime";
import type { PrototypeDatabase } from "./schema";

export type AppRuntime = {
  database: PrototypeDatabase;
  referenceData: AppReferenceData;
  customers: ReturnType<typeof adaptCustomers>;
  customerOrders: ReturnType<typeof adaptCustomerOrders>;
  appointments: ReturnType<typeof adaptAppointments>;
  measurementSets: ReturnType<typeof adaptMeasurementSets>;
  openOrders: ReturnType<typeof adaptOpenOrders>;
  closedOrderHistory: ReturnType<typeof adaptClosedOrderHistory>;
};

export function createAppRuntime(referenceDate = new Date()): AppRuntime {
  const database = createPrototypeDatabase(referenceDate);

  return {
    database,
    referenceData: createReferenceData(database),
    customers: adaptCustomers(database),
    customerOrders: adaptCustomerOrders(database),
    appointments: adaptAppointments(database),
    measurementSets: adaptMeasurementSets(database),
    openOrders: adaptOpenOrders(database),
    closedOrderHistory: adaptClosedOrderHistory(database),
  };
}
