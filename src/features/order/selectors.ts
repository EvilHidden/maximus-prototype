import type {
  Customer,
  CustomGarmentDraft,
  MeasurementSet,
  OrderBagLineItem,
  OrderType,
  OrderWorkflowState,
  PricingSummary,
} from "../../types";
import { jacketBasedCustomGarments } from "../../data";
import { getMeasurementSetDisplay, getLinkedMeasurementSet } from "../measurements/selectors";

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
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

function getCustomDraftStarted(draft: CustomGarmentDraft) {
  return Boolean(draft.selectedGarment);
}

function getCustomDraftReady(order: OrderWorkflowState) {
  const draft = order.custom.draft;
  if (!draft.selectedGarment || !draft.linkedMeasurementSetId || !draft.wearerCustomerId || !draft.gender || !draft.fabric || !draft.buttons || !draft.lining || !draft.threads) {
    return false;
  }

  if (jacketBasedCustomGarments.has(draft.selectedGarment)) {
    return Boolean(draft.pocketType && draft.lapel && draft.canvas);
  }

  return true;
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
  return order.activeWorkflow === "alteration" || getHasAlterationContent(order);
}

export function getCustomConfigured(order: OrderWorkflowState) {
  return order.custom.items.length > 0;
}

export function getPricingSummary(order: OrderWorkflowState): PricingSummary {
  const alterationsSubtotal = order.alteration.items.reduce((sum, item) => sum + item.subtotal, 0);
  const customSubtotal = order.custom.items.reduce((sum, item) => sum + getCustomGarmentPrice(item.selectedGarment), 0);
  const subtotal = alterationsSubtotal + customSubtotal;
  const taxAmount = subtotal * 0.08875;
  const depositDue = customSubtotal > 0 ? Math.round(customSubtotal * 0.5 * 100) / 100 : 0;

  return {
    alterationsSubtotal,
    customSubtotal,
    taxAmount,
    depositDue,
    total: subtotal + taxAmount,
  };
}

export function getCheckoutCollectionAmount(order: OrderWorkflowState) {
  const pricing = getPricingSummary(order);
  const orderType = getOrderType(order);

  if (orderType === "custom") {
    return pricing.depositDue;
  }

  if (orderType === "mixed") {
    return pricing.alterationsSubtotal + pricing.taxAmount + pricing.depositDue;
  }

  return pricing.total;
}

function getStyleSummary(garment: string | null, lapel: string | null, pocketType: string | null, canvas: string | null) {
  if (!garment || !jacketBasedCustomGarments.has(garment)) {
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

export function getOrderBagLineItems(order: OrderWorkflowState, customers: Customer[]): OrderBagLineItem[] {
  const items: OrderBagLineItem[] = order.alteration.items.map((item, index) => ({
    id: `alteration-${item.id}`,
    kind: "alteration",
    title: `${index + 1}. Alteration - ${item.garment}`,
    subtitle: item.modifiers.map((modifier) => modifier.name).join(", "),
    amount: item.subtotal,
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
      title: `${order.alteration.items.length + index + 1}. Custom garment - ${selectedGarment}`,
      subtitle,
      amount: getCustomGarmentPrice(selectedGarment),
      removable: true,
      editable: true,
      itemId: item.id,
    });
  });

  return items;
}

export function getSummaryGuardrail(order: OrderWorkflowState, payerCustomer: Customer | null) {
  const customMissing = order.custom.items.length === 0 && getCustomDraftStarted(order.custom.draft) && !getCustomDraftReady(order);

  return {
    missingCustomer: !payerCustomer,
    missingPickup:
      getPickupRequired(order) &&
      (!order.fulfillment.pickupDate || !order.fulfillment.pickupTime || !order.fulfillment.pickupLocation),
    customIncomplete: customMissing,
  };
}

export function getCanAddCustomDraftToOrder(order: OrderWorkflowState) {
  return getCustomDraftReady(order);
}

export function formatSummaryCurrency(value: number) {
  return formatCurrency(value);
}

export function formatPickupSchedule(pickupDate: string, pickupTime: string) {
  if (!pickupDate || !pickupTime) {
    return null;
  }

  const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);
  if (Number.isNaN(pickupDateTime.getTime())) {
    return null;
  }

  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(pickupDateTime);

  const timeParts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(pickupDateTime);
  const time = timeParts
    .map((part) => (part.type === "dayPeriod" ? part.value.toLowerCase() : part.value))
    .join("")
    .replace(/\s/g, "");

  return `${date}. ${time}`;
}
