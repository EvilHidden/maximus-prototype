import type { Appointment, OpenOrder } from "../../types";
import { getPickupDateTime } from "./orderDateUtils";
import { getCustomFulfillmentSummary } from "./orderWorkflow";
import { formatOperationalPickupSchedule, isPastDue, isPickupPending } from "./orderQueueShared";
import { isToday, isTomorrow } from "./orderDateUtils";

export type OpenOrderPickupGroup = {
  key: string;
  scope: OpenOrder["pickupSchedules"][number]["scope"];
  summary: string;
  alertLabel: string;
  itemSummary: string[];
  pickupIds: string[];
  actionPickupIds: string[];
};

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

export function getPickupStatusSummary(pickup: OpenOrder["pickupSchedules"][number], now = new Date()) {
  if (pickup.scope === "custom" && !pickup.pickupDate) {
    return getCustomFulfillmentSummary(pickup.eventType, pickup.eventDate);
  }

  const pickupSummary = formatOperationalPickupSchedule(pickup.pickupDate, pickup.pickupTime, now);
  return `${pickupSummary ?? "Promised ready time not set"}${pickup.pickupLocation ? ` • ${pickup.pickupLocation}` : ""}`;
}

export function getOpenOrderPickupGroups(
  openOrder: OpenOrder,
  options: {
    includePickedUp?: boolean;
    scopes?: OpenOrder["pickupSchedules"][number]["scope"][];
    now?: Date;
  } = {},
) {
  const {
    includePickedUp = false,
    scopes,
    now = new Date(),
  } = options;

  return openOrder.pickupSchedules
    .filter((pickup) => (includePickedUp || !pickup.pickedUp) && (!scopes || scopes.includes(pickup.scope)))
    .reduce<OpenOrderPickupGroup[]>((groups, pickup) => {
      const pickupAlert = getPickupAlertState(pickup.pickupDate, pickup.pickupTime, pickup.readyForPickup, now);
      const pickupSummary = getPickupStatusSummary(pickup, now);
      const key = `${pickup.scope}__${pickupSummary}__${pickupAlert.label}`;
      const existingGroup = groups.find((group) => group.key === key);

      if (existingGroup) {
        existingGroup.itemSummary.push(...pickup.itemSummary);
        existingGroup.pickupIds.push(pickup.id);
        if (!pickup.readyForPickup) {
          existingGroup.actionPickupIds.push(pickup.id);
        }
        return groups;
      }

      groups.push({
        key,
        scope: pickup.scope,
        summary: pickupSummary,
        alertLabel: pickupAlert.label,
        itemSummary: [...pickup.itemSummary],
        pickupIds: [pickup.id],
        actionPickupIds: !pickup.readyForPickup ? [pickup.id] : [],
      });

      return groups;
    }, []);
}

export function getNeedsAttentionPickupGroups(openOrder: OpenOrder, now = new Date()) {
  const pickupGroups = getOpenOrderPickupGroups(openOrder, { now });
  const unresolvedPickupGroups = pickupGroups.filter((group) => {
    const representativePickup = openOrder.pickupSchedules.find((pickup) => pickup.id === group.pickupIds[0]);
    return representativePickup ? isPickupPending(representativePickup) : false;
  });

  return unresolvedPickupGroups.length > 0 ? unresolvedPickupGroups : pickupGroups;
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

export function getOpenOrderLocationSummary(openOrder: OpenOrder) {
  const uniqueLocations = [...new Set(openOrder.pickupSchedules.map((pickup) => pickup.pickupLocation).filter(Boolean))];
  return uniqueLocations.join(" • ");
}
