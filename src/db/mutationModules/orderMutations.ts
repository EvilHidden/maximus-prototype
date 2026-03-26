import type {
  Customer,
  DraftOrderRecord,
  OpenOrderPaymentStatus,
  OrderWorkflowState,
} from "../../types";
import { getOpenOrderPickupBalanceDueFromPayments } from "../../features/order/paymentSummary";
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

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function getScopeSubtotal(database: PrototypeDatabase, orderId: string, workflow: DbOrderScope["workflow"]) {
  const scopeIds = database.orderScopes
    .filter((scope) => scope.orderId === orderId && scope.workflow === workflow)
    .map((scope) => scope.id);

  return database.orderScopeLines
    .filter((line) => scopeIds.includes(line.scopeId))
    .reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
}

function getReadyScopeWorkflows(database: PrototypeDatabase, orderId: string) {
  return new Set(
    database.orderScopes
      .filter((scope) => scope.orderId === orderId && scope.phase === "ready")
      .map((scope) => scope.workflow),
  );
}

function getCollectibleAmount(database: PrototypeDatabase, orderId: string) {
  const order = database.orders.find((candidate) => candidate.id === orderId);
  if (!order) {
    return 0;
  }

  const total = getOrderTotal(database, orderId);
  const totalCollected = getTotalCollected(database, orderId);
  const readyWorkflows = getReadyScopeWorkflows(database, orderId);

  if (!readyWorkflows.size) {
    return roundCurrency(Math.max(total - totalCollected, 0));
  }

  const scopeIds = database.orderScopes
    .filter((scope) => scope.orderId === orderId)
    .map((scope) => scope.id);
  const lineItems = database.orderScopeLines
    .filter((line) => scopeIds.includes(line.scopeId))
    .map((line) => {
      const scope = database.orderScopes.find((candidate) => candidate.id === line.scopeId);
      return {
        id: line.id,
        kind: scope?.workflow ?? "alteration",
        title: line.label,
        subtitle: "",
        amount: line.quantity * line.unitPrice,
        sourceLabel: line.label,
        garmentLabel: line.garmentLabel,
        components: [],
      };
    });
  const pickupSchedules = database.orderScopes
    .filter((scope) => scope.orderId === orderId)
    .map((scope) => ({
      id: scope.id,
      scope: scope.workflow,
      label: scope.workflow === "custom" ? "Custom pickup" : "Alteration pickup",
      itemSummary: [],
      itemCount: 0,
      pickupDate: "",
      pickupTime: "",
      pickupLocation: "Fifth Avenue" as const,
      eventType: "none" as const,
      eventDate: "",
      readyAt: scope.readyAt,
      pickedUpAt: scope.pickedUpAt,
      pickedUp: scope.phase === "picked_up",
      readyForPickup: scope.phase === "ready",
    }));

  return getOpenOrderPickupBalanceDueFromPayments({
    orderType: order.orderType,
    lineItems,
    pickupSchedules,
    payments: database.payments.filter((payment) => payment.orderId === orderId),
    total,
  });
}

function getPaymentAllocation(
  database: PrototypeDatabase,
  orderId: string,
  amount: number,
): "custom_deposit" | "alteration_balance" | "custom_balance" | "full_balance" | undefined {
  const readyWorkflows = [...getReadyScopeWorkflows(database, orderId)];
  if (readyWorkflows.length !== 1) {
    return undefined;
  }

  if (readyWorkflows[0] === "alteration") {
    return "alteration_balance";
  }

  if (readyWorkflows[0] === "custom") {
    return "custom_balance";
  }

  return undefined;
}

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
    existingPickupAppointments: existingOrder ? database.pickupAppointments.filter((appointment) => appointment.orderId === existingOrder.id) : [],
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

export function completeOpenOrderCheckout(
  database: PrototypeDatabase,
  openOrderId: number,
  now = new Date(),
): PrototypeDatabase {
  const orderId = getOrderIdFromOpenOrderId(database, openOrderId);
  if (!orderId) {
    return database;
  }

  const amount = getCollectibleAmount(database, orderId);
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
        allocation: getPaymentAllocation(database, orderId, amount),
        amount,
        collectedAt: toDateTimeString(now),
        squarePaymentId: null,
      },
    ],
    generatedAt: toDateTimeString(now),
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
          pickedUpAt: null,
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

  const readyScopeIds = database.orderScopes
    .filter((scope) => scope.orderId === orderId && scope.phase === "ready")
    .map((scope) => scope.id);

  if (!readyScopeIds.length) {
    return database;
  }

  const nextScopes = database.orderScopes.map((scope) => (
    readyScopeIds.includes(scope.id)
      ? {
          ...scope,
          phase: "picked_up" as const,
          readyAt: scope.readyAt ?? toDateTimeString(now),
          pickedUpAt: toDateTimeString(now),
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
      readyScopeIds.includes(appointment.scopeId ?? "")
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
