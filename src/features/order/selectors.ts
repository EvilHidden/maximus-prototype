import type {
  Appointment,
  ClosedOrderHistoryItem,
  CustomOrderEventType,
  CustomGarmentDraft,
  Customer,
  CustomerOrder,
  MeasurementSet,
  OpenOrder,
  OpenOrderPickup,
  OpenOrderPaymentStatus,
  OrderBagLineItem,
  OrderType,
  OrderWorkflowState,
  PickupLocation,
  PricingSummary,
  WorkflowMode,
} from "../../types";
import { jacketBasedCustomGarments } from "../../data";
import { getMeasurementSetDisplay, getLinkedMeasurementSet } from "../measurements/selectors";

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatDateLabel(value: string) {
  if (!value) {
    return value;
  }

  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function normalizePickupTime(timeValue: string) {
  if (/^\d{2}:\d{2}$/.test(timeValue)) {
    return timeValue;
  }

  const match = timeValue.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return null;
  }

  const [, rawHour, minute, meridiem] = match;
  let hour = Number(rawHour);
  if (Number.isNaN(hour)) {
    return null;
  }

  const isPm = meridiem.toUpperCase() === "PM";
  if (isPm && hour !== 12) {
    hour += 12;
  }

  if (!isPm && hour === 12) {
    hour = 0;
  }

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function getPickupDateTime(dateValue: string, timeValue: string) {
  const normalizedTime = normalizePickupTime(timeValue);
  if (!dateValue || !normalizedTime) {
    return null;
  }

  const dateTime = new Date(`${dateValue}T${normalizedTime}`);
  return Number.isNaN(dateTime.getTime()) ? null : dateTime;
}

export function getCustomGarmentPrice(garment: string | null) {
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
    return "Custom garment order";
  }

  if (orderType === "mixed") {
    return "Mixed order";
  }

  return "Alteration order";
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

export function getPickupTimingLabel(dateValue: string) {
  const target = new Date(`${dateValue}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (target.toDateString() === today.toDateString()) {
    return "Pickup due today";
  }

  if (target.toDateString() === tomorrow.toDateString()) {
    return "Pickup due tomorrow";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(target);
}

export function getPickupAlertState(dateValue: string, timeValue: string, readyForPickup: boolean) {
  if (readyForPickup) {
    return {
      tone: "success" as const,
      label: "Ready for pickup",
    };
  }

  const pickupDateTime = getPickupDateTime(dateValue, timeValue);
  if (!pickupDateTime) {
    return {
      tone: "warn" as const,
      label: "Promised ready time not set",
    };
  }

  const minutesUntilPickup = (pickupDateTime.getTime() - Date.now()) / 60000;
  if (minutesUntilPickup < 0) {
    return {
      tone: "danger" as const,
      label: "Past promised ready time",
    };
  }

  if (minutesUntilPickup <= 60) {
    return {
      tone: "warn" as const,
      label: "Promised ready within 1 hour",
    };
  }

  if (isToday(dateValue)) {
    return {
      tone: "default" as const,
      label: "On track for today",
    };
  }

  if (isTomorrow(dateValue)) {
    return {
      tone: "default" as const,
      label: "Due tomorrow",
    };
  }

  return {
    tone: "default" as const,
    label: "Future promise",
  };
}

export function getPickupStatusSummary(pickup: OpenOrderPickup) {
  if (pickup.scope === "custom" && !pickup.pickupDate) {
    return getCustomFulfillmentSummary(pickup.eventType, pickup.eventDate, pickup.pickupLocation);
  }

  const pickupSummary = formatPickupSchedule(pickup.pickupDate, pickup.pickupTime);
  return `${pickupSummary ?? "Promised ready time not set"}${pickup.pickupLocation ? ` • ${pickup.pickupLocation}` : ""}`;
}

export function getOpenOrderPaymentSummary(paymentStatus: OpenOrderPaymentStatus) {
  return paymentStatus === "prepaid" ? "Payment captured at scheduling" : "No payment collected yet";
}

export function getPickupAppointmentSummary(appointment: Appointment) {
  return appointment.pickupSummary ?? appointment.type;
}

export type OrdersQueueKey =
  | "all"
  | "due_today"
  | "due_tomorrow"
  | "ready_for_pickup"
  | "overdue"
  | "in_house"
  | "factory"
  | "scheduled_pickups";

type OpenOrderFilterOptions = {
  query: string;
  queue: OrdersQueueKey;
  typeFilter: OrderType | "all";
  locationFilter: PickupLocation | "all";
};

type PickupAppointmentFilterOptions = {
  query: string;
  queue: OrdersQueueKey;
  locationFilter: PickupLocation | "all";
};

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function getCurrentCalendarDate() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return today;
}

function isToday(dateValue: string) {
  const target = new Date(`${dateValue}T12:00:00`);
  const today = getCurrentCalendarDate();
  return target.toDateString() === today.toDateString();
}

function isTomorrow(dateValue: string) {
  const target = new Date(`${dateValue}T12:00:00`);
  const tomorrow = getCurrentCalendarDate();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return target.toDateString() === tomorrow.toDateString();
}

function isPastDue(dateValue: string, timeValue: string) {
  const target = getPickupDateTime(dateValue, timeValue);
  return Boolean(target && target.getTime() < Date.now());
}

function getOpenOrderSearchText(openOrder: OpenOrder) {
  return normalizeSearchValue(
    [
      openOrder.id,
      openOrder.payerName,
      getOpenOrderTypeLabel(openOrder.orderType),
      ...openOrder.itemSummary,
      ...openOrder.pickupSchedules.flatMap((pickup) => [
        pickup.label,
        pickup.pickupLocation,
        pickup.itemSummary.join(" "),
      ]),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function getPickupAppointmentSearchText(appointment: Appointment) {
  return normalizeSearchValue(
    [
      appointment.id,
      appointment.customer,
      appointment.type,
      appointment.pickupSummary,
      appointment.location,
      appointment.status,
      appointment.missing,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function getClosedOrderSearchText(order: ClosedOrderHistoryItem) {
  return normalizeSearchValue([order.id, order.customerName, order.label, order.status, order.total].join(" "));
}

function openOrderMatchesLocation(openOrder: OpenOrder, locationFilter: PickupLocation | "all") {
  if (locationFilter === "all") {
    return true;
  }

  return openOrder.pickupSchedules.some((pickup) => pickup.pickupLocation === locationFilter);
}

function openOrderMatchesQueue(openOrder: OpenOrder, queue: OrdersQueueKey) {
  if (queue === "all") {
    return true;
  }

  if (queue === "in_house") {
    return openOrder.orderType === "alteration" || openOrder.orderType === "mixed";
  }

  if (queue === "factory") {
    return openOrder.orderType === "custom" || openOrder.orderType === "mixed";
  }

  if (queue === "ready_for_pickup") {
    return openOrder.pickupSchedules.some((pickup) => pickup.readyForPickup);
  }

  if (queue === "overdue") {
    return openOrder.pickupSchedules.some((pickup) => !pickup.readyForPickup && isPastDue(pickup.pickupDate, pickup.pickupTime));
  }

  if (queue === "due_today") {
    return openOrder.pickupSchedules.some((pickup) => pickup.pickupDate && isToday(pickup.pickupDate));
  }

  if (queue === "due_tomorrow") {
    return openOrder.pickupSchedules.some((pickup) => pickup.pickupDate && isTomorrow(pickup.pickupDate));
  }

  return false;
}

function pickupAppointmentMatchesQueue(appointment: Appointment, queue: OrdersQueueKey) {
  if (queue === "all") {
    return true;
  }

  if (queue === "scheduled_pickups") {
    return true;
  }

  return false;
}

export function getOpenOrderOperationalLane(openOrder: OpenOrder) {
  if (openOrder.orderType === "mixed") {
    return "Mixed lane";
  }

  if (openOrder.orderType === "custom") {
    return "Factory / custom";
  }

  return "In-house tailoring";
}

export function getOpenOrderOperationalPhase(openOrder: OpenOrder) {
  if (openOrder.pickupSchedules.some((pickup) => pickup.readyForPickup)) {
    return "Ready for pickup";
  }

  if (openOrder.pickupSchedules.some((pickup) => !pickup.readyForPickup && isPastDue(pickup.pickupDate, pickup.pickupTime))) {
    return "Overdue";
  }

  return "In progress";
}

export function getOpenOrderLocationSummary(openOrder: OpenOrder) {
  const uniqueLocations = [...new Set(openOrder.pickupSchedules.map((pickup) => pickup.pickupLocation).filter(Boolean))];
  return uniqueLocations.join(" • ");
}

export function getOrderQueueCounts(openOrders: OpenOrder[], pickupAppointments: Appointment[]) {
  const queueKeys: OrdersQueueKey[] = [
    "all",
    "due_today",
    "due_tomorrow",
    "ready_for_pickup",
    "overdue",
    "in_house",
    "factory",
    "scheduled_pickups",
  ];

  return queueKeys.reduce<Record<OrdersQueueKey, number>>((accumulator, queueKey) => {
    const openOrderCount = openOrders.filter((openOrder) => openOrderMatchesQueue(openOrder, queueKey)).length;
    const pickupCount = pickupAppointments.filter((appointment) => pickupAppointmentMatchesQueue(appointment, queueKey)).length;
    accumulator[queueKey] = queueKey === "in_house" || queueKey === "factory"
      ? openOrderCount
      : openOrderCount + pickupCount;
    return accumulator;
  }, {
    all: 0,
    due_today: 0,
    due_tomorrow: 0,
    ready_for_pickup: 0,
    overdue: 0,
    in_house: 0,
    factory: 0,
    scheduled_pickups: 0,
  });
}

export function filterOpenOrders(
  openOrders: OpenOrder[],
  { query, queue, typeFilter, locationFilter }: OpenOrderFilterOptions,
) {
  const normalizedQuery = normalizeSearchValue(query);

  return openOrders.filter((openOrder) => {
    if (typeFilter !== "all" && openOrder.orderType !== typeFilter) {
      return false;
    }

    if (!openOrderMatchesLocation(openOrder, locationFilter)) {
      return false;
    }

    if (!openOrderMatchesQueue(openOrder, queue)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return getOpenOrderSearchText(openOrder).includes(normalizedQuery);
  });
}

export function filterPickupAppointments(
  pickupAppointments: Appointment[],
  { query, queue, locationFilter }: PickupAppointmentFilterOptions,
) {
  const normalizedQuery = normalizeSearchValue(query);

  return pickupAppointments.filter((appointment) => {
    if (locationFilter !== "all" && appointment.location !== locationFilter) {
      return false;
    }

    if (!pickupAppointmentMatchesQueue(appointment, queue)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return getPickupAppointmentSearchText(appointment).includes(normalizedQuery);
  });
}

export function filterClosedOrderHistory(historyItems: ClosedOrderHistoryItem[], query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) {
    return historyItems;
  }

  return historyItems.filter((order) => getClosedOrderSearchText(order).includes(normalizedQuery));
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

  const normalizedTime = normalizePickupTime(pickupTime);
  if (!normalizedTime) {
    return null;
  }

  const pickupDateTime = new Date(`${pickupDate}T${normalizedTime}`);
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

export function buildOpenOrder(
  order: OrderWorkflowState,
  customers: Customer[],
  paymentStatus: OpenOrderPaymentStatus,
): OpenOrder | null {
  const orderType = getOrderType(order);
  if (!orderType) {
    return null;
  }

  const lineItems = getOrderBagLineItems(order, customers);
  const pricing = getPricingSummary(order);
  const payer = customers.find((customer) => customer.id === order.payerCustomerId) ?? null;
  const collectedToday = paymentStatus === "prepaid" ? getCheckoutCollectionAmount(order) : 0;
  const pickupSchedules: OpenOrderPickup[] = getRequiredPickupScopes(order).map((scope) => {
    const schedule = getPickupScheduleForScope(order, scope);
    const matchingItems = lineItems.filter((item) => item.kind === scope);

    return {
      id: `${Date.now()}-${scope}`,
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
    id: Date.now(),
    payerCustomerId: order.payerCustomerId,
    payerName: payer?.name ?? "Walk-in customer",
    orderType,
    itemCount: lineItems.length,
    itemSummary: lineItems.map((item) => item.title.replace(/^\d+\.\s*/, "")),
    pickupSchedules,
    paymentStatus,
    collectedToday,
    total: pricing.total,
    createdAtLabel: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date()),
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
        date: order.date,
        status: order.status,
        total: order.total,
      }));
  });
}
