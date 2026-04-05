import type {
  CheckoutPaymentMode,
  Customer,
  OrderWorkflowState,
} from "../../types";
import {
  getMixedPaymentAllocationFromPayments,
  getOpenOrderPickupBalanceDueFromPayments,
  getPaymentAmountFromPolicy,
  getRecordedPaymentPolicy,
} from "../../features/order/paymentSummary";
import { deserializeOrderWorkflowFromRecords, serializeOrderWorkflowToRecords } from "../orderWorkflowSerializer";
import type { DbOrderScope, DbOrderTimelineEvent, DbPaymentRecord, PrototypeDatabase } from "../schema";
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

function createTimelineEvent({
  id,
  orderId,
  type,
  label,
  occurredAt,
  amount = null,
}: {
  id: string;
  orderId: string;
  type: DbOrderTimelineEvent["type"];
  label: string;
  occurredAt: string;
  amount?: number | null;
}): DbOrderTimelineEvent {
  return {
    id,
    orderId,
    type,
    label,
    occurredAt,
    amount,
  };
}

function getTimelinePaymentLabel(payment: Pick<DbPaymentRecord, "allocation">) {
  switch (payment.allocation) {
    case "custom_deposit":
      return "Deposit taken";
    case "alteration_balance":
      return "Alteration balance payment taken";
    case "custom_balance":
      return "Custom balance payment taken";
    case "full_balance":
      return "Payment taken";
    default:
      return "Payment taken";
  }
}

function getScopeTimelineLabel(workflow: DbOrderScope["workflow"], suffix: "ready" | "picked up") {
  return `${workflow === "alteration" ? "Alterations" : "Custom garments"} ${suffix}`;
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

function getPaymentAmount(
  database: PrototypeDatabase,
  orderId: string,
  paymentMode: Exclude<CheckoutPaymentMode, "none">,
) {
  const order = database.orders.find((candidate) => candidate.id === orderId);
  if (!order) {
    return 0;
  }

  const total = getOrderTotal(database, orderId);
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
        isRush: line.isRush,
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

  const payments = database.payments.filter((payment) => payment.orderId === orderId);
  const policy = getRecordedPaymentPolicy({
    orderType: order.orderType,
    lineItems,
    pickupSchedules,
    payments,
    total,
  });

  return getPaymentAmountFromPolicy(policy, paymentMode);
}

function getPaymentAllocation(
  database: PrototypeDatabase,
  orderId: string,
  paymentMode: Exclude<CheckoutPaymentMode, "none">,
): "custom_deposit" | "alteration_balance" | "custom_balance" | "full_balance" | undefined {
  if (paymentMode === "full_balance") {
    return "full_balance";
  }

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

function createCapturedPaymentRecords({
  database,
  orderId,
  paymentMode,
  amount,
  now,
}: {
  database: PrototypeDatabase;
  orderId: string;
  paymentMode: Exclude<CheckoutPaymentMode, "none">;
  amount: number;
  now: Date;
}) {
  const order = database.orders.find((candidate) => candidate.id === orderId);
  const existingCount = database.payments.filter((payment) => payment.orderId === orderId).length;

  if (order?.orderType === "mixed" && paymentMode === "deposit_and_alterations") {
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
          isRush: line.isRush,
          sourceLabel: line.label,
          garmentLabel: line.garmentLabel,
          components: [],
        };
      });
    const total = getOrderTotal(database, orderId);
    const allocation = getMixedPaymentAllocationFromPayments({
      payments: database.payments.filter((payment) => payment.orderId === orderId),
      lineItems,
      total,
    });
    const depositAmount = roundCurrency(Math.max(allocation.depositDue - allocation.depositPaid, 0));
    const alterationAmount = roundCurrency(Math.max(amount - depositAmount, 0));
    const records = [];

    if (depositAmount > 0) {
      records.push({
        id: `pay-${orderId}-${existingCount + records.length + 1}`,
        orderId,
        source: "prototype" as const,
        status: "captured" as const,
        allocation: "custom_deposit" as const,
        amount: depositAmount,
        collectedAt: toDateTimeString(now),
        squarePaymentId: null,
      });
    }

    if (alterationAmount > 0) {
      records.push({
        id: `pay-${orderId}-${existingCount + records.length + 1}`,
        orderId,
        source: "prototype" as const,
        status: "captured" as const,
        allocation: "alteration_balance" as const,
        amount: alterationAmount,
        collectedAt: toDateTimeString(now),
        squarePaymentId: null,
      });
    }

    return records;
  }

  return [{
    id: `pay-${orderId}-${existingCount + 1}`,
    orderId,
    source: "prototype" as const,
    status: "captured" as const,
    allocation: getPaymentAllocation(database, orderId, paymentMode),
    amount,
    collectedAt: toDateTimeString(now),
    squarePaymentId: null,
  }];
}

export function replaceDraftOrderRecords(
  database: PrototypeDatabase,
  draftOrders: import("../../types").DraftOrderRecord[],
): PrototypeDatabase {
  return {
    ...database,
    draftOrders: draftOrders.map(createDraftOrderRecord),
  };
}

export function loadOrderWorkflowForEdit(database: PrototypeDatabase, openOrderId: number): OrderWorkflowState | null {
  return deserializeOrderWorkflowFromRecords(database, openOrderId);
}

export function revertAcceptedOrderSave(database: PrototypeDatabase, openOrderId: number): PrototypeDatabase {
  const orderId = getOrderIdFromOpenOrderId(database, openOrderId);
  if (!orderId) {
    return database;
  }

  const scopeIds = database.orderScopes
    .filter((scope) => scope.orderId === orderId)
    .map((scope) => scope.id);
  const lineIds = database.orderScopeLines
    .filter((line) => scopeIds.includes(line.scopeId))
    .map((line) => line.id);
  const eventIds = database.orderScopes
    .filter((scope) => scope.orderId === orderId)
    .map((scope) => scope.eventId)
    .filter((eventId): eventId is string => Boolean(eventId));

  return {
    ...database,
    customerEvents: database.customerEvents.filter((event) => !eventIds.includes(event.id)),
    orders: database.orders.filter((order) => order.id !== orderId),
    orderScopes: database.orderScopes.filter((scope) => scope.orderId !== orderId),
    orderScopeLines: database.orderScopeLines.filter((line) => !scopeIds.includes(line.scopeId)),
    orderScopeLineComponents: database.orderScopeLineComponents.filter((component) => !lineIds.includes(component.lineId)),
    pickupNotifications: database.pickupNotifications.filter((notification) => !scopeIds.includes(notification.scopeId)),
    pickupAppointments: database.pickupAppointments.filter((appointment) => appointment.orderId !== orderId),
    serviceAppointments: database.serviceAppointments.filter((appointment) => appointment.orderId !== orderId),
    payments: database.payments.filter((payment) => payment.orderId !== orderId),
    orderTimelineEvents: database.orderTimelineEvents.filter((event) => event.orderId !== orderId),
    squareLinks: database.squareLinks.filter((link) => link.orderId !== orderId),
  };
}

export function saveOrderWorkflowToDatabase(
  database: PrototypeDatabase,
  order: OrderWorkflowState,
  customers: Customer[],
  paymentMode: CheckoutPaymentMode,
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
    paymentMode: editingOpenOrderId ? "none" : paymentMode,
    orderSequence: nextSequence,
    now,
    existingOrder,
    existingScopes: existingOrder ? database.orderScopes.filter((scope) => scope.orderId === existingOrder.id) : [],
    existingPickupAppointments: existingOrder ? database.pickupAppointments.filter((appointment) => appointment.orderId === existingOrder.id) : [],
  });
  if (!serialized) {
    return null;
  }

  if (!existingOrder) {
    const occurredAt = toDateTimeString(now);
    const timelineEvents: DbOrderTimelineEvent[] = [
      createTimelineEvent({
        id: `timeline-${serialized.orderRecord.id}-created`,
        orderId: serialized.orderRecord.id,
        type: "order_created",
        label: "Order created",
        occurredAt,
      }),
      createTimelineEvent({
        id: `timeline-${serialized.orderRecord.id}-accepted`,
        orderId: serialized.orderRecord.id,
        type: "order_accepted",
        label: "Order accepted",
        occurredAt,
      }),
      ...serialized.paymentRecords
        .filter((payment) => payment.status === "captured" && payment.collectedAt)
        .map((payment) => createTimelineEvent({
          id: `timeline-${payment.id}`,
          orderId: payment.orderId,
          type: "payment_captured",
          label: getTimelinePaymentLabel(payment),
          occurredAt: payment.collectedAt ?? occurredAt,
          amount: payment.amount,
        })),
    ];

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
        orderTimelineEvents: [...database.orderTimelineEvents, ...timelineEvents],
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
      orderTimelineEvents: [...database.orderTimelineEvents],
      generatedAt: toDateTimeString(now),
    },
  };
}

export function completeOpenOrderCheckout(
  database: PrototypeDatabase,
  openOrderId: number,
  paymentMode: Exclude<CheckoutPaymentMode, "none">,
  now = new Date(),
): PrototypeDatabase {
  const orderId = getOrderIdFromOpenOrderId(database, openOrderId);
  if (!orderId) {
    return database;
  }

  const amount = getPaymentAmount(database, orderId, paymentMode);
  if (amount <= 0) {
    return database;
  }

  const newPayments = createCapturedPaymentRecords({ database, orderId, paymentMode, amount, now });

  return {
    ...database,
    payments: [
      ...database.payments,
      ...newPayments,
    ],
    orderTimelineEvents: [
      ...database.orderTimelineEvents,
      ...newPayments
        .filter((payment) => payment.status === "captured" && payment.collectedAt)
        .map((payment) => createTimelineEvent({
          id: `timeline-${payment.id}`,
          orderId: payment.orderId,
          type: "payment_captured",
          label: getTimelinePaymentLabel(payment),
          occurredAt: payment.collectedAt ?? toDateTimeString(now),
          amount: payment.amount,
        })),
    ],
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
    orderTimelineEvents: database.orderTimelineEvents.some((event) => event.orderId === orderId && event.type === "order_started")
      ? database.orderTimelineEvents
      : [
          ...database.orderTimelineEvents,
          createTimelineEvent({
            id: `timeline-${orderId}-started`,
            orderId,
            type: "order_started",
            label: "Order started",
            occurredAt: toDateTimeString(now),
          }),
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
    orderTimelineEvents: database.orderTimelineEvents.some((event) => event.id === `timeline-${scopeId}-ready`)
      ? database.orderTimelineEvents
      : [
          ...database.orderTimelineEvents,
          createTimelineEvent({
            id: `timeline-${scopeId}-ready`,
            orderId,
            type: "scope_ready",
            label: getScopeTimelineLabel(nextScopes.find((scope) => scope.id === scopeId)?.workflow ?? "alteration", "ready"),
            occurredAt: toDateTimeString(now),
          }),
        ],
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
  const nextStatus = deriveOrderStatus(nextScopes.filter((scope) => scope.orderId === orderId));
  const pickupEvents = readyScopeIds.map((scopeId) => {
    const scope = nextScopes.find((candidate) => candidate.id === scopeId);
    return createTimelineEvent({
      id: `timeline-${scopeId}-picked-up`,
      orderId,
      type: "scope_picked_up",
      label: getScopeTimelineLabel(scope?.workflow ?? "alteration", "picked up"),
      occurredAt: toDateTimeString(now),
    });
  });
  const completionEvents = nextStatus === "complete" && !database.orderTimelineEvents.some((event) => event.orderId === orderId && event.type === "order_complete")
    ? [
        createTimelineEvent({
          id: `timeline-${orderId}-complete`,
          orderId,
          type: "order_complete",
          label: "Order complete",
          occurredAt: toDateTimeString(now),
        }),
      ]
    : [];

  return {
    ...database,
    orderScopes: nextScopes,
    orders: database.orders.map((order) => (
      order.id === orderId
        ? {
            ...order,
            status: nextStatus,
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
    orderTimelineEvents: [
      ...database.orderTimelineEvents,
      ...pickupEvents,
      ...completionEvents,
    ],
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
    orderTimelineEvents: [
      ...database.orderTimelineEvents,
      createTimelineEvent({
        id: `timeline-${orderId}-canceled`,
        orderId,
        type: "order_canceled",
        label: "Order canceled",
        occurredAt: toDateTimeString(now),
      }),
    ],
    generatedAt: toDateTimeString(now),
  };
}
