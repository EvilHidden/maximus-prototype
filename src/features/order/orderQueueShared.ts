import type { OpenOrder } from "../../types";
import {
  getPickupDateTime,
  isToday,
  isTomorrow,
  normalizePickupTime,
} from "./orderDateUtils";

export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

export function isPastDue(dateValue: string, timeValue: string, now = new Date()) {
  const target = getPickupDateTime(dateValue, timeValue);
  return Boolean(target && target.getTime() < now.getTime());
}

export function getOpenOrderPickupsByWorkflow(openOrder: OpenOrder, workflow: OpenOrder["pickupSchedules"][number]["scope"]) {
  return openOrder.pickupSchedules.filter((pickup) => pickup.scope === workflow);
}

export function isPickupAwaitingPickup(pickup: OpenOrder["pickupSchedules"][number]) {
  return pickup.readyForPickup && !pickup.pickedUp;
}

export function isPickupPending(pickup: OpenOrder["pickupSchedules"][number]) {
  return !pickup.readyForPickup && !pickup.pickedUp;
}

export function formatOperationalPickupSchedule(pickupDate: string, pickupTime: string, now = new Date()) {
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
