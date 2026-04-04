import type { ClosedOrderHistoryItem, OpenOrder } from "../../../../types";
import {
  formatOpenOrderCreatedAt,
  formatPickupSchedule,
  getOpenOrderLocationSummary,
  getOpenOrderOperationalLane,
  getOperationalPickupDateLabel,
  getOperationalPickupTimeLabel,
} from "../../selectors";

export type OrderStatusTone = "default" | "dark" | "success" | "warn" | "danger";

export function getPickupScheduleSummary(pickups: OpenOrder["pickupSchedules"] | ClosedOrderHistoryItem["pickupSchedules"]) {
  const labels = (pickups ?? [])
    .map((pickup) => formatPickupSchedule(pickup.pickupDate, pickup.pickupTime))
    .filter((value): value is string => Boolean(value));

  return [...new Set(labels)].join(" • ");
}

function formatReadyItemLabel(item: string) {
  return item
    .replace(/^Alteration\s*-\s*/i, "")
    .replace(/^Custom garment\s*-\s*/i, "")
    .trim();
}

export function summarizeReadyOrderItems(items: string[]) {
  const uniqueItems = [...new Set(items.map(formatReadyItemLabel).filter(Boolean))];
  if (uniqueItems.length <= 2) {
    return uniqueItems.join(", ");
  }

  return `${uniqueItems[0]}, ${uniqueItems[1]} +${uniqueItems.length - 2} more`;
}

export function getCompactPickupScheduleSummary(pickups: OpenOrder["pickupSchedules"] | ClosedOrderHistoryItem["pickupSchedules"]) {
  const labels = pickups
    .map((pickup) => {
      const dateLabel = getOperationalPickupDateLabel(pickup.pickupDate, pickup.pickupTime);
      const timeLabel = getOperationalPickupTimeLabel(pickup.pickupDate, pickup.pickupTime);
      return [dateLabel, timeLabel].filter(Boolean).join(" • ");
    })
    .filter((value): value is string => Boolean(value));

  const uniqueLabels = [...new Set(labels)];
  if (uniqueLabels.length <= 1) {
    return uniqueLabels[0] ?? "";
  }

  return `${uniqueLabels[0]} +${uniqueLabels.length - 1} more`;
}

export function getOrderTimelineSummary(openOrder: OpenOrder) {
  return {
    schedule: getPickupScheduleSummary(openOrder.pickupSchedules) || "Pickup pending",
    location: getOpenOrderLocationSummary(openOrder) || "Pending",
    items: summarizeGroupedOrderItems(openOrder.itemSummary) || getOpenOrderOperationalLane(openOrder),
  };
}

export function summarizeGroupedOrderItems(items: string[]) {
  const uniqueItems = [...new Set(items)].filter(Boolean);
  if (uniqueItems.length <= 2) {
    return uniqueItems.join(", ");
  }

  return `${uniqueItems[0]}, ${uniqueItems[1]} +${uniqueItems.length - 2} more`;
}

export function getWorkflowSummaryLabel(orderType: OpenOrder["orderType"]) {
  if (orderType === "mixed") {
    return "Alteration + Custom Garment";
  }

  if (orderType === "custom") {
    return "Custom Garment";
  }

  return "Alteration";
}

export function getOrdersStatusTextClassName(tone: OrderStatusTone) {
  if (tone === "success") {
    return "text-[0.82rem] font-semibold leading-tight text-[var(--app-success-text)]";
  }

  if (tone === "danger") {
    return "text-[0.82rem] font-semibold leading-tight text-[var(--app-danger-text)]";
  }

  if (tone === "dark") {
    return "text-[0.82rem] font-semibold leading-tight text-[var(--app-text)]";
  }

  if (tone === "warn") {
    return "text-[0.82rem] font-semibold leading-tight text-[var(--app-warn-text)]";
  }

  return "text-[0.82rem] font-semibold leading-tight text-[var(--app-text-muted)]";
}

export function getClosedOrderStatusTone(status: ClosedOrderHistoryItem["status"]) {
  if (status === "Picked up") {
    return "success";
  }

  if (status === "Canceled") {
    return "danger";
  }

  return "default";
}

export function getClosedOrderCompletedLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return formatOpenOrderCreatedAt(value);
}

export function getClosedScopeLabel(scope: OpenOrder["pickupSchedules"][number]["scope"]) {
  return scope === "alteration" ? "Alteration" : "Custom Garment";
}
