import { Clock3, PackageSearch, type LucideIcon } from "lucide-react";
import type { PickupLocation } from "../../../../types";
import type { OrdersQueueKey } from "../../selectors";

export const queueMeta: Array<{
  key: OrdersQueueKey;
  label: string;
}> = [
  { key: "all", label: "Everything" },
  { key: "due_today", label: "Due today" },
  { key: "due_tomorrow", label: "Due tomorrow" },
  { key: "overdue", label: "Overdue" },
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
    subtitle: "Orders due today that still need work.",
    icon: Clock3,
  },
  {
    key: "due_tomorrow",
    title: "Due tomorrow",
    subtitle: "Orders due tomorrow that should be lined up now.",
    icon: Clock3,
  },
  {
    key: "overdue",
    title: "Overdue",
    subtitle: "Orders that missed their ready date.",
    icon: PackageSearch,
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

  if (phase === "Partially ready") {
    return "default" as const;
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
  return balanceDue > 0 ? "PAYMENT DUE" : "PAID";
}

export function getWorklistPaymentTextClassName(balanceDue: number) {
  if (balanceDue > 0) {
    return "text-[0.76rem] font-semibold uppercase leading-none tracking-[0.18em] text-[var(--app-warn-text)]";
  }

  return "text-[0.76rem] font-semibold uppercase leading-none tracking-[0.18em] text-[var(--app-success-text)]";
}

export function getLocationOptions(pickupLocations: PickupLocation[]): Array<PickupLocation | "all"> {
  return ["all", ...pickupLocations];
}
