import type {
  Customer,
  DraftOrderRecord,
  OpenOrderPaymentStatus,
  OrderWorkflowState,
} from "../../types";
import { deserializeOrderWorkflowFromRecords, serializeOrderWorkflowToRecords } from "../orderWorkflowSerializer";
import type { DbOrderScope, PrototypeDatabase } from "../schema";
import type { OrderMutationOptions } from "./shared";
import {
  createDraftOrderRecord,
  deriveOrderStatus,
  getNextOrderSequence,
  getOrderIdFromOpenOrderId,
  getOrderTotal,
  getTotalCollected,
  toDateTimeString,
} from "./shared";

export function replaceDraftOrderRecords(
  database: PrototypeDatabase,
  draftOrders: DraftOrderRecord[],
): PrototypeDatabase {
  return {
    ...database,
    draftOrders: draftOrders.map(createDraftOrderRecord),
  };
}

export function loadOrderWorkflowForEdit(database: PrototypeDatabase, openOrderId: number): OrderWorkflowState | null {
  return deserializeOrderWorkflowFromRecords(database, openOrderId);
}

export function saveOrderWorkflowToDatabase(
  database: PrototypeDatabase,
  order: OrderWorkflowState,
  customers: Customer[],
  paymentStatus: OpenOrderPaymentStatus,
  options: OrderMutationOptions = {},
  editingOpenOrderId: number | null = null,
): { database: PrototypeDatabase; openOrderId: number } | null {
  const now = options.now ?? new Date();
  const existingOrder = editingOpenOrderId ? database.orders.find((candidate) => Number.parseInt(candidate.displayId.replace(/\D/g, ""), 10) === editingOpenOrderId) ?? null : null;
  const nextSequence = existingOrder
    ? Number.parseInt(existingOrder.displayId.replace(/\D/g, ""), 10)
    : options.idFactory?.() ?? getNextOrderSequence(database);
  const serialized = serializeOrderWorkflowToRecords({
    order,
    customers,
    locations: database.locations,
    paymentStatus,
    orderSequence: nextSequence,
    now,
    existingOrder,
    existingScopes: existingOrder ? database.orderScopes.filter((scope) => scope.orderId === existingOrder.id) : [],
    staffMembers: database.staffMembers,
  });
  if (!serialized) {
    return null;
  }

  if (!existingOrder) {
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

  const existingScopeIds = database.orderScopes.filter((scope) => scope.orderId === existingOrder.id).map((scope) => scope.id);
  const existingLineIds = database.orderScopeLines.filter((line) => existingScopeIds.includes(line.scopeId)).map((line) => line.id);
  const existingEventIds = database.orderScopes
    .filter((scope) => scope.orderId === existingOrder.id)
    .map((scope) => scope.eventId)
    .filter((eventId): eventId is string => Boolean(eventId));

  return {
    openOrderId: serialized.openOrderId,
    database: {
      ...database,
      customerEvents: [
        ...database.customerEvents.filter((event) => !existingEventIds.includes(event.id)),
        ...serialized.customerEvents,
      ],
      orders: database.orders.map((record) => (
        record.id === existingOrder.id ? serialized.orderRecord : record
      )),
      orderScopes: [
        ...database.orderScopes.filter((scope) => scope.orderId !== existingOrder.id),
        ...serialized.scopes,
      ],
      orderScopeLines: [
        ...database.orderScopeLines.filter((line) => !existingScopeIds.includes(line.scopeId)),
        ...serialized.scopeLines,
      ],
      orderScopeLineComponents: [
        ...database.orderScopeLineComponents.filter((component) => !existingLineIds.includes(component.lineId)),
        ...serialized.lineComponents,
      ],
      pickupAppointments: [
        ...database.pickupAppointments.filter((appointment) => appointment.orderId !== existingOrder.id),
        ...serialized.pickupAppointments,
      ],
      payments: [
        ...database.payments.filter((payment) => payment.orderId !== existingOrder.id || payment.status === "captured"),
        ...serialized.paymentRecords,
      ],
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

export function assignOpenOrderTailor(
  database: PrototypeDatabase,
  openOrderId: number,
  staffId: string | null,
  now = new Date(),
): PrototypeDatabase {
  const orderId = getOrderIdFromOpenOrderId(database, openOrderId);
  if (!orderId) {
    return database;
  }

  return {
    ...database,
    orderScopes: database.orderScopes.map((scope) => (
      scope.orderId === orderId && scope.workflow === "alteration"
        ? {
            ...scope,
            assigneeStaffId: staffId,
          }
        : scope
    )),
    generatedAt: toDateTimeString(now),
  };
}

export function startOpenOrderWork(
  database: PrototypeDatabase,
  openOrderId: number,
  now = new Date(),
): PrototypeDatabase {
  const orderId = getOrderIdFromOpenOrderId(database, openOrderId);
  if (!orderId) {
    return database;
  }

  return {
    ...database,
    orders: database.orders.map((order) => (
      order.id === orderId
        ? {
            ...order,
            operationalStatus: "in_progress",
          }
        : order
    )),
    generatedAt: toDateTimeString(now),
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

export function completeOpenOrderPickup(
  database: PrototypeDatabase,
  openOrderId: number,
  now = new Date(),
): PrototypeDatabase {
  const orderId = getOrderIdFromOpenOrderId(database, openOrderId);
  if (!orderId) {
    return database;
  }

  const nextScopes = database.orderScopes.map((scope) => (
    scope.orderId === orderId
      ? {
          ...scope,
          phase: "picked_up" as const,
          readyAt: scope.readyAt ?? toDateTimeString(now),
        }
      : scope
  ));

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
    pickupAppointments: database.pickupAppointments.map((appointment) => (
      appointment.orderId === orderId
        ? {
            ...appointment,
            statusKey: "completed",
          }
        : appointment
    )),
    generatedAt: toDateTimeString(now),
  };
}

export function cancelOpenOrder(
  database: PrototypeDatabase,
  openOrderId: number,
  now = new Date(),
): PrototypeDatabase {
  const orderId = getOrderIdFromOpenOrderId(database, openOrderId);
  if (!orderId) {
    return database;
  }

  return {
    ...database,
    orders: database.orders.map((order) => (
      order.id === orderId
        ? {
            ...order,
            status: "canceled",
          }
        : order
    )),
    pickupAppointments: database.pickupAppointments.map((appointment) => (
      appointment.orderId === orderId
        ? {
            ...appointment,
            statusKey: "canceled",
          }
        : appointment
    )),
    serviceAppointments: database.serviceAppointments.map((appointment) => (
      appointment.orderId === orderId
        ? {
            ...appointment,
            statusKey: "canceled",
          }
        : appointment
    )),
    payments: database.payments.filter((payment) => payment.orderId !== orderId || payment.status === "captured"),
    generatedAt: toDateTimeString(now),
  };
}
