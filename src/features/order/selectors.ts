import type {
  Customer,
  OrderBagLineItem,
  OrderType,
  OrderWorkflowState,
  PricingSummary,
} from "../../types";
import { jacketBasedCustomGarments } from "../../data";

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

export function getHasAlterationContent(order: OrderWorkflowState) {
  return order.alteration.items.length > 0;
}

export function getHasCustomContent(order: OrderWorkflowState) {
  return Boolean(order.custom.selectedGarment);
}

export function getOrderType(order: OrderWorkflowState): OrderType | null {
  const hasAlterations = getHasAlterationContent(order);
  const hasCustom = getHasCustomContent(order);

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
  return Boolean(order.custom.selectedGarment);
}

export function getPricingSummary(order: OrderWorkflowState): PricingSummary {
  const alterationsSubtotal = order.alteration.items.reduce((sum, item) => sum + item.subtotal, 0);
  const customSubtotal = getCustomGarmentPrice(order.custom.selectedGarment);
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

export function getOrderBagLineItems(order: OrderWorkflowState): OrderBagLineItem[] {
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

  if (order.custom.selectedGarment) {
    const selectedGarment = order.custom.selectedGarment;
    const showJacketStyleOptions = jacketBasedCustomGarments.has(selectedGarment);
    const summaryDetails = [
      showJacketStyleOptions ? (order.custom.lapel ? `Lap: ${order.custom.lapel}` : "Lap: req") : null,
      showJacketStyleOptions ? (order.custom.pocketType ? `Pkt: ${order.custom.pocketType}` : "Pkt: req") : null,
      showJacketStyleOptions ? (order.custom.canvas ? `Canv: ${order.custom.canvas}` : "Canv: req") : null,
    ].filter(Boolean);

    items.push({
      id: "custom-item",
      kind: "custom",
      title: `Custom Garment - ${selectedGarment}`,
      subtitle: summaryDetails.join(" • "),
      amount: getPricingSummary(order).customSubtotal,
    });
  }

  return items;
}
export function getSummaryGuardrail(order: OrderWorkflowState, selectedCustomer: Customer | null) {
  const selectedGarment = order.custom.selectedGarment;
  const needsJacketStyleOptions = selectedGarment ? jacketBasedCustomGarments.has(selectedGarment) : false;
  const customMissing =
    Boolean(selectedGarment) &&
    (!order.custom.linkedMeasurementSetId ||
      !order.custom.gender ||
      !order.custom.fabric ||
      !order.custom.buttons ||
      !order.custom.lining ||
      !order.custom.threads ||
      (needsJacketStyleOptions && (!order.custom.pocketType || !order.custom.lapel || !order.custom.canvas)));

  return {
    missingCustomer: !selectedCustomer,
    missingPickup:
      getPickupRequired(order) &&
      (!order.fulfillment.pickupDate || !order.fulfillment.pickupTime || !order.fulfillment.pickupLocation),
    customIncomplete: customMissing,
  };
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
