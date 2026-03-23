import { Clock3, PackageSearch, type LucideIcon } from "lucide-react";
import type { PickupLocation } from "../../../../types";
import type { OrdersQueueKey } from "../../selectors";

export const queueMeta: Array<{
  key: OrdersQueueKey;
  label: string;
}> = [
  { key: "all", label: "All work" },
  { key: "due_today", label: "Due today" },
  { key: "due_tomorrow", label: "Due tomorrow" },
  { key: "ready_for_pickup", label: "Ready" },
  { key: "overdue", label: "Overdue" },
  { key: "in_house", label: "In-house" },
  { key: "factory", label: "Factory" },
  { key: "scheduled_pickups", label: "Scheduled pickups" },
];

export const queueOverviewMeta: Array<{
  key: Exclude<OrdersQueueKey, "all">;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}> = [
  {
    key: "due_today",
    title: "Due today",
    subtitle: "Orders promised for today that still need operational movement.",
    icon: Clock3,
  },
  {
    key: "due_tomorrow",
    title: "Due tomorrow",
    subtitle: "Orders promised for tomorrow that should be staged now.",
    icon: Clock3,
  },
  {
    key: "ready_for_pickup",
    title: "Ready for pickup",
    subtitle: "Items that can move into customer handoff.",
    icon: Clock3,
  },
  {
    key: "overdue",
    title: "Overdue",
    subtitle: "Promised pickup timing has already slipped.",
    icon: PackageSearch,
  },
  {
    key: "in_house",
    title: "In-house work",
    subtitle: "Alterations and mixed work moving through internal production.",
    icon: PackageSearch,
  },
  {
    key: "factory",
    title: "Factory / custom work",
    subtitle: "Custom work that needs external production tracking.",
    icon: Clock3,
  },
  {
    key: "scheduled_pickups",
    title: "Scheduled pickups",
    subtitle: "Customer pickup appointments that are already booked on the calendar.",
    icon: Clock3,
  },
];

export function formatWorklistTotal(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function getPhaseTone(phase: string) {
  if (phase === "Accepted") {
    return "dark" as const;
  }

  if (phase === "In progress") {
    return "default" as const;
  }

  if (phase === "Ready for pickup") {
    return "success" as const;
  }

  if (phase === "Overdue") {
    return "danger" as const;
  }

  return "warn" as const;
}

export function getWorklistPhaseLabel(phase: string) {
  if (phase === "Ready for pickup") {
    return "Ready";
  }

  return phase;
}

export function getWorklistPaymentLabel(balanceDue: number) {
  return balanceDue > 0 ? "PAYMENT DUE" : "PREPAID";
}

export function getWorklistPaymentTextClassName(balanceDue: number) {
  if (balanceDue > 0) {
    return "text-[0.76rem] font-semibold uppercase leading-none tracking-[0.18em] text-[var(--app-warn-text)]";
  }

  return "text-[0.66rem] font-medium uppercase leading-none tracking-[0.12em] text-[color:color-mix(in_srgb,var(--app-text-soft)_92%,var(--app-success-text))]";
}

export function getLocationOptions(pickupLocations: PickupLocation[]): Array<PickupLocation | "all"> {
  return ["all", ...pickupLocations];
}
