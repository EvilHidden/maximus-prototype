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
import type { CustomPricingTierDefinition, JacketCanvasSurcharges } from "../../db/customPricingCatalog";
import { getSeedReferenceData, isJacketBasedCustomGarment, type MaterialOption } from "../../db/referenceData";
import { formatDateLabel } from "./orderDateUtils";
import { getCustomGarmentPrice, getPricingSummary } from "./orderPricing";
import { getDraftPaymentSummary, getOpenOrderPickupBalanceDue } from "./paymentSummary";
import { formatAlterationServiceLabel } from "./alterationAdjustments";

const seedReferenceData = getSeedReferenceData();

export type OrderTimeOptions = {
  now?: Date;
};

export type BuildOpenOrderOptions = OrderTimeOptions & {
  idFactory?: () => number;
};

function getCustomDraftStarted(draft: CustomGarmentDraft) {
  return Boolean(draft.variationLabel ?? draft.selectedGarment);
}

function getCustomDraftReady(order: OrderWorkflowState) {
  const draft = order.custom.draft;
  if (
    !(draft.variationLabel ?? draft.selectedGarment) ||
    !draft.linkedMeasurementSetId ||
    !draft.wearerCustomerId ||
    !draft.gender ||
    !draft.fabricSku ||
    !draft.buttonsSku ||
    !draft.liningSku ||
    !draft.threadsSku
  ) {
    return false;
  }

  if (isJacketBasedCustomGarment(draft.variationLabel ?? draft.selectedGarment, seedReferenceData.catalogVariations)) {
    return Boolean(draft.pocketType && draft.lapel && draft.canvas);
  }

  return true;
}

function getStyleSummary(garment: string | null, lapel: string | null, pocketType: string | null, canvas: string | null) {
  if (!isJacketBasedCustomGarment(garment, seedReferenceData.catalogVariations)) {
    return [];
  }

  return [
    lapel ? lapel : "Lapel req",
    pocketType ? `${pocketType} pocket` : "Pocket req",
    canvas ? `${canvas} canvas` : "Canvas req",
  ];
}

function getCustomBuildSummary(item: OrderWorkflowState["custom"]["items"][number]) {
  return [
    item.fabricSku ? `Fab ${item.fabricSku}` : null,
    item.buttonsSku ? `Btn ${item.buttonsSku}` : null,
    item.liningSku ? `Lin ${item.liningSku}` : null,
    item.customLiningRequested ? "Custom lining" : null,
    item.threadsSku ? `Thr ${item.threadsSku}` : null,
  ].filter(Boolean) as string[];
}

function getCustomMonogramSummary(item: OrderWorkflowState["custom"]["items"][number]) {
  const monogramParts = [
    item.monogramLeft ? `L ${item.monogramLeft}` : null,
    item.monogramCenter ? `C ${item.monogramCenter}` : null,
    item.monogramRight ? `R ${item.monogramRight}` : null,
  ].filter(Boolean) as string[];

  if (!monogramParts.length) {
    return null;
  }

  return monogramParts.join(" • ");
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
    value: formatAlterationServiceLabel(modifier),
    sortOrder: index + 1,
    amount: modifier.price,
    referenceId: modifier.id,
    numericValue: modifier.deltaInches,
  }));
}

function createCustomComponents(item: OrderWorkflowState["custom"]["items"][number], customers: Customer[]): OrderLineComponent[] {
  const components: OrderLineComponent[] = [];
  const wearerName = getWearerName(item.wearerCustomerId, customers, item.wearerName);
  const variationLabel = item.variationLabel ?? item.selectedGarment;
  const matchedFabric = item.fabricSku
    ? seedReferenceData.customMaterialOptionsByKind.fabric.find((option) => option.sku === item.fabricSku) ?? null
    : null;

  if (variationLabel) {
    components.push({
      id: `custom-${item.id}-variation`,
      kind: "catalog_variation",
      label: "Variation",
      value: variationLabel,
      sortOrder: 0,
      referenceId: item.variationId ?? null,
    });
  }

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

  if (item.fabricSku) {
    components.push({
      id: `custom-${item.id}-fabric-sku`,
      kind: "fabric_sku",
      label: "Fabric SKU",
      value: item.fabricSku,
      sortOrder: 3,
    });
  }

  if (matchedFabric?.millLabel) {
    components.push({
      id: `custom-${item.id}-fabric-book`,
      kind: "fabric_book",
      label: "Book",
      value: matchedFabric.millLabel,
      sortOrder: 4,
    });
  }

  if (matchedFabric?.manufacturer) {
    components.push({
      id: `custom-${item.id}-fabric-mill`,
      kind: "fabric_mill",
      label: "Mill",
      value: matchedFabric.manufacturer,
      sortOrder: 5,
    });
  }

  if (item.buttonsSku) {
    components.push({
      id: `custom-${item.id}-buttons-sku`,
      kind: "buttons_sku",
      label: "Buttons SKU",
      value: item.buttonsSku,
      sortOrder: 5,
    });
  }

  if (item.liningSku) {
    components.push({
      id: `custom-${item.id}-lining-sku`,
      kind: "lining_sku",
      label: "Lining SKU",
      value: item.liningSku,
      sortOrder: 7,
    });
  }

  if (item.customLiningRequested) {
    components.push({
      id: `custom-${item.id}-lining-option`,
      kind: "catalog_modifier",
      label: "Modifier",
      value: "Custom printed lining",
      sortOrder: 9,
      referenceId: "custom_printed",
    });
  }

  if (item.threadsSku) {
    components.push({
      id: `custom-${item.id}-threads-sku`,
      kind: "threads_sku",
      label: "Threads SKU",
      value: item.threadsSku,
      sortOrder: 9,
    });
  }

  if (item.canvas) {
    components.push({
      id: `custom-${item.id}-canvas-modifier`,
      kind: "catalog_modifier",
      label: "Modifier",
      value: `${item.canvas} canvas`,
      sortOrder: 11,
      referenceId: item.canvas,
    });
    components.push({
      id: `custom-${item.id}-canvas`,
      kind: "canvas",
      label: "Canvas",
      value: item.canvas,
      sortOrder: 12,
    });
  }

  if (item.lapel) {
    components.push({
      id: `custom-${item.id}-lapel-option`,
      kind: "catalog_option",
      label: "Option",
      value: `Lapel: ${item.lapel}`,
      sortOrder: 13,
      referenceId: item.lapel,
    });
    components.push({
      id: `custom-${item.id}-lapel`,
      kind: "lapel",
      label: "Lapel",
      value: item.lapel,
      sortOrder: 14,
    });
  }

  if (item.pocketType) {
    components.push({
      id: `custom-${item.id}-pocket-option`,
      kind: "catalog_option",
      label: "Option",
      value: `Pockets: ${item.pocketType}`,
      sortOrder: 15,
      referenceId: item.pocketType,
    });
    components.push({
      id: `custom-${item.id}-pocket`,
      kind: "pocket_type",
      label: "Pockets",
      value: item.pocketType,
      sortOrder: 16,
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

  item.referencePhotoIds.forEach((photoId, index) => {
    components.push({
      id: `custom-${item.id}-reference-photo-${index + 1}`,
      kind: "reference_photo",
      label: "Reference photo",
      value: photoId,
      sortOrder: 13 + index,
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

  if (eventType === "anniversary") {
    return "Anniversary";
  }

  return "No occasion";
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

export function getAlterationPickup(order: OrderWorkflowState) {
  return order.fulfillment.alteration;
}

export function getCustomOccasion(order: OrderWorkflowState) {
  return order.fulfillment.custom;
}

export function getCustomConfigured(order: OrderWorkflowState) {
  return order.custom.items.length > 0;
}

export function getOrderBagLineItems(
  order: OrderWorkflowState,
  customers: Customer[],
  pricingConfig?: {
    customPricingTiers?: CustomPricingTierDefinition[];
    jacketCanvasSurcharges?: JacketCanvasSurcharges;
    customLiningSurchargeAmount?: number;
    fabricOptions?: MaterialOption[];
    catalogVariations?: Array<{ id: string; label: string; fallbackAmount: number }>;
    catalogVariationTierPrices?: Array<{ variationId: string; tierKey: string; amount: number; isActive?: boolean }>;
  },
): OrderBagLineItem[] {
  const items: OrderBagLineItem[] = order.alteration.items.map((item, index) => ({
    id: `alteration-${item.id}`,
    kind: "alteration",
    title: `${index + 1}. ${createLineTitle("alteration", item.garment)}`,
    subtitle: item.modifiers.map((modifier) => formatAlterationServiceLabel(modifier)).join(", "),
    amount: item.subtotal,
    isRush: item.isRush,
    sourceLabel: `${item.garment} ${item.modifiers.map((modifier) => formatAlterationServiceLabel(modifier)).join(" + ")}`.trim(),
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
    const selectedGarment = item.variationLabel ?? item.selectedGarment;
    if (!selectedGarment) {
      return;
    }

    const summaryDetails = [
      getWearerName(item.wearerCustomerId, customers, item.wearerName),
      item.linkedMeasurementLabel ?? "Set req",
    ];

    const styleSummary = getStyleSummary(selectedGarment, item.lapel, item.pocketType, item.canvas);
    const buildSummary = getCustomBuildSummary(item);
    const monogramSummary = getCustomMonogramSummary(item);
    const subtitle = [
      summaryDetails.join(" • "),
      styleSummary.length > 0 ? styleSummary.join(" • ") : null,
      buildSummary.length > 0 ? buildSummary.join(" • ") : null,
      monogramSummary,
    ].filter(Boolean).join("\n");

    items.push({
      id: `custom-item-${item.id}`,
      kind: "custom",
      title: `${order.alteration.items.length + index + 1}. ${createLineTitle("custom", selectedGarment)}`,
      subtitle,
      amount: getCustomGarmentPrice(item, {
        pricingTiers: pricingConfig?.customPricingTiers,
        fabricOptions: pricingConfig?.fabricOptions,
        catalogVariations: pricingConfig?.catalogVariations,
        catalogVariationTierPrices: pricingConfig?.catalogVariationTierPrices,
        jacketCanvasSurcharges: pricingConfig?.jacketCanvasSurcharges,
        customLiningSurchargeAmount: pricingConfig?.customLiningSurchargeAmount,
      }),
      isRush: item.isRush,
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
      if (scope === "custom") {
        const schedule = getCustomOccasion(order);
        return schedule.eventType !== "none" && !schedule.eventDate;
      }

      const schedule = getAlterationPickup(order);
      return !schedule.pickupDate || !schedule.pickupTime || !schedule.pickupLocation;
    }),
    customIncomplete: customMissing,
  };
}

export function getCustomFulfillmentSummary(eventType: CustomOrderEventType, eventDate: string) {
  const eventLabel = getCustomEventTypeLabel(eventType);
  const formattedEventDate = formatDateLabel(eventDate);

  if (eventType === "none") {
    return "No occasion set";
  }

  if (formattedEventDate) {
    return `${eventLabel} on ${formattedEventDate}`;
  }

  return `${eventLabel} date needed`;
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
    const alterationPickup = getAlterationPickup(order);
    const customOccasion = getCustomOccasion(order);
    const matchingItems = lineItems.filter((item) => item.kind === scope);

    return {
      id: `${orderId}-${scope}`,
      scope,
      label: scope === "alteration" ? "Alteration pickup" : "Occasion",
      itemSummary: matchingItems.map((item) => item.title.replace(/^\d+\.\s*/, "")),
      itemCount: matchingItems.length,
      pickupDate: scope === "alteration" ? alterationPickup.pickupDate : "",
      pickupTime: scope === "alteration" ? alterationPickup.pickupTime : "",
      pickupLocation: scope === "alteration" ? alterationPickup.pickupLocation : "",
      eventType: scope === "custom" ? customOccasion.eventType : "none",
      eventDate: scope === "custom" ? customOccasion.eventDate : "",
      pickedUp: false,
      readyForPickup: false,
    };
  });

  const openOrder: OpenOrder = {
    id: orderId,
    payerCustomerId: order.payerCustomerId,
    payerName: payer?.name ?? "Walk-in customer",
    orderType,
    operationalStatus: "accepted",
    holdUntilAllScopesReady: orderType === "mixed",
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

  return {
    ...openOrder,
    pickupBalanceDue: getOpenOrderPickupBalanceDue(openOrder),
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
        closedAt: order.createdAt,
        status: order.status,
        total: order.total,
      }));
  });
}
