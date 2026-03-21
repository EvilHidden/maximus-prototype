import type { Customer, CustomerOrder, MeasurementSet, MeasurementStatus } from "../../types";

export function filterCustomers(customers: Customer[], query: string) {
  const lowerQuery = query.trim().toLowerCase();
  if (!lowerQuery) {
    return customers;
  }

  return customers.filter((customer) => {
    return (
      customer.name.toLowerCase().includes(lowerQuery) ||
      customer.phone.includes(lowerQuery) ||
      customer.id.toLowerCase().includes(lowerQuery) ||
      customer.notes.toLowerCase().includes(lowerQuery)
    );
  });
}

export function getMeasurementStatusLabel(status: MeasurementStatus) {
  if (status === "on_file") {
    return "On file";
  }

  if (status === "needs_update") {
    return "Needs update";
  }

  return "Missing";
}

export function getMeasurementStatusTone(status: MeasurementStatus) {
  if (status === "on_file") {
    return "success" as const;
  }

  if (status === "needs_update") {
    return "warn" as const;
  }

  return "danger" as const;
}

export function getCustomerMeasurementSets(measurementSets: MeasurementSet[], customerId: string | null) {
  if (!customerId) {
    return [];
  }

  return measurementSets.filter((set) => set.customerId === customerId);
}

export function getCustomerLastOrderSummary(orders: CustomerOrder[]) {
  const latestOrder = orders[0];
  if (!latestOrder) {
    return null;
  }

  return `${latestOrder.label} • ${latestOrder.date}`;
}
