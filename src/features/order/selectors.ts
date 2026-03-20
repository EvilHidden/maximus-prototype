import type {
  Customer,
  MeasurementSet,
  MeasurementSetOption,
  OrderBagLineItem,
  OrderType,
  OrderWorkflowState,
  PricingSummary,
} from "../../types";

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
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
  const customSubtotal = !order.custom.selectedGarment
    ? 0
    : order.custom.selectedGarment === "Bundle" || order.custom.bundleType === "Bundle"
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
    items.push({
      id: "custom-item",
      kind: "custom",
      title: `Custom Garment - ${order.custom.selectedGarment}`,
      subtitle: [
        linkedSet ? `${linkedSet.label} • ${linkedSet.note}` : "Measurements required",
        order.custom.construction || "Construction required",
        order.custom.pricingBand || "Pricing required",
        order.custom.bundleType || "Bundle required",
      ].join(" • "),
      amount: getPricingSummary(order).customSubtotal,
    });
  }

  return items;
}

export function getMeasurementOptions(
  measurementSets: MeasurementSet[],
  customer: Customer | null,
  linkedMeasurementSetId: string | null,
  hasDraftMeasurements = false,
): MeasurementSetOption[] {
  if (!customer) {
    return [];
  }

  const customerSets: MeasurementSetOption[] = measurementSets
    .filter((set) => set.customerId === customer.id)
    .map((set) => ({ ...set, kind: "history" as const }));

  if (hasDraftMeasurements) {
    customerSets.unshift({
      id: linkedMeasurementSetId === "draft-entry" ? "draft-entry" : "draft-measurements",
      customerId: customer.id,
      label: "Draft entry",
      note: "Current unsaved measurements",
      kind: "draft",
    });
  }

  return customerSets;
}

export function getSuggestedMeasurementSet(
  measurementSets: MeasurementSet[],
  customer: Customer | null,
): MeasurementSet | null {
  if (!customer) {
    return null;
  }

  return measurementSets.find((set) => set.customerId === customer.id && set.suggested) ?? null;
}

export function getMeasurementSetLabel(
  measurementSets: MeasurementSet[],
  measurementSetId: string | null,
) {
  if (!measurementSetId) {
    return null;
  }

  if (measurementSetId === "draft-entry" || measurementSetId === "draft-measurements") {
    return "Draft entry • Current measurement form";
  }

  const match = measurementSets.find((set) => set.id === measurementSetId);
  return match ? `${match.label} • ${match.note}` : null;
}

export function getSummaryGuardrail(order: OrderWorkflowState, selectedCustomer: Customer | null) {
  const customMissing =
    Boolean(order.custom.selectedGarment) &&
    (!order.custom.linkedMeasurementSetId || !order.custom.construction || !order.custom.bundleType || !order.custom.pricingBand);

  return {
    missingCustomer: !selectedCustomer,
    missingPickup: getPickupRequired(order) && (!order.fulfillment.pickupDate || !order.fulfillment.pickupTime),
    customIncomplete: customMissing,
  };
}

export function formatSummaryCurrency(value: number) {
  return formatCurrency(value);
}
