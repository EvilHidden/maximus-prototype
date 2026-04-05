import type { DbOrder, DbOrderScope, DbOrderTimelineEvent, DbPaymentRecord } from "./schema";

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

export function getPaymentTimelineLabel(payment: Pick<DbPaymentRecord, "allocation">) {
  switch (payment.allocation) {
    case "custom_deposit":
      return "Deposit taken";
    case "alteration_balance":
      return "Alteration balance payment taken";
    case "custom_balance":
      return "Custom balance payment taken";
    case "full_balance":
    default:
      return "Payment taken";
  }
}

export function getScopeTimelineLabel(workflow: DbOrderScope["workflow"], suffix: "ready" | "picked up") {
  return `${workflow === "alteration" ? "Alterations" : "Custom garments"} ${suffix}`;
}

function byOccurredAt(left: DbOrderTimelineEvent, right: DbOrderTimelineEvent) {
  return new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime();
}

export function buildOrderTimelineEvents(
  order: DbOrder,
  scopes: DbOrderScope[],
  payments: DbPaymentRecord[],
): DbOrderTimelineEvent[] {
  const events: DbOrderTimelineEvent[] = [
    createTimelineEvent({
      id: `timeline-${order.id}-created`,
      orderId: order.id,
      type: "order_created",
      label: "Order created",
      occurredAt: order.createdAt,
    }),
  ];

  if (order.acceptedAt) {
    events.push(createTimelineEvent({
      id: `timeline-${order.id}-accepted`,
      orderId: order.id,
      type: "order_accepted",
      label: "Order accepted",
      occurredAt: order.acceptedAt,
    }));
  }

  if (order.startedAt) {
    events.push(createTimelineEvent({
      id: `timeline-${order.id}-started`,
      orderId: order.id,
      type: "order_started",
      label: "Order started",
      occurredAt: order.startedAt,
    }));
  }

  scopes.forEach((scope) => {
    if (scope.readyAt) {
      events.push(createTimelineEvent({
        id: `timeline-${scope.id}-ready`,
        orderId: order.id,
        type: "scope_ready",
        label: getScopeTimelineLabel(scope.workflow, "ready"),
        occurredAt: scope.readyAt,
      }));
    }

    if (scope.pickedUpAt) {
      events.push(createTimelineEvent({
        id: `timeline-${scope.id}-picked-up`,
        orderId: order.id,
        type: "scope_picked_up",
        label: getScopeTimelineLabel(scope.workflow, "picked up"),
        occurredAt: scope.pickedUpAt,
      }));
    }
  });

  payments
    .filter((payment) => payment.status === "captured" && payment.collectedAt)
    .forEach((payment) => {
      events.push(createTimelineEvent({
        id: `timeline-${payment.id}`,
        orderId: order.id,
        type: "payment_captured",
        label: getPaymentTimelineLabel(payment),
        occurredAt: payment.collectedAt ?? order.createdAt,
        amount: payment.amount,
      }));
    });

  if (order.completedAt) {
    events.push(createTimelineEvent({
      id: `timeline-${order.id}-complete`,
      orderId: order.id,
      type: "order_complete",
      label: "Order complete",
      occurredAt: order.completedAt,
    }));
  }

  if (order.canceledAt) {
    events.push(createTimelineEvent({
      id: `timeline-${order.id}-canceled`,
      orderId: order.id,
      type: "order_canceled",
      label: "Order canceled",
      occurredAt: order.canceledAt,
    }));
  }

  return events.sort(byOccurredAt);
}

export function replaceOrderTimelineEvents(
  existingEvents: DbOrderTimelineEvent[],
  order: DbOrder,
  scopes: DbOrderScope[],
  payments: DbPaymentRecord[],
) {
  return [
    ...existingEvents.filter((event) => event.orderId !== order.id),
    ...buildOrderTimelineEvents(order, scopes, payments),
  ].sort(byOccurredAt);
}
