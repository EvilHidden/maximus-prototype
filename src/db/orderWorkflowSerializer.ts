import type {
  Customer,
  CustomGarmentDraft,
  OpenOrderPaymentStatus,
  OrderWorkflowState,
  OrderLineComponentKind,
  OrderType,
  PickupLocation,
  WorkflowMode,
} from "../types";
import { getCheckoutCollectionAmount } from "../features/order/paymentSummary";
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
import {
  createSeedMeasurementValueMap,
  getPickupLocationNameById,
  getSeedReferenceData,
} from "./referenceData";

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
  existingOrder?: DbOrder | null;
};

const seedReferenceData = getSeedReferenceData();

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
  existingOrder = null,
}: SerializeOrderWorkflowArgs): SerializedOrderWorkflow | null {
  const orderType = getOrderType(order);
  if (!orderType) {
    return null;
  }

  const orderId = existingOrder?.id ?? `order-${orderSequence}`;
  const displayId = existingOrder?.displayId ?? `ORD-${orderSequence}`;
  const payer = customers.find((customer) => customer.id === order.payerCustomerId) ?? null;
  const orderRecord: DbOrder = {
    id: orderId,
    displayId,
    payerCustomerId: order.payerCustomerId,
    payerName: payer?.name ?? "Walk-in customer",
    orderType,
    createdAt: existingOrder?.createdAt ?? toDateTimeString(now),
    status: "open",
    operationalStatus: existingOrder?.operationalStatus ?? "accepted",
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

  const checkoutCollectionAmount = getCheckoutCollectionAmount(order);

  return {
    openOrderId: Number.parseInt(displayId.replace(/\D/g, ""), 10) || orderSequence,
    orderRecord,
    customerEvents,
    scopes,
    scopeLines,
    lineComponents,
    pickupAppointments,
    paymentRecords: createInitialPaymentRecords(orderId, paymentStatus, checkoutCollectionAmount, now),
  };
}

function createEmptyMeasurements() {
  return createSeedMeasurementValueMap();
}

function createEmptyCustomDraft(): CustomGarmentDraft {
  return {
    gender: null,
    wearerCustomerId: null,
    selectedGarment: null,
    linkedMeasurementSetId: null,
    measurements: createEmptyMeasurements(),
    fabric: null,
    buttons: null,
    lining: null,
    threads: null,
    monogramLeft: "",
    monogramCenter: "",
    monogramRight: "",
    pocketType: null,
    lapel: null,
    canvas: null,
  };
}

function getAlterationServicePrice(
  database: {
    alterationServiceDefinitions: Array<{ category: string; name: string; price: number }>;
  },
  garmentLabel: string,
  serviceName: string,
) {
  return database.alterationServiceDefinitions.find((service) => (
    service.category === garmentLabel && service.name === serviceName
  ))?.price ?? 0;
}

function getCustomGenderForGarment(
  database: {
    customGarmentDefinitions: Array<{ label: string; gender: "male" | "female" }>;
  },
  garmentLabel: string,
) {
  return database.customGarmentDefinitions.find((garment) => garment.label === garmentLabel)?.gender ?? null;
}

function getComponentValue(
  components: DbOrderScopeLineComponent[],
  kind: OrderLineComponentKind,
  fallback: string,
) {
  return components.find((component) => component.kind === kind)?.value ?? fallback;
}

export function deserializeOrderWorkflowFromRecords(
  database: {
    alterationServiceDefinitions: Array<{ category: string; name: string; price: number }>;
    customGarmentDefinitions: Array<{ label: string; gender: "male" | "female" }>;
    customerEvents: DbCustomerEvent[];
    orders: DbOrder[];
    orderScopes: DbOrderScope[];
    orderScopeLines: DbOrderScopeLine[];
    orderScopeLineComponents: DbOrderScopeLineComponent[];
    pickupAppointments: DbPickupAppointment[];
  },
  openOrderId: number,
): OrderWorkflowState | null {
  const order = database.orders.find((candidate) => Number.parseInt(candidate.displayId.replace(/\D/g, ""), 10) === openOrderId);
  if (!order) {
    return null;
  }

  const scopes = database.orderScopes.filter((scope) => scope.orderId === order.id);
  const alterationScope = scopes.find((scope) => scope.workflow === "alteration");
  const customScope = scopes.find((scope) => scope.workflow === "custom");

  const alterationItems = alterationScope
    ? database.orderScopeLines
      .filter((line) => line.scopeId === alterationScope.id)
      .map((line) => {
        const components = database.orderScopeLineComponents
          .filter((component) => component.lineId === line.id)
          .sort((left, right) => left.sortOrder - right.sortOrder);
        const modifiers = components
          .filter((component) => component.kind === "alteration_service")
          .map((component) => ({
            name: component.value,
            price: getAlterationServicePrice(database, line.garmentLabel, component.value),
          }));

        return {
          id: Number.parseInt(line.id.replace(/\D/g, ""), 10) || Date.now(),
          garment: line.garmentLabel,
          modifiers,
          subtotal: line.unitPrice * line.quantity,
        };
      })
    : [];

  const customItems = customScope
    ? database.orderScopeLines
      .filter((line) => line.scopeId === customScope.id)
      .map((line) => {
        const components = database.orderScopeLineComponents
          .filter((component) => component.lineId === line.id)
          .sort((left, right) => left.sortOrder - right.sortOrder);

        return {
          id: Number.parseInt(line.id.replace(/\D/g, ""), 10) || Date.now(),
          gender: getCustomGenderForGarment(database, line.garmentLabel),
          wearerCustomerId: line.wearerCustomerId,
          selectedGarment: line.garmentLabel,
          linkedMeasurementSetId: line.measurementSetId,
          measurements: {
            ...createEmptyMeasurements(),
            ...(line.measurementSnapshot ?? {}),
          },
          fabric: getComponentValue(components, "fabric", "") || null,
          buttons: getComponentValue(components, "buttons", "") || null,
          lining: getComponentValue(components, "lining", "") || null,
          threads: getComponentValue(components, "threads", "") || null,
          monogramLeft: getComponentValue(components, "monogram", ""),
          monogramCenter: components.filter((component) => component.kind === "monogram")[1]?.value ?? "",
          monogramRight: components.filter((component) => component.kind === "monogram")[2]?.value ?? "",
          pocketType: getComponentValue(components, "pocket_type", "") || null,
          lapel: getComponentValue(components, "lapel", "") || null,
          canvas: getComponentValue(components, "canvas", "") || null,
          wearerName: line.wearerName,
          linkedMeasurementLabel: line.measurementSetLabel,
          measurementSnapshot: {
            ...createEmptyMeasurements(),
            ...(line.measurementSnapshot ?? {}),
          },
        };
      })
    : [];

  const getFulfillmentForScope = (scope: DbOrderScope | undefined, workflow: WorkflowMode) => {
    const pickupAppointment = scope
      ? database.pickupAppointments.find((appointment) => appointment.orderId === order.id && appointment.scopeId === scope.id)
      : null;
    const event = scope?.eventId ? database.customerEvents.find((candidate) => candidate.id === scope.eventId) : null;
    const pickupDate = pickupAppointment?.scheduledFor.slice(0, 10) ?? "";
    const pickupTime = pickupAppointment
      ? pickupAppointment.scheduledFor.slice(11, 16)
      : "";
    const pickupLocation = pickupAppointment
      ? getPickupLocationNameById(
          seedReferenceData.pickupLocations.map((location) => ({ id: createLocationId(location), name: location })),
          pickupAppointment.locationId,
        )
      : "";

    return {
      pickupDate,
      pickupTime,
      pickupLocation: pickupLocation as PickupLocation | "",
      eventType: workflow === "custom" ? event?.type ?? "none" : "none",
      eventDate: workflow === "custom" ? event?.eventDate ?? "" : "",
    };
  };

  const customDraft = createEmptyCustomDraft();

  return {
    activeWorkflow: customItems.length > 0 ? "custom" : alterationItems.length > 0 ? "alteration" : null,
    payerCustomerId: order.payerCustomerId,
    alteration: {
      selectedGarment: "",
      selectedModifiers: [],
      items: alterationItems,
    },
    custom: {
      draft: customDraft,
      items: customItems,
    },
    fulfillment: {
      alteration: getFulfillmentForScope(alterationScope, "alteration"),
      custom: getFulfillmentForScope(customScope, "custom"),
    },
  };
}
