import type {
  Customer,
  MeasurementSet,
  OrderBagLineItem,
  OrderType,
  OrderWorkflowState,
  PricingSummary,
} from "../../types";
import { getMeasurementSetDisplay } from "../measurements/selectors";

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

const jacketOrderTypes = new Set(["Suit", "Three piece suit", "Sports coat", "Overcoat", "Tuxedo", "3 piece tux"]);
const cuffOrderTypes = new Set(["Suit", "Three piece suit", "Tuxedo", "3 piece tux"]);

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
  const customSubtotal = !order.custom.selectedGarment
    ? 0
    : order.custom.selectedGarment === "Three piece suit" || order.custom.selectedGarment === "3 piece tux"
      ? 2495
      : 1495;
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

export function getOrderBagLineItems(order: OrderWorkflowState, measurementSets: MeasurementSet[]): OrderBagLineItem[] {
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
    const linkedSet = measurementSets.find((set) => set.id === order.custom.linkedMeasurementSetId);
    const selectedGarment = order.custom.selectedGarment;
    const linkedSetDisplay = linkedSet ? getMeasurementSetDisplay(linkedSet) : null;
    const summaryDetails = [
      linkedSetDisplay
        ? `${linkedSetDisplay.title}${linkedSetDisplay.version ? ` • ${linkedSetDisplay.version}` : ""}`
        : "Measurements required",
      order.custom.fabric ? `Fabric: ${order.custom.fabric}` : "Fabric required",
      order.custom.buttonType ? `Buttons: ${order.custom.buttonType}` : "Button type required",
      order.custom.lining ? `Lining: ${order.custom.lining}` : "Lining required",
      order.custom.threads ? `Threads: ${order.custom.threads}` : null,
      jacketOrderTypes.has(selectedGarment)
        ? order.custom.pocketType
          ? `Pockets: ${order.custom.pocketType}`
          : "Pocket type required"
        : null,
      jacketOrderTypes.has(selectedGarment)
        ? order.custom.lapels
          ? `Lapels: ${order.custom.lapels}`
          : "Lapel required"
        : null,
      cuffOrderTypes.has(selectedGarment)
        ? order.custom.cuffs
          ? `Cuffs: ${order.custom.cuffs}`
          : "Cuff required"
        : null,
      order.custom.monograms ? `Monogram: ${order.custom.monograms}` : null,
      order.custom.customNotes ? `Notes: ${order.custom.customNotes}` : null,
      order.custom.pricingBand ? `Pricing: ${order.custom.pricingBand}` : "Pricing required",
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
  const customMissing =
    Boolean(selectedGarment) &&
    (!order.custom.linkedMeasurementSetId ||
      !order.custom.fabric ||
      !order.custom.buttonType ||
      !order.custom.lining ||
      !order.custom.pricingBand ||
      (jacketOrderTypes.has(selectedGarment) && (!order.custom.pocketType || !order.custom.lapels)) ||
      (cuffOrderTypes.has(selectedGarment) && !order.custom.cuffs));

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
