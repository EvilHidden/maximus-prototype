import type {
  Customer,
  OpenOrderPaymentStatus,
  OrderLineComponentKind,
  OrderType,
  OrderWorkflowState,
  WorkflowMode,
} from "../types";
import type {
  DbCustomerEvent,
  DbOrder,
  DbOrderScope,
  DbOrderScopeLine,
  DbOrderScopeLineComponent,
  DbPaymentRecord,
  DbPickupAppointment,
} from "./schema";
import { createLocationId, toDateTimeString } from "./runtime/support";

type SerializedOrderWorkflow = {
  openOrderId: number;
  orderRecord: DbOrder;
  customerEvents: DbCustomerEvent[];
  scopes: DbOrderScope[];
  scopeLines: DbOrderScopeLine[];
  lineComponents: DbOrderScopeLineComponent[];
  pickupAppointments: DbPickupAppointment[];
  paymentRecords: DbPaymentRecord[];
};

type SerializeOrderWorkflowArgs = {
  order: OrderWorkflowState;
  customers: Customer[];
  paymentStatus: OpenOrderPaymentStatus;
  orderSequence: number;
  now: Date;
};

function createDateTimeString(date: string, time: string | null, fallbackHour = 12, fallbackMinute = 0) {
  const [hourText = `${fallbackHour}`, minuteText = `${fallbackMinute}`] = (time ?? "").split(":");
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);
  const safeHour = Number.isNaN(hour) ? fallbackHour : hour;
  const safeMinute = Number.isNaN(minute) ? fallbackMinute : minute;
  return `${date}T${`${safeHour}`.padStart(2, "0")}:${`${safeMinute}`.padStart(2, "0")}:00`;
}

function getCustomGarmentPrice(garment: string | null) {
  if (!garment) {
    return 0;
  }

  if (garment === "Three-piece suit" || garment === "Three-piece tuxedo") {
    return 2495;
  }

  return 1495;
}

function getOrderType(order: OrderWorkflowState): OrderType | null {
  const hasAlterations = order.alteration.items.length > 0;
  const hasCustom = order.custom.items.length > 0;

  if (hasAlterations && hasCustom) {
    return "mixed";
  }

  if (hasAlterations) {
    return "alteration";
  }

  if (hasCustom) {
    return "custom";
  }

  return null;
}

function getRequiredPickupScopes(order: OrderWorkflowState): WorkflowMode[] {
  const orderType = getOrderType(order);

  if (orderType === "mixed") {
    return ["alteration", "custom"];
  }

  if (orderType === "alteration") {
    return ["alteration"];
  }

  if (orderType === "custom") {
    return ["custom"];
  }

  return [];
}

function getCheckoutCollectionAmount(order: OrderWorkflowState) {
  const alterationsSubtotal = order.alteration.items.reduce((sum, item) => sum + item.subtotal, 0);
  const customSubtotal = order.custom.items.reduce((sum, item) => sum + getCustomGarmentPrice(item.selectedGarment), 0);
  const subtotal = alterationsSubtotal + customSubtotal;
  const taxAmount = subtotal * 0.08875;
  const depositDue = customSubtotal > 0 ? Math.round(customSubtotal * 0.5 * 100) / 100 : 0;
  const orderType = getOrderType(order);

  if (orderType === "custom") {
    return depositDue;
  }

  if (orderType === "mixed") {
    return alterationsSubtotal + taxAmount + depositDue;
  }

  return subtotal + taxAmount;
}

function getWearerName(customerId: string | null, customers: Customer[], fallback?: string | null) {
  if (fallback) {
    return fallback;
  }

  if (!customerId) {
    return "Wearer req";
  }

  return customers.find((customer) => customer.id === customerId)?.name ?? "Wearer req";
}

function createLineComponent(
  lineId: string,
  kind: OrderLineComponentKind,
  label: string,
  value: string,
  sortOrder: number,
) {
  return {
    id: `${lineId}-${kind}-${sortOrder}`,
    lineId,
    kind,
    label,
    value,
    sortOrder,
  } satisfies DbOrderScopeLineComponent;
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

export function serializeOrderWorkflowToRecords({
  order,
  customers,
  paymentStatus,
  orderSequence,
  now,
}: SerializeOrderWorkflowArgs): SerializedOrderWorkflow | null {
  const orderType = getOrderType(order);
  if (!orderType) {
    return null;
  }

  const orderId = `order-${orderSequence}`;
  const displayId = `ORD-${orderSequence}`;
  const payer = customers.find((customer) => customer.id === order.payerCustomerId) ?? null;
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

  getRequiredPickupScopes(order).forEach((scope, scopeIndex) => {
    const schedule = order.fulfillment[scope];
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

    const matchingAlterationItems = scope === "alteration" ? order.alteration.items : [];
    const matchingCustomItems = scope === "custom" ? order.custom.items : [];

    matchingAlterationItems.forEach((item, itemIndex) => {
      const lineId = `${scopeId}-line-${itemIndex + 1}`;
      scopeLines.push({
        id: lineId,
        scopeId,
        label: `${item.garment} ${item.modifiers.map((modifier) => modifier.name).join(" + ")}`.trim(),
        garmentLabel: item.garment,
        quantity: 1,
        unitPrice: item.subtotal,
        wearerCustomerId: null,
        wearerName: null,
        measurementSetId: null,
        measurementSetLabel: null,
        measurementSnapshot: null,
      });

      item.modifiers.forEach((modifier, modifierIndex) => {
        lineComponents.push(
          createLineComponent(lineId, "alteration_service", "Service", modifier.name, modifierIndex + 1),
        );
      });
    });

    matchingCustomItems.forEach((item, itemIndex) => {
      const lineId = `${scopeId}-line-${itemIndex + 1}`;
      const garmentLabel = item.selectedGarment ?? "Custom garment";
      scopeLines.push({
        id: lineId,
        scopeId,
        label: garmentLabel,
        garmentLabel,
        quantity: 1,
        unitPrice: getCustomGarmentPrice(item.selectedGarment),
        wearerCustomerId: item.wearerCustomerId,
        wearerName: getWearerName(item.wearerCustomerId, customers, item.wearerName),
        measurementSetId: item.linkedMeasurementSetId,
        measurementSetLabel: item.linkedMeasurementLabel,
        measurementSnapshot: { ...item.measurementSnapshot },
      });

      const components = [
        createLineComponent(lineId, "wearer", "Wearer", getWearerName(item.wearerCustomerId, customers, item.wearerName), 1),
        item.linkedMeasurementLabel
          ? createLineComponent(lineId, "measurement_set", "Measurements", item.linkedMeasurementLabel, 2)
          : null,
        item.fabric ? createLineComponent(lineId, "fabric", "Fabric", item.fabric, 3) : null,
        item.buttons ? createLineComponent(lineId, "buttons", "Buttons", item.buttons, 4) : null,
        item.lining ? createLineComponent(lineId, "lining", "Lining", item.lining, 5) : null,
        item.threads ? createLineComponent(lineId, "threads", "Threads", item.threads, 6) : null,
        item.canvas ? createLineComponent(lineId, "canvas", "Canvas", item.canvas, 7) : null,
        item.lapel ? createLineComponent(lineId, "lapel", "Lapel", item.lapel, 8) : null,
        item.pocketType ? createLineComponent(lineId, "pocket_type", "Pockets", item.pocketType, 9) : null,
        item.monogramLeft ? createLineComponent(lineId, "monogram", "Monogram left", item.monogramLeft, 10) : null,
        item.monogramCenter ? createLineComponent(lineId, "monogram", "Monogram center", item.monogramCenter, 11) : null,
        item.monogramRight ? createLineComponent(lineId, "monogram", "Monogram right", item.monogramRight, 12) : null,
      ].filter(Boolean) as DbOrderScopeLineComponent[];

      lineComponents.push(...components);
    });

    const pickupSummary = scope === "alteration"
      ? matchingAlterationItems.map((item) => `${item.garment} ${item.modifiers.map((modifier) => modifier.name).join(" + ")}`.trim())
      : matchingCustomItems.map((item) => item.selectedGarment ?? "Custom garment");

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
        locationId: createLocationId(schedule.pickupLocation),
        source: "prototype",
        durationMinutes: 15,
        typeKey: "pickup",
        statusKey: "scheduled",
        summary: pickupSummary.join(", "),
        confirmationStatus: null,
        rush: false,
      });
    }
  });

  const totalCollected = paymentStatus === "captured" ? getCheckoutCollectionAmount(order) : 0;

  return {
    openOrderId: orderSequence,
    orderRecord,
    customerEvents,
    scopes,
    scopeLines,
    lineComponents,
    pickupAppointments,
    paymentRecords: createInitialPaymentRecords(orderId, paymentStatus, totalCollected, now),
  };
}
