import type {
  Appointment,
  ClosedOrderHistoryItem,
  OpenOrder,
  OpenOrderPaymentStatus,
  PickupLocation,
  WorkflowMode,
} from "../../types";
import {
  getAppointmentContextFlagLabel,
  getAppointmentPrepFlagLabel,
  getAppointmentProfileFlagLabel,
} from "../appointments/selectors";
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
      appointment.scheduledFor,
      appointment.location,
      appointment.status,
      ...appointment.prepFlags.map(getAppointmentPrepFlagLabel),
      ...appointment.profileFlags.map(getAppointmentProfileFlagLabel),
      ...appointment.contextFlags.map(getAppointmentContextFlagLabel),
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

function pickupAppointmentMatchesQueue(appointment: Appointment, queue: OrdersQueueKey) {
  if (queue === "all") {
    return true;
  }

  if (queue === "scheduled_pickups") {
    return true;
  }

  return false;
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
  | "factory"
  | "scheduled_pickups";

type OpenOrderFilterOptions = {
  query: string;
  queue: OrdersQueueKey;
  typeFilter: OpenOrder["orderType"] | "all";
  locationFilter: PickupLocation | "all";
};

type PickupAppointmentFilterOptions = {
  query: string;
  queue: OrdersQueueKey;
  locationFilter: PickupLocation | "all";
};

export function getPickupTimingLabel(dateValue: string, now = new Date()) {
  const target = new Date(`${dateValue}T12:00:00`);
  const today = new Date(now);
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

export function getOpenOrderPaymentSummary(paymentStatus: OpenOrderPaymentStatus) {
  return paymentStatus === "prepaid" ? "Payment captured at scheduling" : "No payment collected yet";
}

export function getPickupAppointmentSummary(appointment: Appointment) {
  return appointment.pickupSummary ?? appointment.type;
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

export function getOpenOrderOperationalPhase(openOrder: OpenOrder, now = new Date()) {
  if (openOrder.pickupSchedules.some((pickup) => pickup.readyForPickup)) {
    return "Ready for pickup";
  }

  if (openOrder.pickupSchedules.some((pickup) => !pickup.readyForPickup && isPastDue(pickup.pickupDate, pickup.pickupTime, now))) {
    return "Overdue";
  }

  return "In progress";
}

export function getOpenOrderLocationSummary(openOrder: OpenOrder) {
  const uniqueLocations = [...new Set(openOrder.pickupSchedules.map((pickup) => pickup.pickupLocation).filter(Boolean))];
  return uniqueLocations.join(" • ");
}

export function getOrderQueueCounts(openOrders: OpenOrder[], pickupAppointments: Appointment[], options: { now?: Date } = {}) {
  const now = options.now ?? new Date();
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
    const openOrderCount = openOrders.filter((openOrder) => openOrderMatchesQueue(openOrder, queueKey, now)).length;
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

    if (!openOrderMatchesQueue(openOrder, queue, now)) {
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
    hour: "numeric",
    minute: "2-digit",
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
