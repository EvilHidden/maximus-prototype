import type {
  Appointment,
  ClosedOrderHistoryItem,
  OpenOrder,
  PickupLocation,
  WorkflowMode,
} from "../../types";
import {
  formatDateLabel,
  getPickupDateTime,
  isToday,
  isTomorrow,
  normalizePickupTime,
} from "./orderDateUtils";
import { getCustomFulfillmentSummary, getOpenOrderTypeLabel } from "./orderWorkflow";

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function isPastDue(dateValue: string, timeValue: string, now = new Date()) {
  const target = getPickupDateTime(dateValue, timeValue);
  return Boolean(target && target.getTime() < now.getTime());
}

function getOpenOrderSearchText(openOrder: OpenOrder) {
  return normalizeSearchValue(
    [
      openOrder.id,
      openOrder.payerName,
      openOrder.inHouseAssignee?.name,
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

function getClosedOrderSearchText(order: ClosedOrderHistoryItem) {
  return normalizeSearchValue([order.id, order.customerName, order.label, order.status, formatCompactCurrency(order.total)].join(" "));
}

function openOrderMatchesLocation(openOrder: OpenOrder, locationFilter: PickupLocation | "all") {
  if (locationFilter === "all") {
    return true;
  }

  return openOrder.pickupSchedules.some((pickup) => pickup.pickupLocation === locationFilter);
}

export type AssigneeFilterValue = "all" | "unassigned" | string;

function openOrderMatchesAssignee(openOrder: OpenOrder, assigneeFilter: AssigneeFilterValue) {
  if (assigneeFilter === "all") {
    return true;
  }

  if (assigneeFilter === "unassigned") {
    return (openOrder.orderType === "alteration" || openOrder.orderType === "mixed") && !openOrder.inHouseAssignee;
  }

  return openOrder.inHouseAssignee?.id === assigneeFilter;
}

function openOrderMatchesQueue(openOrder: OpenOrder, queue: OrdersQueueKey, now = new Date()) {
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
    return openOrder.pickupSchedules.some((pickup) => !pickup.readyForPickup && isPastDue(pickup.pickupDate, pickup.pickupTime, now));
  }

  if (queue === "due_today") {
    return openOrder.pickupSchedules.some((pickup) => pickup.pickupDate && isToday(pickup.pickupDate, now));
  }

  if (queue === "due_tomorrow") {
    return openOrder.pickupSchedules.some((pickup) => pickup.pickupDate && isTomorrow(pickup.pickupDate, now));
  }

  return false;
}

function formatOperationalPickupSchedule(pickupDate: string, pickupTime: string, now = new Date()) {
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

  const dateLabel = isToday(pickupDate, now)
    ? "Today"
    : isTomorrow(pickupDate, now)
      ? "Tomorrow"
      : new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        }).format(pickupDateTime);

  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(pickupDateTime);

  return `${dateLabel} · ${time}`;
}

export type OrdersQueueKey =
  | "all"
  | "due_today"
  | "due_tomorrow"
  | "ready_for_pickup"
  | "overdue"
  | "in_house"
  | "factory";

type OpenOrderFilterOptions = {
  query: string;
  queue: OrdersQueueKey;
  typeFilter: OpenOrder["orderType"] | "all";
  locationFilter: PickupLocation | "all";
  assigneeFilter: AssigneeFilterValue;
};

export function getPickupTimingLabel(dateValue: string, now = new Date()) {
  const target = new Date(`${dateValue}T12:00:00`);
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (target.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (target.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(target);
}

export function getPickupAlertState(dateValue: string, timeValue: string, readyForPickup: boolean, now = new Date()) {
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

  const minutesUntilPickup = (pickupDateTime.getTime() - now.getTime()) / 60000;
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

  if (isToday(dateValue, now)) {
    return {
      tone: "default" as const,
      label: "On track for today",
    };
  }

  if (isTomorrow(dateValue, now)) {
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

export function getPickupStatusSummary(pickup: OpenOrder["pickupSchedules"][number]) {
  if (pickup.scope === "custom" && !pickup.pickupDate) {
    return getCustomFulfillmentSummary(pickup.eventType, pickup.eventDate, pickup.pickupLocation);
  }

  const pickupSummary = formatOperationalPickupSchedule(pickup.pickupDate, pickup.pickupTime);
  return `${pickupSummary ?? "Promised ready time not set"}${pickup.pickupLocation ? ` • ${pickup.pickupLocation}` : ""}`;
}

export function getPickupAppointmentSummary(appointment: Appointment) {
  if (!appointment.pickupSummary) {
    return "Pickup details pending";
  }

  const summary = appointment.pickupSummary
    .split("•")
    .map((segment) => segment.replace(/^\s*(Alterations|Custom):\s*/i, "").trim())
    .filter(Boolean)
    .join(", ");

  return summary || "Pickup details pending";
}

export function getPickupAppointmentConfirmationState(appointment: Appointment) {
  if (appointment.contextFlags.includes("confirmed")) {
    return {
      tone: "success" as const,
      label: "Confirmed",
    };
  }

  if (appointment.contextFlags.includes("unconfirmed")) {
    return {
      tone: "warn" as const,
      label: "Unconfirmed",
    };
  }

  return {
    tone: "default" as const,
    label: "Confirmation pending",
  };
}

export function getOpenOrderOperationalLane(openOrder: OpenOrder) {
  if (openOrder.orderType === "mixed") {
    return "Alterations and custom";
  }

  if (openOrder.orderType === "custom") {
    return "Custom";
  }

  return "Alterations";
}

export function getOpenOrderOperationalPhase(openOrder: OpenOrder, now = new Date()) {
  if (openOrder.pickupSchedules.some((pickup) => pickup.readyForPickup)) {
    return "Ready for pickup";
  }

  if (openOrder.pickupSchedules.some((pickup) => !pickup.readyForPickup && isPastDue(pickup.pickupDate, pickup.pickupTime, now))) {
    return "Overdue";
  }

  if (openOrder.operationalStatus === "accepted") {
    return "Accepted";
  }

  return "In progress";
}

export function getOpenOrderLocationSummary(openOrder: OpenOrder) {
  const uniqueLocations = [...new Set(openOrder.pickupSchedules.map((pickup) => pickup.pickupLocation).filter(Boolean))];
  return uniqueLocations.join(" • ");
}

export function getOrderQueueCounts(openOrders: OpenOrder[], options: { now?: Date } = {}) {
  const now = options.now ?? new Date();
  const queueKeys: OrdersQueueKey[] = [
    "all",
    "due_today",
    "due_tomorrow",
    "ready_for_pickup",
    "overdue",
    "in_house",
    "factory",
  ];

  return queueKeys.reduce<Record<OrdersQueueKey, number>>((accumulator, queueKey) => {
    const openOrderCount = openOrders.filter((openOrder) => openOrderMatchesQueue(openOrder, queueKey, now)).length;
    accumulator[queueKey] = openOrderCount;
    return accumulator;
  }, {
    all: 0,
    due_today: 0,
    due_tomorrow: 0,
    ready_for_pickup: 0,
    overdue: 0,
    in_house: 0,
    factory: 0,
  });
}

export function filterOpenOrders(
  openOrders: OpenOrder[],
  { query, queue, typeFilter, locationFilter, assigneeFilter }: OpenOrderFilterOptions,
  options: { now?: Date } = {},
) {
  const now = options.now ?? new Date();
  const normalizedQuery = normalizeSearchValue(query);

  return openOrders.filter((openOrder) => {
    if (typeFilter !== "all" && openOrder.orderType !== typeFilter) {
      return false;
    }

    if (!openOrderMatchesLocation(openOrder, locationFilter)) {
      return false;
    }

    if (!openOrderMatchesAssignee(openOrder, assigneeFilter)) {
      return false;
    }

    if (!openOrderMatchesQueue(openOrder, queue, now)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return getOpenOrderSearchText(openOrder).includes(normalizedQuery);
  });
}

export function filterClosedOrderHistory(historyItems: ClosedOrderHistoryItem[], query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) {
    return historyItems;
  }

  return historyItems.filter((order) => getClosedOrderSearchText(order).includes(normalizedQuery));
}

export function formatClosedOrderDate(value: string) {
  return formatDateLabel(value);
}

export function formatClosedOrderTotal(value: number) {
  return formatCompactCurrency(value);
}

export function formatOpenOrderCreatedAt(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsed);
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

export function getOperationalPickupDateLabel(pickupDate: string, pickupTime: string, now = new Date()) {
  const compactSchedule = formatOperationalPickupSchedule(pickupDate, pickupTime, now);
  if (!compactSchedule) {
    return null;
  }

  const [dateLabel] = compactSchedule.split(" · ");
  return dateLabel ?? compactSchedule;
}

export function getOperationalPickupTimeLabel(pickupDate: string, pickupTime: string, now = new Date()) {
  const compactSchedule = formatOperationalPickupSchedule(pickupDate, pickupTime, now);
  if (!compactSchedule) {
    return null;
  }

  const [, timeLabel] = compactSchedule.split(" · ");
  return timeLabel ?? compactSchedule;
}
