import type {
  Customer,
  MeasurementSet,
  OpenOrderPaymentStatus,
  OrderWorkflowState,
} from "../types";
import { serializeOrderWorkflowToRecords } from "./orderWorkflowSerializer";
import type {
  DbCustomer,
  DbMeasurementSet,
  DbOrder,
  DbOrderScope,
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

function deriveOrderStatus(scopes: DbOrderScope[]): DbOrder["status"] {
  if (scopes.every((scope) => scope.phase === "picked_up")) {
    return "complete";
  }

  if (scopes.some((scope) => scope.phase === "ready")) {
    return "partially_ready";
  }

  return "open";
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
  const now = options.now ?? new Date();
  const nextSequence = options.idFactory?.() ?? getNextOrderSequence(database);
  const serialized = serializeOrderWorkflowToRecords({
    order,
    customers,
    paymentStatus,
    orderSequence: nextSequence,
    now,
  });
  if (!serialized) {
    return null;
  }

  return {
    openOrderId: serialized.openOrderId,
    database: {
      ...database,
      customerEvents: [...database.customerEvents, ...serialized.customerEvents],
      orders: [serialized.orderRecord, ...database.orders],
      orderScopes: [...database.orderScopes, ...serialized.scopes],
      orderScopeLines: [...database.orderScopeLines, ...serialized.scopeLines],
      orderScopeLineComponents: [...database.orderScopeLineComponents, ...serialized.lineComponents],
      pickupAppointments: [...database.pickupAppointments, ...serialized.pickupAppointments],
      payments: [...database.payments, ...serialized.paymentRecords],
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
