import type {
  AppointmentConfirmationStatus,
  AppointmentTypeKey,
  Customer,
  DraftOrderRecord,
  PickupLocation,
  ServiceAppointmentType,
} from "../../types";
import type {
  DbCustomer,
  DbDraftOrder,
  DbMeasurementSet,
  DbOrder,
  DbOrderScope,
  PrototypeDatabase,
} from "../schema";
import { createMeasurementValueMap, getMeasurementFieldLabels } from "../referenceData";
import { createLocationId, toDateTimeString } from "../runtime/support";

export type OrderMutationOptions = {
  now?: Date;
  idFactory?: () => number;
};

export type CreateAppointmentPayload = {
  customerId: string;
  typeKey: ServiceAppointmentType;
  location: PickupLocation;
  scheduledFor: string;
};

export type RescheduleAppointmentPayload = {
  appointmentId: string;
  location: PickupLocation;
  scheduledFor: string;
};

export type UpdateAppointmentPayload = {
  appointmentId: string;
  customerId: string;
  typeKey: AppointmentTypeKey;
  location: PickupLocation;
  scheduledFor: string;
  confirmationStatus: AppointmentConfirmationStatus;
};

export type SaveMeasurementSetPayload = {
  customerId: string;
  measurementSetId: string | null;
  measurements: Record<string, string>;
  mode: "update" | "copy";
  title?: string;
};

export type DeleteMeasurementSetPayload = {
  measurementSetId: string;
  linkedMeasurementSetId: string | null;
  customerId: string | null;
  measurements: Record<string, string>;
};

export function cloneDatabase(database: PrototypeDatabase): PrototypeDatabase {
  return {
    ...database,
    staffMembers: [...database.staffMembers],
    customers: [...database.customers],
    customerEvents: [...database.customerEvents],
    measurementSets: [...database.measurementSets],
    draftOrders: [...database.draftOrders],
    orders: [...database.orders],
    orderScopes: [...database.orderScopes],
    orderScopeLines: [...database.orderScopeLines],
    orderScopeLineComponents: [...database.orderScopeLineComponents],
    pickupNotifications: [...database.pickupNotifications],
    pickupAppointments: [...database.pickupAppointments],
    serviceAppointments: [...database.serviceAppointments],
    payments: [...database.payments],
    orderTimelineEvents: [...database.orderTimelineEvents],
    squareLinks: [...database.squareLinks],
  };
}

export function getLocationId(location: string) {
  return createLocationId(location as Customer["preferredLocation"]);
}

export function createCustomerRecord(customer: Customer): DbCustomer {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    preferredLocationId: getLocationId(customer.preferredLocation),
    lastVisitLabel: customer.lastVisit,
    measurementsStatus: customer.measurementsStatus,
    marketingOptIn: customer.marketingOptIn,
    notes: customer.notes,
    isVip: customer.isVip,
    status: customer.archived ? "archived" : "active",
  };
}

export function createDraftOrderRecord(draftOrder: DraftOrderRecord): DbDraftOrder {
  return {
    id: draftOrder.id,
    payerCustomerId: draftOrder.payerCustomerId,
    selectedCustomerId: draftOrder.selectedCustomerId,
    updatedAt: draftOrder.updatedAt,
    snapshot: draftOrder.snapshot,
  };
}

export function getNextOrderSequence(database: PrototypeDatabase) {
  return database.orders.reduce((maxOrder, order) => {
    const numericId = Number.parseInt(order.displayId.replace(/\D/g, ""), 10);
    return Number.isNaN(numericId) ? maxOrder : Math.max(maxOrder, numericId);
  }, 9000) + 1;
}

export function getOrderIdFromOpenOrderId(database: PrototypeDatabase, openOrderId: number) {
  return database.orders.find((order) => Number.parseInt(order.displayId.replace(/\D/g, ""), 10) === openOrderId)?.id ?? null;
}

export function getScopeIdFromAppointment(database: PrototypeDatabase, appointmentId: string) {
  const pickupAppointment = database.pickupAppointments.find((appointment) => appointment.id === appointmentId);
  return pickupAppointment?.scopeId ?? null;
}

export function getAppointmentWorkflow(typeKey: CreateAppointmentPayload["typeKey"]) {
  return typeKey === "alteration_fitting" ? "alteration" : "custom";
}

export function createEmptyMeasurementValuesFromDatabase(database: PrototypeDatabase) {
  return createMeasurementValueMap(getMeasurementFieldLabels(database));
}

export function formatMeasurementDateLabel(now: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(now);
}

export function deriveCustomerMeasurementStatus(measurementSets: DbMeasurementSet[]): DbCustomer["measurementsStatus"] {
  if (measurementSets.some((set) => !set.isDraft)) {
    return "on_file";
  }

  return "missing";
}

export function syncCustomerMeasurementStatus(database: PrototypeDatabase, customerId: string): PrototypeDatabase {
  const customerMeasurementSets = database.measurementSets.filter((set) => set.customerId === customerId);
  const nextStatus = deriveCustomerMeasurementStatus(customerMeasurementSets);

  return {
    ...database,
    customers: database.customers.map((customer) => (
      customer.id === customerId
        ? { ...customer, measurementsStatus: nextStatus }
        : customer
    )),
  };
}

export function getOrderTotal(database: PrototypeDatabase, orderId: string) {
  const scopeIds = database.orderScopes.filter((scope) => scope.orderId === orderId).map((scope) => scope.id);
  return database.orderScopeLines
    .filter((line) => scopeIds.includes(line.scopeId))
    .reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
}

export function getTotalCollected(database: PrototypeDatabase, orderId: string) {
  return database.payments.reduce((sum, payment) => (
    payment.orderId === orderId && payment.status === "captured" ? sum + payment.amount : sum
  ), 0);
}

export function deriveOrderStatus(scopes: DbOrderScope[]): DbOrder["status"] {
  if (scopes.every((scope) => scope.phase === "picked_up")) {
    return "complete";
  }

  if (scopes.some((scope) => scope.phase === "picked_up")) {
    return "partially_picked_up";
  }

  if (scopes.some((scope) => scope.phase === "ready")) {
    return "partially_ready";
  }

  return "open";
}

export { toDateTimeString };
