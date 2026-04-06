import type {
  AlterationPickup,
  CheckoutPaymentMode,
  Customer,
  CustomOccasion,
  CustomGarmentDraft,
  OrderWorkflowState,
  OrderLineComponentKind,
  OrderType,
  WorkflowMode,
} from "../types";
import { getCheckoutCollectionAmount } from "../features/order/paymentSummary";
import { getPricingSummary } from "../features/order/orderPricing";
import { findFabricMaterialOptionBySku, getAlterationServicePrice, getCustomGarmentPrice } from "./pricing";
import type { CustomPricingTierDefinition, JacketCanvas } from "./customPricingCatalog";
import type { MaterialOption } from "./referenceData";
import type {
  DbCustomerEvent,
  DbLocation,
  DbOrder,
  DbOrderScope,
  DbOrderScopeLine,
  DbOrderScopeLineComponent,
  DbPaymentRecord,
  DbPickupAppointment,
  PrototypeDatabase,
} from "./schema";
import { createLocationId, toDateTimeString } from "./runtime/support";
import {
  createSeedMeasurementValueMap,
  findAlterationServiceDefinition,
  getPickupLocationNameById,
  getSeedReferenceData,
} from "./referenceData";
import { formatAlterationServiceLabel } from "../features/order/alterationAdjustments";

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
  locations: DbLocation[];
  customPricingTiers: CustomPricingTierDefinition[];
  fabricOptions: MaterialOption[];
  catalogVariations: PrototypeDatabase["catalogVariations"];
  catalogVariationTierPrices: PrototypeDatabase["catalogVariationTierPrices"];
  organizationSettings: PrototypeDatabase["organizationSettings"];
  jacketCanvasSurcharges: Record<JacketCanvas, number>;
  customLiningSurchargeAmount: number;
  paymentMode: CheckoutPaymentMode;
  orderSequence: number;
  now: Date;
  existingOrder?: DbOrder | null;
  existingScopes?: DbOrderScope[];
  existingPickupAppointments?: DbPickupAppointment[];
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
  options?: { referenceId?: string | null; numericValue?: number | null },
) {
  return {
    id: `${lineId}-${kind}-${sortOrder}`,
    lineId,
    kind,
    label,
    value,
    sortOrder,
    referenceId: options?.referenceId ?? null,
    numericValue: options?.numericValue ?? null,
  } satisfies DbOrderScopeLineComponent;
}

function createInitialPaymentRecords(
  orderId: string,
  orderType: OrderType,
  paymentMode: CheckoutPaymentMode,
  minimumDueAmount: number,
  depositAndAlterationAmount: number,
  fullBalanceAmount: number,
  customSubtotal: number,
  customDepositRate: number,
  now: Date,
): DbPaymentRecord[] {
  if (paymentMode === "none") {
    return [];
  }

  const amount = paymentMode === "full_balance"
    ? fullBalanceAmount
    : paymentMode === "deposit_and_alterations"
      ? depositAndAlterationAmount
      : minimumDueAmount;
  if (amount <= 0) {
    return [];
  }

  if ((paymentMode === "minimum_due" || paymentMode === "deposit_and_alterations") && orderType === "mixed" && customSubtotal > 0) {
      const depositAmount = Math.round(customSubtotal * customDepositRate * 100) / 100;
      const alterationAmount = Math.max(amount - depositAmount, 0);
      const records: DbPaymentRecord[] = [];

      if (depositAmount > 0) {
        records.push({
          id: `pay-${orderId}-1`,
          orderId,
          source: "prototype",
          status: "captured",
          allocation: "custom_deposit",
          amount: depositAmount,
          collectedAt: toDateTimeString(now),
          squarePaymentId: null,
        });
      }

      if (alterationAmount > 0) {
        records.push({
          id: `pay-${orderId}-2`,
          orderId,
          source: "prototype",
          status: "captured",
          allocation: "alteration_balance",
          amount: alterationAmount,
          collectedAt: toDateTimeString(now),
          squarePaymentId: null,
        });
      }

    return records;
  }

  return [{
      id: `pay-${orderId}-1`,
      orderId,
      source: "prototype",
      status: "captured",
      allocation: paymentMode === "minimum_due" || paymentMode === "deposit_and_alterations"
        ? orderType === "custom"
          ? "custom_deposit"
          : "full_balance"
        : "full_balance",
      amount,
      collectedAt: toDateTimeString(now),
      squarePaymentId: null,
    }];
}

function getAlterationPickupSummary(items: OrderWorkflowState["alteration"]["items"]) {
  return items.map((item) => `${item.garment} ${item.modifiers.map((modifier) => formatAlterationServiceLabel(modifier)).join(" + ")}`.trim());
}

function getCustomPickupSummary(items: OrderWorkflowState["custom"]["items"]) {
  return items.map((item) => item.selectedGarment ?? "Custom garment");
}

function getOrderWidePickupSummary(order: OrderWorkflowState) {
  return [
    ...getAlterationPickupSummary(order.alteration.items),
    ...getCustomPickupSummary(order.custom.items),
  ].join(", ");
}

function findExistingPickupAppointment(
  existingPickupAppointments: DbPickupAppointment[],
  scopeId: string,
  scope: WorkflowMode,
) {
  const scopedAppointment = existingPickupAppointments.find((appointment) => appointment.scopeId === scopeId);
  if (scopedAppointment) {
    return scopedAppointment;
  }

  if (scope === "alteration") {
    return existingPickupAppointments.find((appointment) => appointment.scopeId === null) ?? null;
  }

  return null;
}

function findPickupAppointmentForScope(
  pickupAppointments: DbPickupAppointment[],
  orderId: string,
  scopeId: string,
) {
  return pickupAppointments.find((appointment) => (
    appointment.orderId === orderId && (appointment.scopeId === scopeId || appointment.scopeId === null)
  )) ?? null;
}

function getEditableItemId(orderId: string, workflow: WorkflowMode, lineId: string) {
  const orderNumber = Number.parseInt(orderId.replace(/\D/g, ""), 10);
  const lineNumberMatch = lineId.match(/(\d+)$/);
  const lineNumber = lineNumberMatch ? Number.parseInt(lineNumberMatch[1], 10) : Number.NaN;

  if (!Number.isNaN(orderNumber) && !Number.isNaN(lineNumber)) {
    return orderNumber * 1000 + (workflow === "custom" ? 500 : 0) + lineNumber;
  }

  const fallbackSeed = `${orderId}:${workflow}:${lineId}`;
  let hash = 0;
  for (const character of fallbackSeed) {
    hash = ((hash * 31) + character.charCodeAt(0)) % 1_000_000;
  }

  return 9_000_000 + hash;
}

function getMonogramValue(
  components: DbOrderScopeLineComponent[],
  position: "left" | "center" | "right",
) {
  return components.find((component) => (
    component.kind === "monogram" && component.label.toLowerCase() === `monogram ${position}`
  ))?.value ?? "";
}

export function serializeOrderWorkflowToRecords({
  order,
  customers,
  locations,
  customPricingTiers,
  fabricOptions,
  catalogVariations,
  catalogVariationTierPrices,
  organizationSettings,
  jacketCanvasSurcharges,
  customLiningSurchargeAmount,
  paymentMode,
  orderSequence,
  now,
  existingOrder = null,
  existingScopes = [],
  existingPickupAppointments = [],
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
    acceptedAt: existingOrder?.acceptedAt ?? toDateTimeString(now),
    startedAt: existingOrder?.startedAt ?? null,
    completedAt: existingOrder?.completedAt ?? null,
    canceledAt: existingOrder?.canceledAt ?? null,
    status: existingOrder?.status ?? "open",
    operationalStatus: existingOrder?.operationalStatus ?? "accepted",
    holdUntilAllScopesReady: orderType === "mixed",
  };

  const customerEvents: DbCustomerEvent[] = [];
  const scopes: DbOrderScope[] = [];
  const scopeLines: DbOrderScopeLine[] = [];
  const lineComponents: DbOrderScopeLineComponent[] = [];
  const pickupAppointments: DbPickupAppointment[] = [];

  getRequiredPickupScopes(order).forEach((scope, scopeIndex) => {
    const alterationPickup = order.fulfillment.alteration;
    const customOccasion = order.fulfillment.custom;
    const scopeId = `${orderId}-${scope}`;
    const eventId = scope === "custom" && customOccasion.eventType !== "none" && customOccasion.eventDate
      ? `event-${orderId}-${scope}`
      : null;
    const promisedReadyAt = scope === "alteration"
      ? (alterationPickup.pickupDate ? createDateTimeString(alterationPickup.pickupDate, alterationPickup.pickupTime || "12:00") : null)
      : (customOccasion.eventDate ? createDateTimeString(customOccasion.eventDate, "12:00") : null);

    if (eventId && order.payerCustomerId) {
      customerEvents.push({
        id: eventId,
        customerId: order.payerCustomerId,
        type: customOccasion.eventType,
        title: `${customOccasion.eventType} deadline for ${displayId}`,
        eventDate: customOccasion.eventDate,
      });
    }

    const existingScope = existingScopes.find((candidate) => candidate.workflow === scope);

    scopes.push({
      id: scopeId,
      orderId,
      workflow: scope,
      phase: existingScope?.phase ?? "in_progress",
      assigneeStaffId: existingScope?.assigneeStaffId ?? null,
      promisedReadyAt,
      readyAt: existingScope?.readyAt ?? null,
      pickedUpAt: existingScope?.pickedUpAt ?? null,
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
        label: `${item.garment} ${item.modifiers.map((modifier) => formatAlterationServiceLabel(modifier)).join(" + ")}`.trim(),
        garmentLabel: item.garment,
        quantity: 1,
        unitPrice: item.subtotal,
        isRush: item.isRush,
        wearerCustomerId: null,
        wearerName: null,
        measurementSetId: null,
        measurementSetLabel: null,
        measurementSnapshot: null,
      });

      item.modifiers.forEach((modifier, modifierIndex) => {
        lineComponents.push(
          createLineComponent(lineId, "alteration_service", "Service", modifier.name, modifierIndex + 1, {
            referenceId: modifier.id,
            numericValue: modifier.deltaInches,
          }),
        );
      });

      (item.photoIds ?? []).forEach((photoId, photoIndex) => {
        lineComponents.push(
          createLineComponent(lineId, "reference_photo", "Reference photo", photoId, item.modifiers.length + photoIndex + 1),
        );
      });
    });

    matchingCustomItems.forEach((item, itemIndex) => {
      const lineId = `${scopeId}-line-${itemIndex + 1}`;
      const garmentLabel = getVariationLabel(item);
      const matchedFabric = findFabricMaterialOptionBySku(item.fabricSku, fabricOptions);
      scopeLines.push({
        id: lineId,
        scopeId,
        label: garmentLabel,
        garmentLabel,
        quantity: 1,
        unitPrice: getCustomGarmentPrice(item, {
          pricingTiers: customPricingTiers,
          fabricOptions,
          catalogVariations,
          catalogVariationTierPrices,
          jacketCanvasSurcharges,
          customLiningSurchargeAmount,
        }),
        isRush: item.isRush,
        wearerCustomerId: item.wearerCustomerId,
        wearerName: getWearerName(item.wearerCustomerId, customers, item.wearerName),
        measurementSetId: item.linkedMeasurementSetId,
        measurementSetLabel: item.linkedMeasurementLabel,
        measurementSnapshot: { ...item.measurementSnapshot },
      });

      const components = [
        createLineComponent(
          lineId,
          "catalog_variation",
          "Variation",
          garmentLabel,
          0,
          { referenceId: item.variationId ?? null },
        ),
        createLineComponent(lineId, "wearer", "Wearer", getWearerName(item.wearerCustomerId, customers, item.wearerName), 1),
        item.linkedMeasurementLabel
          ? createLineComponent(lineId, "measurement_set", "Measurements", item.linkedMeasurementLabel, 2)
          : null,
        item.pricingTierKey
          ? createLineComponent(
              lineId,
              "pricing_tier",
              "Pricing tier",
              customPricingTiers.find((tier) => tier.key === item.pricingTierKey)?.label ?? item.pricingTierKey,
              3,
              { referenceId: item.pricingTierKey },
            )
          : null,
        item.fabricSku ? createLineComponent(lineId, "fabric_sku", "Fabric SKU", item.fabricSku, 4) : null,
        matchedFabric?.millLabel
          ? createLineComponent(lineId, "fabric_book", "Book", matchedFabric.millLabel, 5)
          : null,
        matchedFabric?.manufacturer
          ? createLineComponent(lineId, "fabric_mill", "Mill", matchedFabric.manufacturer, 6)
          : null,
        item.buttonsSku ? createLineComponent(lineId, "buttons_sku", "Buttons SKU", item.buttonsSku, 6) : null,
        item.liningSku ? createLineComponent(lineId, "lining_sku", "Lining SKU", item.liningSku, 8) : null,
        item.customLiningRequested
          ? createLineComponent(lineId, "catalog_modifier", "Modifier", "Custom printed lining", 9, { referenceId: "custom_printed" })
          : null,
        item.threadsSku ? createLineComponent(lineId, "threads_sku", "Threads SKU", item.threadsSku, 10) : null,
        item.canvas ? createLineComponent(lineId, "catalog_modifier", "Modifier", `${item.canvas} canvas`, 11, { referenceId: item.canvas }) : null,
        item.canvas ? createLineComponent(lineId, "canvas", "Canvas", item.canvas, 12) : null,
        item.lapel ? createLineComponent(lineId, "catalog_option", "Option", `Lapel: ${item.lapel}`, 13, { referenceId: item.lapel }) : null,
        item.lapel ? createLineComponent(lineId, "lapel", "Lapel", item.lapel, 14) : null,
        item.pocketType ? createLineComponent(lineId, "catalog_option", "Option", `Pockets: ${item.pocketType}`, 15, { referenceId: item.pocketType }) : null,
        item.pocketType ? createLineComponent(lineId, "pocket_type", "Pockets", item.pocketType, 16) : null,
        item.monogramLeft ? createLineComponent(lineId, "monogram", "Monogram left", item.monogramLeft, 14) : null,
        item.monogramCenter ? createLineComponent(lineId, "monogram", "Monogram center", item.monogramCenter, 15) : null,
        item.monogramRight ? createLineComponent(lineId, "monogram", "Monogram right", item.monogramRight, 16) : null,
      ].filter(Boolean) as DbOrderScopeLineComponent[];

      item.referencePhotoIds.forEach((photoId, photoIndex) => {
        components.push(createLineComponent(lineId, "reference_photo", "Reference photo", photoId, 17 + photoIndex));
      });

      lineComponents.push(...components);
    });

    if (scope === "alteration" && alterationPickup.pickupLocation) {
      const pickupDate = alterationPickup.pickupDate;
      const existingPickupAppointment = findExistingPickupAppointment(existingPickupAppointments, scopeId, scope);
      const pickupSummary = existingPickupAppointment?.scopeId === null
        ? getOrderWidePickupSummary(order)
        : getAlterationPickupSummary(matchingAlterationItems).join(", ");

      pickupAppointments.push({
        id: existingPickupAppointment?.id ?? `pickup-${orderId}-${scopeIndex + 1}`,
        orderId,
        scopeId: existingPickupAppointment ? existingPickupAppointment.scopeId : scopeId,
        scopeLineId: null,
        customerId: order.payerCustomerId,
        scheduledFor: createDateTimeString(pickupDate, alterationPickup.pickupTime || "12:00"),
        locationId: locations.find((location) => location.name === alterationPickup.pickupLocation)?.id ?? createLocationId(alterationPickup.pickupLocation),
        source: existingPickupAppointment?.source ?? "prototype",
        durationMinutes: existingPickupAppointment?.durationMinutes ?? 15,
        typeKey: "pickup",
        statusKey: existingPickupAppointment?.statusKey ?? "scheduled",
        summary: pickupSummary,
        confirmationStatus: existingPickupAppointment?.confirmationStatus ?? null,
      });
    }
  });

  const pricingConfig = {
    pricingTiers: customPricingTiers,
    fabricOptions,
    catalogVariations,
    catalogVariationTierPrices,
    taxRate: organizationSettings.taxRate,
    customDepositRate: organizationSettings.customDepositRate,
    jacketCanvasSurcharges,
    customLiningSurchargeAmount,
  };
  const checkoutCollectionAmount = getCheckoutCollectionAmount(order, pricingConfig);
  const pricingSummary = getPricingSummary(order, pricingConfig);

  return {
    openOrderId: Number.parseInt(displayId.replace(/\D/g, ""), 10) || orderSequence,
    orderRecord,
    customerEvents,
    scopes,
    scopeLines,
    lineComponents,
    pickupAppointments,
    paymentRecords: createInitialPaymentRecords(
      orderId,
      orderType,
      paymentMode,
      checkoutCollectionAmount,
      orderType === "mixed"
        ? pricingSummary.depositDue + pricingSummary.alterationsSubtotal + pricingSummary.taxAmount
        : checkoutCollectionAmount,
      pricingSummary.total,
      order.custom.items.reduce((sum, item) => sum + getCustomGarmentPrice(item, {
        pricingTiers: customPricingTiers,
        fabricOptions,
        catalogVariations,
        catalogVariationTierPrices,
        jacketCanvasSurcharges,
        customLiningSurchargeAmount,
      }), 0),
      organizationSettings.customDepositRate,
      now,
    ),
  };
}

function createEmptyMeasurements() {
  return createSeedMeasurementValueMap();
}

function createEmptyCustomDraft(): CustomGarmentDraft {
  return {
    gender: null,
    wearerCustomerId: null,
    isRush: false,
    variationId: null,
    variationLabel: null,
    selectedGarment: null,
    pricingTierKey: null,
    linkedMeasurementSetId: null,
    measurements: createEmptyMeasurements(),
    fabricSku: null,
    buttonsSku: null,
    liningSku: null,
    customLiningRequested: false,
    threadsSku: null,
    monogramLeft: "",
    monogramCenter: "",
    monogramRight: "",
    pocketType: null,
    lapel: null,
    canvas: null,
    referencePhotoIds: [],
  };
}

function getVariationLabel(item: Pick<CustomGarmentDraft, "variationLabel" | "selectedGarment">) {
  return item.variationLabel ?? item.selectedGarment ?? "Custom garment";
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

function getComponentValues(
  components: DbOrderScopeLineComponent[],
  kind: OrderLineComponentKind,
) {
  return components.filter((component) => component.kind === kind).map((component) => component.value);
}

export function deserializeOrderWorkflowFromRecords(
  database: {
    alterationServiceDefinitions: Array<{
      id: string;
      category: string;
      name: string;
      price: number;
      supportsAdjustment: boolean;
      requiresAdjustment: boolean;
    }>;
    customGarmentDefinitions: Array<{ label: string; gender: "male" | "female" }>;
    customerEvents: DbCustomerEvent[];
    orders: DbOrder[];
    orderScopes: DbOrderScope[];
    orderScopeLines: DbOrderScopeLine[];
    orderScopeLineComponents: DbOrderScopeLineComponent[];
    pickupAppointments: DbPickupAppointment[];
    locations: DbLocation[];
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
          .map((component) => {
            const definition = findAlterationServiceDefinition(
              database.alterationServiceDefinitions,
              line.garmentLabel,
              component.referenceId ?? null,
              component.value,
            );

            if (definition) {
              return {
                ...definition,
                deltaInches: definition.supportsAdjustment ? component.numericValue ?? null : null,
              };
            }

            return {
              id: `${line.garmentLabel}-${component.value}`.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
              name: component.value,
              price: getAlterationServicePrice(database.alterationServiceDefinitions, line.garmentLabel, component.value),
              supportsAdjustment: component.numericValue !== null && component.numericValue !== undefined,
              requiresAdjustment: component.numericValue !== null && component.numericValue !== undefined,
              deltaInches: component.numericValue ?? null,
            };
          });

        return {
          id: getEditableItemId(order.id, "alteration", line.id),
          garment: line.garmentLabel,
          modifiers,
          subtotal: line.unitPrice * line.quantity,
          isRush: line.isRush,
          photoIds: getComponentValues(components, "reference_photo"),
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
          id: getEditableItemId(order.id, "custom", line.id),
          gender: getCustomGenderForGarment(database, line.garmentLabel),
          wearerCustomerId: line.wearerCustomerId,
          isRush: line.isRush,
          variationId: components.find((component) => component.kind === "catalog_variation")?.referenceId ?? null,
          variationLabel: components.find((component) => component.kind === "catalog_variation")?.value ?? line.garmentLabel,
          selectedGarment: line.garmentLabel,
          pricingTierKey: components.find((component) => component.kind === "pricing_tier")?.referenceId ?? null,
          linkedMeasurementSetId: line.measurementSetId,
          measurements: {
            ...createEmptyMeasurements(),
            ...(line.measurementSnapshot ?? {}),
          },
          fabricSku: getComponentValue(components, "fabric_sku", "") || null,
          buttonsSku: getComponentValue(components, "buttons_sku", "") || null,
          liningSku: getComponentValue(components, "lining_sku", "") || null,
          customLiningRequested: components.some((component) => (
            (component.kind === "catalog_modifier" && component.referenceId === "custom_printed") || component.kind === "lining_option"
          )),
          threadsSku: getComponentValue(components, "threads_sku", "") || null,
          monogramLeft: getMonogramValue(components, "left"),
          monogramCenter: getMonogramValue(components, "center"),
          monogramRight: getMonogramValue(components, "right"),
          pocketType: getComponentValue(components, "pocket_type", "") || null,
          lapel: getComponentValue(components, "lapel", "") || null,
          canvas: getComponentValue(components, "canvas", "") || null,
          referencePhotoIds: getComponentValues(components, "reference_photo"),
          wearerName: line.wearerName,
          linkedMeasurementLabel: line.measurementSetLabel,
          measurementSnapshot: {
            ...createEmptyMeasurements(),
            ...(line.measurementSnapshot ?? {}),
          },
        };
      })
    : [];

  const getAlterationFulfillment = (scope: DbOrderScope | undefined): AlterationPickup => {
    const pickupAppointment = scope ? findPickupAppointmentForScope(database.pickupAppointments, order.id, scope.id) : null;
    const pickupDate = pickupAppointment?.scheduledFor.slice(0, 10) ?? "";
    const pickupTime = pickupAppointment
      ? pickupAppointment.scheduledFor.slice(11, 16)
      : "";
    const pickupLocation = pickupAppointment
      ? getPickupLocationNameById(
          database.locations,
          pickupAppointment.locationId,
        )
      : "";

    return {
      pickupDate,
      pickupTime,
      pickupLocation,
    };
  };

  const getCustomOccasion = (scope: DbOrderScope | undefined): CustomOccasion => {
    const event = scope?.eventId ? database.customerEvents.find((candidate) => candidate.id === scope.eventId) : null;
    return {
      eventType: event?.type ?? "none",
      eventDate: event?.eventDate ?? "",
    };
  };

  const customDraft = createEmptyCustomDraft();

  return {
    activeWorkflow: customItems.length > 0 ? "custom" : alterationItems.length > 0 ? "alteration" : null,
    payerCustomerId: order.payerCustomerId,
    alteration: {
      selectedGarment: "",
      selectedModifiers: [],
      selectedRush: false,
      items: alterationItems,
    },
    custom: {
      draft: customDraft,
      items: customItems,
    },
    fulfillment: {
      alteration: getAlterationFulfillment(alterationScope),
      custom: getCustomOccasion(customScope),
    },
  };
}
