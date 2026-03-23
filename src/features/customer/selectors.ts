import type { Customer, CustomerOrder, MeasurementSet, MeasurementStatus } from "../../types";

function formatCustomerOrderDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsed);
}

export function formatCustomerOrderTotal(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

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

export function getActiveCustomers(customers: Customer[]) {
  return customers.filter((customer) => !customer.archived);
}

export function createNextCustomerId(customers: Customer[]) {
  const maxId = customers.reduce((highestId, customer) => {
    const numericId = Number.parseInt(customer.id.replace(/\D/g, ""), 10);
    if (Number.isNaN(numericId)) {
      return highestId;
    }

    return Math.max(highestId, numericId);
  }, 999);

  return `C-${maxId + 1}`;
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

  return `${latestOrder.label} • ${formatCustomerOrderDate(latestOrder.createdAt)}`;
}

export { formatCustomerOrderDate };
