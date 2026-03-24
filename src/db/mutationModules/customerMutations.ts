import type { Customer } from "../../types";
import type { PrototypeDatabase } from "../schema";
import { cloneDatabase, createCustomerRecord } from "./shared";

export function addCustomerRecord(database: PrototypeDatabase, customer: Customer): PrototypeDatabase {
  const next = cloneDatabase(database);
  next.customers = [createCustomerRecord(customer), ...database.customers];
  return next;
}

export function updateCustomerRecord(database: PrototypeDatabase, customer: Customer): PrototypeDatabase {
  const nextCustomer = createCustomerRecord(customer);
  return {
    ...database,
    customers: database.customers.map((record) => (record.id === customer.id ? nextCustomer : record)),
  };
}

export function archiveCustomerRecord(database: PrototypeDatabase, customerId: string): PrototypeDatabase {
  return {
    ...database,
    customers: database.customers.map((customer) => (
      customer.id === customerId
        ? { ...customer, status: "archived" }
        : customer
    )),
  };
}
