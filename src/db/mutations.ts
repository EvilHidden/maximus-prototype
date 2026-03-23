import type {
  Customer,
  MeasurementSet,
  OpenOrderPaymentStatus,
  OrderWorkflowState,
  WorkflowMode,
} from "../types";
import {
  getCheckoutCollectionAmount,
  getOrderBagLineItems,
  getOrderType,
  getPickupScheduleForScope,
  getRequiredPickupScopes,
} from "../features/order/orderWorkflow";
import type {
  DbCustomer,
  DbCustomerEvent,
  DbMeasurementSet,
  DbOrder,
  DbOrderScope,
  DbOrderScopeLine,
  DbOrderScopeLineComponent,
  DbPaymentRecord,
  DbPickupAppointment,
  PrototypeDatabase,
} from "./schema";
import { createLocationId, toDateTimeString } from "./runtime/support";

type OrderMutationOptions = {
  now?: Date;
  idFactory?: () => number;
};

function cloneDatabase(database: PrototypeDatabase): PrototypeDatabase {
  return {
    ...database,
    customers: [...database.customers],
    customerEvents: [...database.customerEvents],
    measurementSets: [...database.measurementSets],
    orders: [...database.orders],
    orderScopes: [...database.orderScopes],
    orderScopeLines: [...database.orderScopeLines],
    orderScopeLineComponents: [...database.orderScopeLineComponents],
    pickupNotifications: [...database.pickupNotifications],
    pickupAppointments: [...database.pickupAppointments],
    serviceAppointments: [...database.serviceAppointments],
    payments: [...database.payments],
    squareLinks: [...database.squareLinks],
  };
}

function getLocationId(location: string) {
  return createLocationId(location as Customer["preferredLocation"]);
}

function createCustomerRecord(customer: Customer): DbCustomer {
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
  };
}

function getNextOrderSequence(database: PrototypeDatabase) {
  return database.orders.reduce((maxOrder, order) => {
    const numericId = Number.parseInt(order.displayId.replace(/\D/g, ""), 10);
    return Number.isNaN(numericId) ? maxOrder : Math.max(maxOrder, numericId);
  }, 9000) + 1;
}

function getOrderIdFromOpenOrderId(database: PrototypeDatabase, openOrderId: number) {
  return database.orders.find((order) => Number.parseInt(order.displayId.replace(/\D/g, ""), 10) === openOrderId)?.id ?? null;
}

function getOrderTotal(database: PrototypeDatabase, orderId: string) {
  const scopeIds = database.orderScopes.filter((scope) => scope.orderId === orderId).map((scope) => scope.id);
  return database.orderScopeLines
    .filter((line) => scopeIds.includes(line.scopeId))
    .reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
}

function getTotalCollected(database: PrototypeDatabase, orderId: string) {
  return database.payments.reduce((sum, payment) => (
    payment.orderId === orderId && payment.status === "captured" ? sum + payment.amount : sum
  ), 0);
}

function createDateTimeString(date: string, time: string | null, fallbackHour = 12, fallbackMinute = 0) {
  const [hourText = `${fallbackHour}`, minuteText = `${fallbackMinute}`] = (time ?? "").split(":");
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);
  const safeHour = Number.isNaN(hour) ? fallbackHour : hour;
  const safeMinute = Number.isNaN(minute) ? fallbackMinute : minute;
  return `${date}T${`${safeHour}`.padStart(2, "0")}:${`${safeMinute}`.padStart(2, "0")}:00`;
}

function deriveOrderStatus(scopes: DbOrderScope[]): DbOrder["status"] {
  if (scopes.every((scope) => scope.phase === "picked_up")) {
    return "complete";
  }

  if (scopes.some((scope) => scope.phase === "ready")) {
    return "partially_ready";
  }

  return "open";
}

function createInitialPaymentRecords(
  orderId: string,
  paymentStatus: OpenOrderPaymentStatus,
  amount: number,
  now: Date,
): DbPaymentRecord[] {
  if (paymentStatus === "captured" && amount > 0) {
    return [{
      id: `pay-${orderId}-1`,
      orderId,
      source: "prototype",
      status: "captured",
      amount,
      collectedAt: toDateTimeString(now),
      squarePaymentId: null,
    }];
  }

  if (paymentStatus === "pending" && amount > 0) {
    return [{
      id: `pay-${orderId}-1`,
      orderId,
      source: "prototype",
      status: "pending",
      amount,
      collectedAt: null,
      squarePaymentId: null,
    }];
  }

  return [];
}

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

export function deleteCustomerRecord(database: PrototypeDatabase, customerId: string): PrototypeDatabase {
  const nextMeasurementIds = new Set(
    database.measurementSets.filter((set) => set.customerId !== customerId).map((set) => set.id),
  );

  return {
    ...database,
    customers: database.customers.filter((customer) => customer.id !== customerId),
    customerEvents: database.customerEvents.filter((event) => event.customerId !== customerId),
    measurementSets: database.measurementSets.filter((set) => set.customerId !== customerId),
    orders: database.orders.map((order) => (
      order.payerCustomerId === customerId
        ? { ...order, payerCustomerId: null }
        : order
    )),
    orderScopeLines: database.orderScopeLines.map((line) => {
      const needsWearerClear = line.wearerCustomerId === customerId;
      const needsMeasurementClear = line.measurementSetId && !nextMeasurementIds.has(line.measurementSetId);

      if (!needsWearerClear && !needsMeasurementClear) {
        return line;
      }

      return {
        ...line,
        wearerCustomerId: needsWearerClear ? null : line.wearerCustomerId,
        measurementSetId: needsMeasurementClear ? null : line.measurementSetId,
      };
    }),
    pickupAppointments: database.pickupAppointments.map((appointment) => (
      appointment.customerId === customerId
        ? { ...appointment, customerId: null }
        : appointment
    )),
    serviceAppointments: database.serviceAppointments.map((appointment) => (
      appointment.customerId === customerId
        ? { ...appointment, customerId: undefined }
        : appointment
    )),
  };
}

export function replaceMeasurementSetRecords(
  database: PrototypeDatabase,
  measurementSets: MeasurementSet[],
): PrototypeDatabase {
  return {
    ...database,
    measurementSets: measurementSets.map<DbMeasurementSet>((set) => ({ ...set })),
  };
}

export function saveOrderWorkflowToDatabase(
  database: PrototypeDatabase,
  order: OrderWorkflowState,
  customers: Customer[],
  paymentStatus: OpenOrderPaymentStatus,
  options: OrderMutationOptions = {},
): { database: PrototypeDatabase; openOrderId: number } | null {
  const orderType = getOrderType(order);
  if (!orderType) {
    return null;
  }

  const now = options.now ?? new Date();
  const nextSequence = options.idFactory?.() ?? getNextOrderSequence(database);
  const orderId = `order-${nextSequence}`;
  const displayId = `ORD-${nextSequence}`;
  const payer = customers.find((customer) => customer.id === order.payerCustomerId) ?? null;
  const lineItems = getOrderBagLineItems(order, customers);
  const requiredScopes = getRequiredPickupScopes(order);

  const orderRecord: DbOrder = {
    id: orderId,
    displayId,
    payerCustomerId: order.payerCustomerId,
    payerName: payer?.name ?? "Walk-in customer",
    orderType,
    createdAt: toDateTimeString(now),
    status: "open",
    holdUntilAllScopesReady: orderType === "mixed",
  };

  const customerEvents: DbCustomerEvent[] = [];
  const scopes: DbOrderScope[] = [];
  const scopeLines: DbOrderScopeLine[] = [];
  const lineComponents: DbOrderScopeLineComponent[] = [];
  const pickupAppointments: DbPickupAppointment[] = [];

  requiredScopes.forEach((scope, scopeIndex) => {
    const schedule = getPickupScheduleForScope(order, scope);
    const scopeId = `${orderId}-${scope}`;
    const eventId = scope === "custom" && schedule.eventType !== "none" && schedule.eventDate
      ? `event-${orderId}-${scope}`
      : null;
    const promisedReadyAt = scope === "alteration"
      ? (schedule.pickupDate ? createDateTimeString(schedule.pickupDate, schedule.pickupTime || "12:00") : null)
      : (schedule.eventDate ? createDateTimeString(schedule.eventDate, "12:00") : null);

    if (eventId && order.payerCustomerId) {
      customerEvents.push({
        id: eventId,
        customerId: order.payerCustomerId,
        type: schedule.eventType,
        title: `${schedule.eventType} deadline for ${displayId}`,
        eventDate: schedule.eventDate,
      });
    }

    scopes.push({
      id: scopeId,
      orderId,
      workflow: scope,
      phase: "in_progress",
      promisedReadyAt,
      readyAt: null,
      eventId,
      appointmentOptional: scope === "custom",
    });

    const matchingItems = lineItems.filter((item) => item.kind === scope);
    matchingItems.forEach((item, itemIndex) => {
      const lineId = `${scopeId}-line-${itemIndex + 1}`;
      scopeLines.push({
        id: lineId,
        scopeId,
        label: item.sourceLabel,
        garmentLabel: item.garmentLabel,
        quantity: 1,
        unitPrice: item.amount,
        wearerCustomerId: item.wearerCustomerId ?? null,
        wearerName: item.wearerName ?? null,
        measurementSetId: item.linkedMeasurementSetId ?? null,
        measurementSetLabel: item.linkedMeasurementLabel ?? null,
        measurementSnapshot: item.measurementSnapshot ? { ...item.measurementSnapshot } : null,
      });

      item.components.forEach((component) => {
        lineComponents.push({
          id: `${lineId}-${component.kind}-${component.sortOrder}`,
          lineId,
          kind: component.kind,
          label: component.label,
          value: component.value,
          sortOrder: component.sortOrder,
        });
      });
    });

    if (schedule.pickupLocation) {
      const pickupDate = scope === "alteration"
        ? schedule.pickupDate
        : (schedule.eventDate || orderRecord.createdAt.slice(0, 10));

      pickupAppointments.push({
        id: `pickup-${orderId}-${scopeIndex + 1}`,
        orderId,
        scopeId,
        scopeLineId: null,
        customerId: order.payerCustomerId,
        scheduledFor: createDateTimeString(pickupDate, scope === "alteration" ? schedule.pickupTime || "12:00" : "12:00"),
        locationId: getLocationId(schedule.pickupLocation),
        source: "prototype",
        durationMinutes: 15,
        typeKey: "pickup",
        statusKey: "scheduled",
        summary: matchingItems.map((item) => item.sourceLabel).join(", "),
        confirmationStatus: null,
        rush: false,
      });
    }
  });

  const totalCollected = paymentStatus === "captured" ? getCheckoutCollectionAmount(order) : 0;
  const paymentRecords = createInitialPaymentRecords(orderId, paymentStatus, totalCollected, now);

  return {
    openOrderId: nextSequence,
    database: {
      ...database,
      customerEvents: [...database.customerEvents, ...customerEvents],
      orders: [orderRecord, ...database.orders],
      orderScopes: [...database.orderScopes, ...scopes],
      orderScopeLines: [...database.orderScopeLines, ...scopeLines],
      orderScopeLineComponents: [...database.orderScopeLineComponents, ...lineComponents],
      pickupAppointments: [...database.pickupAppointments, ...pickupAppointments],
      payments: [...database.payments, ...paymentRecords],
      generatedAt: toDateTimeString(now),
    },
  };
}

export function startOrderPaymentCollection(
  database: PrototypeDatabase,
  openOrderId: number,
): PrototypeDatabase {
  const orderId = getOrderIdFromOpenOrderId(database, openOrderId);
  if (!orderId) {
    return database;
  }

  const amount = Math.max(getOrderTotal(database, orderId) - getTotalCollected(database, orderId), 0);
  if (amount <= 0) {
    return database;
  }

  const paymentIndex = database.payments.filter((payment) => payment.orderId === orderId).length + 1;
  return {
    ...database,
    payments: [
      ...database.payments,
      {
        id: `pay-${orderId}-${paymentIndex}`,
        orderId,
        source: "prototype",
        status: "pending",
        amount,
        collectedAt: null,
        squarePaymentId: null,
      },
    ],
  };
}

export function captureOrderPayment(
  database: PrototypeDatabase,
  openOrderId: number,
  now = new Date(),
): PrototypeDatabase {
  const orderId = getOrderIdFromOpenOrderId(database, openOrderId);
  if (!orderId) {
    return database;
  }

  const amount = Math.max(getOrderTotal(database, orderId) - getTotalCollected(database, orderId), 0);
  if (amount <= 0) {
    return database;
  }

  const paymentIndex = database.payments.filter((payment) => payment.orderId === orderId).length + 1;
  return {
    ...database,
    payments: [
      ...database.payments,
      {
        id: `pay-${orderId}-${paymentIndex}`,
        orderId,
        source: "prototype",
        status: "captured",
        amount,
        collectedAt: toDateTimeString(now),
        squarePaymentId: null,
      },
    ],
    generatedAt: toDateTimeString(now),
  };
}

export function markOrderScopePickupReady(
  database: PrototypeDatabase,
  scopeId: string,
  now = new Date(),
): PrototypeDatabase {
  const nextScopes: DbOrderScope[] = database.orderScopes.map((scope) => (
    scope.id === scopeId
      ? {
          ...scope,
          phase: "ready",
          promisedReadyAt: scope.promisedReadyAt ?? toDateTimeString(now),
          readyAt: scope.readyAt ?? toDateTimeString(now),
        }
      : scope
  ));
  const orderId = nextScopes.find((scope) => scope.id === scopeId)?.orderId;
  if (!orderId) {
    return database;
  }

  return {
    ...database,
    orderScopes: nextScopes,
    orders: database.orders.map((order) => (
      order.id === orderId
        ? {
            ...order,
            status: deriveOrderStatus(nextScopes.filter((scope) => scope.orderId === orderId)),
          }
        : order
    )),
    generatedAt: toDateTimeString(now),
  };
}
