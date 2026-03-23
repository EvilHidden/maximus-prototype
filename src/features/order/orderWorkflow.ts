import type {
  ClosedOrderHistoryItem,
  CustomGarmentDraft,
  CustomOrderEventType,
  Customer,
  CustomerOrder,
  OpenOrder,
  OpenOrderPaymentStatus,
  OrderLineComponent,
  OrderBagLineItem,
  OrderType,
  OrderWorkflowState,
  WorkflowMode,
} from "../../types";
import { getSeedReferenceData, isJacketBasedCustomGarment } from "../../db/referenceData";
import { formatDateLabel } from "./orderDateUtils";
import { getCustomGarmentPrice, getPricingSummary } from "./orderPricing";
import { getDraftPaymentSummary } from "./paymentSummary";

const seedReferenceData = getSeedReferenceData();

export type OrderTimeOptions = {
  now?: Date;
};

export type BuildOpenOrderOptions = OrderTimeOptions & {
  idFactory?: () => number;
};

function getCustomDraftStarted(draft: CustomGarmentDraft) {
  return Boolean(draft.selectedGarment);
}

function getCustomDraftReady(order: OrderWorkflowState) {
  const draft = order.custom.draft;
  if (!draft.selectedGarment || !draft.linkedMeasurementSetId || !draft.wearerCustomerId || !draft.gender || !draft.fabric || !draft.buttons || !draft.lining || !draft.threads) {
    return false;
  }

  if (isJacketBasedCustomGarment(draft.selectedGarment, seedReferenceData.jacketBasedCustomGarments)) {
    return Boolean(draft.pocketType && draft.lapel && draft.canvas);
  }

  return true;
}

function getStyleSummary(garment: string | null, lapel: string | null, pocketType: string | null, canvas: string | null) {
  if (!isJacketBasedCustomGarment(garment, seedReferenceData.jacketBasedCustomGarments)) {
    return [];
  }

  return [
    lapel ? `Lapel ${lapel}` : "Lapel req",
    pocketType ? `Pocket ${pocketType}` : "Pocket req",
    canvas ? `Canvas ${canvas}` : "Canvas req",
  ];
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

function createLineTitle(kind: WorkflowMode, garmentLabel: string) {
  return kind === "alteration" ? `Alteration - ${garmentLabel}` : `Custom garment - ${garmentLabel}`;
}

function createAlterationComponents(itemId: number, modifiers: OrderWorkflowState["alteration"]["items"][number]["modifiers"]): OrderLineComponent[] {
  return modifiers.map((modifier, index) => ({
    id: `alteration-${itemId}-service-${index + 1}`,
    kind: "alteration_service",
    label: "Service",
    value: modifier.name,
    sortOrder: index + 1,
  }));
}

function createCustomComponents(item: OrderWorkflowState["custom"]["items"][number], customers: Customer[]): OrderLineComponent[] {
  const components: OrderLineComponent[] = [];
  const wearerName = getWearerName(item.wearerCustomerId, customers, item.wearerName);

  components.push({
    id: `custom-${item.id}-wearer`,
    kind: "wearer",
    label: "Wearer",
    value: wearerName,
    sortOrder: 1,
  });

  if (item.linkedMeasurementLabel) {
    components.push({
      id: `custom-${item.id}-measurements`,
      kind: "measurement_set",
      label: "Measurements",
      value: item.linkedMeasurementLabel,
      sortOrder: 2,
    });
  }

  if (item.fabric) {
    components.push({
      id: `custom-${item.id}-fabric`,
      kind: "fabric",
      label: "Fabric",
      value: item.fabric,
      sortOrder: 3,
    });
  }

  if (item.buttons) {
    components.push({
      id: `custom-${item.id}-buttons`,
      kind: "buttons",
      label: "Buttons",
      value: item.buttons,
      sortOrder: 4,
    });
  }

  if (item.lining) {
    components.push({
      id: `custom-${item.id}-lining`,
      kind: "lining",
      label: "Lining",
      value: item.lining,
      sortOrder: 5,
    });
  }

  if (item.threads) {
    components.push({
      id: `custom-${item.id}-threads`,
      kind: "threads",
      label: "Threads",
      value: item.threads,
      sortOrder: 6,
    });
  }

  if (item.canvas) {
    components.push({
      id: `custom-${item.id}-canvas`,
      kind: "canvas",
      label: "Canvas",
      value: item.canvas,
      sortOrder: 7,
    });
  }

  if (item.lapel) {
    components.push({
      id: `custom-${item.id}-lapel`,
      kind: "lapel",
      label: "Lapel",
      value: item.lapel,
      sortOrder: 8,
    });
  }

  if (item.pocketType) {
    components.push({
      id: `custom-${item.id}-pocket`,
      kind: "pocket_type",
      label: "Pockets",
      value: item.pocketType,
      sortOrder: 9,
    });
  }

  [
    item.monogramLeft ? { value: item.monogramLeft, label: "Monogram left" } : null,
    item.monogramCenter ? { value: item.monogramCenter, label: "Monogram center" } : null,
    item.monogramRight ? { value: item.monogramRight, label: "Monogram right" } : null,
  ].filter(Boolean).forEach((entry, index) => {
    components.push({
      id: `custom-${item.id}-monogram-${index + 1}`,
      kind: "monogram",
      label: entry!.label,
      value: entry!.value,
      sortOrder: 10 + index,
    });
  });

  return components;
}

export function getHasAlterationContent(order: OrderWorkflowState) {
  return order.alteration.items.length > 0;
}

export function getHasCustomContent(order: OrderWorkflowState) {
  return order.custom.items.length > 0 || getCustomDraftStarted(order.custom.draft);
}

export function getOrderType(order: OrderWorkflowState): OrderType | null {
  const hasAlterations = getHasAlterationContent(order);
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

export function getPickupRequired(order: OrderWorkflowState) {
  return getOrderType(order) !== null;
}

export function getCustomEventTypeLabel(eventType: CustomOrderEventType) {
  if (eventType === "wedding") {
    return "Wedding";
  }

  if (eventType === "prom") {
    return "Prom";
  }

  return "No event";
}

export function getOpenOrderTypeLabel(orderType: OrderType) {
  if (orderType === "custom") {
    return "Custom Garment";
  }

  if (orderType === "mixed") {
    return "Custom + Alterations";
  }

  return "Alterations";
}

export function getRequiredPickupScopes(order: OrderWorkflowState): WorkflowMode[] {
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

export function getPickupScheduleForScope(order: OrderWorkflowState, scope: WorkflowMode) {
  return order.fulfillment[scope];
}

export function getCustomConfigured(order: OrderWorkflowState) {
  return order.custom.items.length > 0;
}

export function getOrderBagLineItems(order: OrderWorkflowState, customers: Customer[]): OrderBagLineItem[] {
  const items: OrderBagLineItem[] = order.alteration.items.map((item, index) => ({
    id: `alteration-${item.id}`,
    kind: "alteration",
    title: `${index + 1}. ${createLineTitle("alteration", item.garment)}`,
    subtitle: item.modifiers.map((modifier) => modifier.name).join(", "),
    amount: item.subtotal,
    sourceLabel: `${item.garment} ${item.modifiers.map((modifier) => modifier.name).join(" + ")}`.trim(),
    garmentLabel: item.garment,
    components: createAlterationComponents(item.id, item.modifiers),
    wearerCustomerId: null,
    wearerName: null,
    linkedMeasurementSetId: null,
    linkedMeasurementLabel: null,
    measurementSnapshot: null,
    removable: true,
    editable: true,
    itemId: item.id,
  }));

  order.custom.items.forEach((item, index) => {
    const selectedGarment = item.selectedGarment;
    if (!selectedGarment) {
      return;
    }

    const summaryDetails = [
      getWearerName(item.wearerCustomerId, customers, item.wearerName),
      item.linkedMeasurementLabel ?? "Set req",
    ];

    const styleSummary = getStyleSummary(selectedGarment, item.lapel, item.pocketType, item.canvas);
    const subtitle = styleSummary.length > 0
      ? `${summaryDetails.join(" • ")}\n${styleSummary.join(" • ")}`
      : summaryDetails.join(" • ");

    items.push({
      id: `custom-item-${item.id}`,
      kind: "custom",
      title: `${order.alteration.items.length + index + 1}. ${createLineTitle("custom", selectedGarment)}`,
      subtitle,
      amount: getCustomGarmentPrice(selectedGarment),
      sourceLabel: selectedGarment,
      garmentLabel: selectedGarment,
      wearerCustomerId: item.wearerCustomerId,
      wearerName: getWearerName(item.wearerCustomerId, customers, item.wearerName),
      linkedMeasurementSetId: item.linkedMeasurementSetId,
      linkedMeasurementLabel: item.linkedMeasurementLabel,
      measurementSnapshot: { ...item.measurementSnapshot },
      components: createCustomComponents(item, customers),
      removable: true,
      editable: true,
      itemId: item.id,
    });
  });

  return items;
}

export function getSummaryGuardrail(order: OrderWorkflowState, payerCustomer: Customer | null) {
  const customMissing = order.custom.items.length === 0 && getCustomDraftStarted(order.custom.draft) && !getCustomDraftReady(order);
  const requiredPickupScopes = getRequiredPickupScopes(order);

  return {
    missingCustomer: !payerCustomer,
    missingPickup: requiredPickupScopes.some((scope) => {
      const schedule = getPickupScheduleForScope(order, scope);
      if (scope === "custom") {
        return !schedule.pickupLocation || (schedule.eventType !== "none" && !schedule.eventDate);
      }

      return !schedule.pickupDate || !schedule.pickupTime || !schedule.pickupLocation;
    }),
    customIncomplete: customMissing,
  };
}

export function getCustomFulfillmentSummary(eventType: CustomOrderEventType, eventDate: string, pickupLocation: string) {
  const eventLabel = getCustomEventTypeLabel(eventType);
  const formattedEventDate = formatDateLabel(eventDate);

  if (eventType === "none") {
    return pickupLocation ? `No event deadline • ${pickupLocation}` : "No event deadline";
  }

  if (formattedEventDate && pickupLocation) {
    return `${eventLabel} by ${formattedEventDate} • ${pickupLocation}`;
  }

  if (formattedEventDate) {
    return `${eventLabel} by ${formattedEventDate}`;
  }

  if (pickupLocation) {
    return `${eventLabel} • ${pickupLocation}`;
  }

  return eventLabel;
}

export function getCanAddCustomDraftToOrder(order: OrderWorkflowState) {
  return getCustomDraftReady(order);
}

export function buildOpenOrder(
  order: OrderWorkflowState,
  customers: Customer[],
  paymentStatus: OpenOrderPaymentStatus,
  options: BuildOpenOrderOptions = {},
): OpenOrder | null {
  const orderType = getOrderType(order);
  if (!orderType) {
    return null;
  }

  const now = options.now ?? new Date();
  const orderId = options.idFactory?.() ?? now.getTime();
  const lineItems = getOrderBagLineItems(order, customers);
  const payer = customers.find((customer) => customer.id === order.payerCustomerId) ?? null;
  const paymentSummary = getDraftPaymentSummary(order, paymentStatus);
  const pickupSchedules = getRequiredPickupScopes(order).map((scope) => {
    const schedule = getPickupScheduleForScope(order, scope);
    const matchingItems = lineItems.filter((item) => item.kind === scope);

    return {
      id: `${orderId}-${scope}`,
      scope,
      label: scope === "alteration" ? "Alteration pickup" : "Custom pickup",
      itemSummary: matchingItems.map((item) => item.title.replace(/^\d+\.\s*/, "")),
      itemCount: matchingItems.length,
      pickupDate: schedule.pickupDate,
      pickupTime: schedule.pickupTime,
      pickupLocation: schedule.pickupLocation,
      eventType: schedule.eventType,
      eventDate: schedule.eventDate,
      readyForPickup: false,
    };
  });

  return {
    id: orderId,
    payerCustomerId: order.payerCustomerId,
    payerName: payer?.name ?? "Walk-in customer",
    orderType,
    operationalStatus: "accepted",
    itemCount: lineItems.length,
    lineItems,
    itemSummary: lineItems.map((item) => item.title.replace(/^\d+\.\s*/, "")),
    pickupSchedules,
    paymentStatus: paymentSummary.paymentStatus,
    paymentDueNow: paymentSummary.paymentDueNow,
    totalCollected: paymentSummary.totalCollected,
    collectedToday: paymentSummary.collectedToday,
    balanceDue: paymentSummary.balanceDue,
    total: paymentSummary.total,
    createdAt: now.toISOString(),
  };
}

export function getClosedOrderHistory(
  customers: Customer[],
  ordersByCustomer: Record<string, CustomerOrder[]>,
): ClosedOrderHistoryItem[] {
  const closedStatuses = new Set(["Delivered", "Picked up"]);

  return Object.entries(ordersByCustomer).flatMap(([customerId, orders]) => {
    const customerName = customers.find((customer) => customer.id === customerId)?.name ?? "Unknown customer";

    return orders
      .filter((order) => closedStatuses.has(order.status))
      .map((order) => ({
        id: order.id,
        customerName,
        label: order.label,
        createdAt: order.createdAt,
        status: order.status,
        total: order.total,
      }));
  });
}
