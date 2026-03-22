import type {
  Appointment,
  ClosedOrderHistoryItem,
  Customer,
  CustomerOrder,
  MeasurementSet,
  OpenOrder,
  OpenOrderPickup,
  OpenOrderPaymentStatus,
} from "../types";
import type {
  DbLocation,
  DbOrder,
  DbOrderScope,
  DbOrderScopeLine,
  DbPaymentRecord,
  PrototypeDatabase,
} from "./schema";

function formatDateLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsed);
}

function formatDateTimeLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function findLocationName(locations: DbLocation[], locationId: string) {
  return locations.find((location) => location.id === locationId)?.name ?? "Fifth Avenue";
}

function getOrderLines(database: PrototypeDatabase, orderId: string) {
  const scopeIds = database.orderScopes.filter((scope) => scope.orderId === orderId).map((scope) => scope.id);
  return database.orderScopeLines.filter((line) => scopeIds.includes(line.scopeId));
}

function getScopeLines(database: PrototypeDatabase, scopeId: string) {
  return database.orderScopeLines.filter((line) => line.scopeId === scopeId);
}

function getPaymentSummary(database: PrototypeDatabase, orderId: string) {
  const records = database.payments.filter((payment) => payment.orderId === orderId);
  const latest = records[records.length - 1];
  const today = new Date(database.generatedAt);
  today.setHours(0, 0, 0, 0);

  const collectedToday = records.reduce((sum, record) => {
    if (!record.collectedAt) {
      return sum;
    }

    const collectedAt = new Date(record.collectedAt);
    if (Number.isNaN(collectedAt.getTime())) {
      return sum;
    }

    collectedAt.setHours(0, 0, 0, 0);
    return collectedAt.getTime() === today.getTime() ? sum + record.amount : sum;
  }, 0);

  return {
    paymentStatus: latest?.status ?? ("pay_later" satisfies OpenOrderPaymentStatus),
    collectedToday,
  };
}

function getOrderTotal(database: PrototypeDatabase, orderId: string) {
  return getOrderLines(database, orderId).reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
}

function deriveOrderStatus(order: DbOrder, scopes: DbOrderScope[]) {
  if (order.status === "complete" || scopes.every((scope) => scope.phase === "picked_up")) {
    return "Picked up";
  }

  if (scopes.every((scope) => scope.phase === "ready")) {
    return "Ready for pickup";
  }

  if (scopes.some((scope) => scope.phase === "ready")) {
    return "Partially ready";
  }

  return "In progress";
}

function getOrderLabel(database: PrototypeDatabase, orderId: string) {
  const lines = getOrderLines(database, orderId);
  if (!lines.length) {
    return "Order";
  }

  return lines.map((line) => line.label).join(", ");
}

function getOpenOrderPickup(
  database: PrototypeDatabase,
  order: DbOrder,
  scope: DbOrderScope,
): OpenOrderPickup {
  const pickupAppointment = database.pickupAppointments.find((appointment) => (
    appointment.orderId === order.id && (appointment.scopeId === scope.id || appointment.scopeId === null)
  ));

  const scopeLines = getScopeLines(database, scope.id);
  const promisedReadyAt = scope.promisedReadyAt ? new Date(scope.promisedReadyAt) : null;
  const pickupDate = pickupAppointment
    ? pickupAppointment.scheduledFor.slice(0, 10)
    : promisedReadyAt
      ? promisedReadyAt.toISOString().slice(0, 10)
      : "";
  const pickupTime = pickupAppointment
    ? new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(pickupAppointment.scheduledFor))
    : promisedReadyAt
      ? new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(promisedReadyAt)
      : "";

  return {
    id: scope.id,
    scope: scope.workflow,
    label: scope.workflow === "custom" ? "Custom pickup" : "Alteration pickup",
    itemSummary: scopeLines.map((line) => line.label),
    itemCount: scopeLines.reduce((sum, line) => sum + line.quantity, 0),
    pickupDate,
    pickupTime,
    pickupLocation: findLocationName(database.locations, pickupAppointment?.locationId ?? database.customers.find((customer) => customer.id === order.payerCustomerId)?.preferredLocationId ?? "loc_fifth_avenue"),
    eventType: database.customerEvents.find((event) => event.id === scope.eventId)?.type ?? "none",
    eventDate: database.customerEvents.find((event) => event.id === scope.eventId)?.eventDate ?? "",
    readyForPickup: scope.phase === "ready" || scope.phase === "picked_up",
  };
}

export function adaptCustomers(database: PrototypeDatabase): Customer[] {
  return database.customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    preferredLocation: findLocationName(database.locations, customer.preferredLocationId),
    lastVisit: customer.lastVisitLabel,
    measurementsStatus: customer.measurementsStatus,
    notes: customer.notes,
    isVip: customer.isVip,
  }));
}

export function adaptMeasurementSets(database: PrototypeDatabase): MeasurementSet[] {
  return database.measurementSets.map((set) => ({
    id: set.id,
    customerId: set.customerId,
    label: set.label,
    takenAt: set.takenAt,
    note: set.note,
    values: set.values,
    suggested: set.suggested,
    isDraft: set.isDraft,
  }));
}

export function adaptCustomerOrders(database: PrototypeDatabase): Record<string, CustomerOrder[]> {
  return database.orders.reduce<Record<string, CustomerOrder[]>>((accumulator, order) => {
    if (!order.payerCustomerId) {
      return accumulator;
    }

    const lineSummary = getOrderLabel(database, order.id);
    const nextEntry: CustomerOrder = {
      id: order.displayId,
      label: lineSummary,
      date: formatDateLabel(order.createdAt),
      status: deriveOrderStatus(order, database.orderScopes.filter((scope) => scope.orderId === order.id)),
      total: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(getOrderTotal(database, order.id)),
    };

    accumulator[order.payerCustomerId] = [nextEntry, ...(accumulator[order.payerCustomerId] ?? [])];
    return accumulator;
  }, {});
}

export function adaptClosedOrderHistory(database: PrototypeDatabase): ClosedOrderHistoryItem[] {
  return database.orders
    .filter((order) => order.status === "complete")
    .map((order) => ({
      id: order.displayId,
      customerName: order.payerName,
      label: getOrderLabel(database, order.id),
      date: formatDateLabel(order.createdAt),
      status: "Picked up",
      total: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(getOrderTotal(database, order.id)),
    }));
}

export function adaptAppointments(database: PrototypeDatabase): Appointment[] {
  const serviceAppointments: Appointment[] = database.serviceAppointments.map((appointment) => {
    const scheduledFor = new Date(appointment.scheduledFor);
    return {
      id: appointment.id,
      date: appointment.scheduledFor.slice(0, 10),
      time: new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(scheduledFor),
      kind: "appointment",
      location: findLocationName(database.locations, appointment.locationId),
      customerId: appointment.customerId,
      customer: appointment.customerName,
      type: appointment.type,
      status: appointment.status,
      missing: appointment.issue,
      route: appointment.workflow,
    };
  });

  const pickupAppointments: Appointment[] = database.pickupAppointments.map((appointment) => {
    const scheduledFor = new Date(appointment.scheduledFor);
    const order = database.orders.find((candidate) => candidate.id === appointment.orderId);
    return {
      id: appointment.id,
      date: appointment.scheduledFor.slice(0, 10),
      time: new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(scheduledFor),
      kind: "pickup",
      location: findLocationName(database.locations, appointment.locationId),
      customerId: appointment.customerId ?? undefined,
      customer: order?.payerName ?? "Unknown customer",
      type: "Pickup appointment",
      pickupSummary: appointment.summary,
      status: `Scheduled pickup • ${formatDateTimeLabel(appointment.scheduledFor)}`,
      missing: appointment.issue,
      route: "pickup",
    };
  });

  return [...serviceAppointments, ...pickupAppointments];
}

export function adaptOpenOrders(database: PrototypeDatabase): OpenOrder[] {
  return database.orders
    .filter((order) => order.status !== "complete")
    .map((order) => {
      const scopes = database.orderScopes.filter((scope) => scope.orderId === order.id);
      const lines = getOrderLines(database, order.id);
      const payment = getPaymentSummary(database, order.id);

      return {
        id: Number.parseInt(order.displayId.replace(/\D/g, ""), 10),
        payerCustomerId: order.payerCustomerId,
        payerName: order.payerName,
        orderType: order.orderType,
        itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
        itemSummary: lines.map((line) => line.label),
        pickupSchedules: scopes.map((scope) => getOpenOrderPickup(database, order, scope)),
        paymentStatus: payment.paymentStatus,
        collectedToday: payment.collectedToday,
        total: getOrderTotal(database, order.id),
        createdAtLabel: formatDateTimeLabel(order.createdAt),
      };
    });
}
