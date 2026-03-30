import type { ClosedOrderHistoryItem, OpenOrder } from "../../types";
import { formatDateLabel, getPickupDateTime, normalizePickupTime } from "./orderDateUtils";
import { formatOperationalPickupSchedule } from "./orderQueueShared";

function getOpenOrderEarliestPickupTimestamp(openOrder: OpenOrder) {
  return openOrder.pickupSchedules
    .map((pickup) => getPickupDateTime(pickup.pickupDate, pickup.pickupTime)?.getTime() ?? Number.POSITIVE_INFINITY)
    .sort((left, right) => left - right)[0] ?? Number.POSITIVE_INFINITY;
}

function getOpenOrderCreatedAtTimestamp(openOrder: OpenOrder) {
  const createdAt = new Date(openOrder.createdAt).getTime();
  return Number.isNaN(createdAt) ? Number.POSITIVE_INFINITY : createdAt;
}

export function sortOpenOrdersChronologically(openOrders: OpenOrder[]) {
  return [...openOrders].sort((left, right) => {
    const leftEarliestPickup = getOpenOrderEarliestPickupTimestamp(left);
    const rightEarliestPickup = getOpenOrderEarliestPickupTimestamp(right);

    if (leftEarliestPickup !== rightEarliestPickup) {
      return leftEarliestPickup - rightEarliestPickup;
    }

    const leftCreatedAt = getOpenOrderCreatedAtTimestamp(left);
    const rightCreatedAt = getOpenOrderCreatedAtTimestamp(right);

    if (leftCreatedAt !== rightCreatedAt) {
      return leftCreatedAt - rightCreatedAt;
    }

    return left.id - right.id;
  });
}

export function formatClosedOrderDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return formatDateLabel(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export function formatClosedOrderTotal(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
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
