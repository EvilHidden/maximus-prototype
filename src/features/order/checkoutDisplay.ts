import type { OpenOrder, OrderWorkflowState } from "../../types";
import { formatPickupSchedule, getAlterationPickup, getCustomOccasion, getRequiredPickupScopes } from "./selectors";
import { getPickupDateTime } from "./orderDateUtils";

export function getDraftPickupSummary(order: OrderWorkflowState) {
  const requiredPickupScopes = getRequiredPickupScopes(order);

  return requiredPickupScopes
    .map((scope) => {
      const scopeLabel = scope === "alteration" ? "Alterations" : "Custom garments";
      const formatted = scope === "alteration"
        ? formatPickupSchedule(getAlterationPickup(order).pickupDate, getAlterationPickup(order).pickupTime)
        : null;

      if (formatted) {
        return `${scopeLabel}: ${formatted}`;
      }

      if (scope === "custom" && getCustomOccasion(order).eventDate) {
        return `${scopeLabel}: Event due ${getCustomOccasion(order).eventDate}`;
      }

      return `${scopeLabel}: Timing needed`;
    })
    .join(requiredPickupScopes.length > 1 ? "\n" : "");
}

export function getSavedPickupSummary(openOrder: OpenOrder) {
  return openOrder.pickupSchedules
    .map((pickup) => {
      const scopeLabel = pickup.scope === "alteration" ? "Alterations" : "Custom garments";
      const formatted = formatPickupSchedule(pickup.pickupDate, pickup.pickupTime);

      if (formatted) {
        return `${scopeLabel}: ${formatted}`;
      }

      if (pickup.scope === "custom" && pickup.eventDate) {
        return `${scopeLabel}: Event due ${pickup.eventDate}`;
      }

      return `${scopeLabel}: Timing needed`;
    })
    .join(openOrder.pickupSchedules.length > 1 ? "\n" : "");
}

export function formatCheckoutCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompactReadyBy(dateValue: string, timeValue: string) {
  const pickupDateTime = getPickupDateTime(dateValue, timeValue);
  if (!pickupDateTime) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(pickupDateTime);
}

export function getReadyBySummary(openOrder: OpenOrder | null, pickupSummary: string) {
  const pickupLines = pickupSummary.split("\n").filter(Boolean);

  if (!openOrder) {
    return {
      headline: pickupLines[0] ?? "",
      detail: pickupLines.slice(1).join("\n"),
    };
  }

  const compactEntries = openOrder.pickupSchedules
    .map((pickup) => ({
      scopeLabel: pickup.scope === "alteration" ? "Alterations" : "Custom garments",
      value: formatCompactReadyBy(pickup.pickupDate, pickup.pickupTime),
    }))
    .filter((entry): entry is { scopeLabel: string; value: string } => Boolean(entry.value));

  if (!compactEntries.length) {
    return {
      headline: pickupLines[0] ?? "",
      detail: pickupLines.slice(1).join("\n"),
    };
  }

  const uniqueTimes = [...new Set(compactEntries.map((entry) => entry.value))];
  if (uniqueTimes.length === 1) {
    return {
      headline: uniqueTimes[0],
      detail: compactEntries.map((entry) => entry.scopeLabel).join(" + "),
    };
  }

  return {
    headline: "Multiple ready dates",
    detail: compactEntries.map((entry) => `${entry.scopeLabel}: ${entry.value}`).join("\n"),
  };
}

function toSentenceCase(value: string) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getCheckoutDisplayLineItem(item: OpenOrder["lineItems"][number]) {
  if (item.kind === "alteration") {
    const detail = item.components
      .filter((component) => component.kind === "alteration_service")
      .map((component) => toSentenceCase(component.value))
      .join(", ");

    return {
      title: `Alteration - ${item.garmentLabel}`,
      subtitle: detail ? toSentenceCase(detail) : "",
    };
  }

  const primaryDetail = item.components
    .filter((component) => component.kind === "wearer" || component.kind === "measurement_set")
    .map((component) => component.value)
    .join(" • ");
  const optionDetail = item.components
    .filter((component) => component.kind !== "wearer" && component.kind !== "measurement_set")
    .map((component) => `${component.label} ${component.value}`)
    .join(" • ");

  return {
    title: `Custom garment - ${item.garmentLabel}`,
    subtitle: [primaryDetail, optionDetail].filter(Boolean).join("\n"),
  };
}
