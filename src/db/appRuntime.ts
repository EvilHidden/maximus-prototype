import {
  adaptAppointments,
  adaptClosedOrderHistory,
  adaptCustomerOrders,
  adaptCustomers,
  adaptMeasurementSets,
  adaptOpenOrders,
} from "./adapters";
import { createPrototypeDatabase } from "./runtime";
import type { PrototypeDatabase } from "./schema";

export type AppRuntime = {
  database: PrototypeDatabase;
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
    customers: adaptCustomers(database),
    customerOrders: adaptCustomerOrders(database),
    appointments: adaptAppointments(database),
    measurementSets: adaptMeasurementSets(database),
    openOrders: adaptOpenOrders(database),
    closedOrderHistory: adaptClosedOrderHistory(database),
  };
}
