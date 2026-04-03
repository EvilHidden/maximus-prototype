import { ChevronRight, MapPin } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { OpenOrder } from "../../../../types";
import { ActionButton, cx } from "../../../../components/ui/primitives";
import {
  formatOpenOrderCreatedAt,
  getOpenOrderLocationSummary,
  getOpenOrderOperationalLane,
  getOpenOrderPickupGroups,
  getOpenOrderReadinessBreakdown,
  getOpenOrderStatusPills,
  getOpenOrderTypeLabel,
  getOperationalPickupDateLabel,
  getOperationalPickupTimeLabel,
} from "../../selectors";
import { formatWorklistTotal, getWorklistPaymentLabel, getWorklistPaymentTextClassName } from "./meta";
import {
  getCompactPickupScheduleSummary,
  getOrderTimelineSummary,
  getOrdersStatusTextClassName,
  getWorkflowSummaryLabel,
  OPEN_ORDER_ROW_GRID_CLASS,
  READY_ORDER_ROW_GRID_CLASS,
  summarizeGroupedOrderItems,
} from "./openOrdersRegistryShared";

function getReadyPickupSummary(openOrder: OpenOrder) {
  const readyPickups = openOrder.pickupSchedules.filter((pickup) => pickup.readyForPickup && !pickup.pickedUp);
  const readyAndPickedUpPickups = openOrder.pickupSchedules.filter((pickup) => pickup.readyForPickup || pickup.pickedUp);
  const displayPickups = readyPickups.length
    ? openOrder.orderType === "mixed" && readyAndPickedUpPickups.length > readyPickups.length
      ? readyAndPickedUpPickups
      : readyPickups
    : openOrder.pickupSchedules;
  const locations = [...new Set(displayPickups.map((pickup) => pickup.pickupLocation).filter(Boolean))].join(" • ");
  const scheduleSummary = getCompactPickupScheduleSummary(displayPickups);

  return {
    locations: locations || getOpenOrderLocationSummary(openOrder) || "Pending",
    scheduleSummary,
  };
}

function getReadyMixedStatusSummary(openOrder: OpenOrder) {
  if (openOrder.orderType !== "mixed") {
    return null;
  }

  const breakdown = getOpenOrderReadinessBreakdown(openOrder);
  const primary = breakdown.alterationReady
    ? { label: "Alteration ready", tone: "success" as const }
    : breakdown.customReady
      ? { label: "Custom Garment ready", tone: "success" as const }
      : null;

  if (!primary) {
    return null;
  }

  const secondary = breakdown.alterationReady
    ? breakdown.customPickedUp
      ? "Custom Garment: Picked up"
      : breakdown.customReady
        ? "Custom Garment: Ready"
        : "Custom Garment: In progress"
    : breakdown.alterationPickedUp
      ? "Alteration: Picked up"
      : breakdown.alterationReady
        ? "Alteration: Ready"
        : "Alteration: In progress";

  return { primary, secondary };
}

function getReadyStatusSummary(openOrder: OpenOrder) {
  const mixedStatusSummary = getReadyMixedStatusSummary(openOrder);
  if (mixedStatusSummary) {
    return mixedStatusSummary;
  }

  return {
    primary: { label: "Ready", tone: "success" as const },
    secondary: null,
  };
}

function getFallbackGroupStatusLabel(openOrder: OpenOrder, index: number) {
  if (openOrder.orderType === "mixed") {
    return index === 0 ? "Alterations in progress" : "Custom in progress";
  }

  return getOpenOrderOperationalLane(openOrder);
}

function getGroupedStatusLabel(openOrder: OpenOrder, index: number, label?: string) {
  const baseLabel = label ?? getFallbackGroupStatusLabel(openOrder, index);

  if (openOrder.orderType !== "mixed") {
    return baseLabel;
  }

  const condensedLabel = baseLabel
    .replace(/^Alterations\s+/i, "")
    .replace(/^Custom\s+/i, "")
    .trim();

  return condensedLabel.charAt(0).toUpperCase() + condensedLabel.slice(1);
}

function getStatusForScope(openOrder: OpenOrder, scope: OpenOrder["pickupSchedules"][number]["scope"]) {
  if (openOrder.orderType !== "mixed") {
    const statusPill = getOpenOrderStatusPills(openOrder)[0];
    return {
      label: statusPill?.label ?? getOpenOrderOperationalLane(openOrder),
      tone: statusPill?.tone ?? "default",
    };
  }

  const breakdown = getOpenOrderReadinessBreakdown(openOrder);

  if (scope === "alteration") {
    const label = breakdown.alterationPickedUp
      ? "Picked up"
      : breakdown.alterationReady
        ? "Ready"
        : "In progress";
    const tone = breakdown.alterationPickedUp || breakdown.alterationReady ? "success" as const : "default" as const;
    return { label, tone };
  }

  const label = breakdown.customPickedUp
    ? "Picked up"
    : breakdown.customReady
      ? "Ready"
      : "In progress";
  const tone = breakdown.customPickedUp || breakdown.customReady ? "success" as const : "default" as const;
  return { label, tone };
}

export function AllOrdersRow({
  openOrder,
  onRequestMarkOpenOrderPickupReady,
  onOpenOrderDetails,
  variant = "default",
}: {
  openOrder: OpenOrder;
  onRequestMarkOpenOrderPickupReady: (openOrder: OpenOrder, pickupIds: string[]) => void;
  onOpenOrderDetails: (openOrderId: number) => void;
  variant?: "default" | "ready" | "factory";
}) {
  const timeline = getOrderTimelineSummary(openOrder);
  const isFactoryVariant = variant === "factory";
  const isReadyVariant = variant === "ready";
  const pickupGroups = getOpenOrderPickupGroups(openOrder, {
    includePickedUp: openOrder.orderType === "mixed",
    scopes: isFactoryVariant ? ["custom"] : undefined,
  });
  const readyPickupSummary = getReadyPickupSummary(openOrder);
  const readyStatusSummary = getReadyStatusSummary(openOrder);
  const rowGridClassName = isReadyVariant ? READY_ORDER_ROW_GRID_CLASS : OPEN_ORDER_ROW_GRID_CLASS;
  const handleOpen = () => onOpenOrderDetails(openOrder.id);
  const handleRowKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpen();
    }
  };

  return (
    <div
      className={cx("group relative cursor-pointer pr-12 lg:pr-14", rowGridClassName)}
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleRowKeyDown}
    >
      <div className="min-w-0">
        <div className="app-text-value min-w-0">{openOrder.payerName}</div>
        <div className="app-text-caption mt-1">Order #{openOrder.id} • {formatOpenOrderCreatedAt(openOrder.createdAt)}</div>
        <div className="app-text-body-muted mt-2 font-medium">{getWorkflowSummaryLabel(openOrder.orderType)}</div>
      </div>
      {isReadyVariant ? null : (
        <div className="min-w-0">
          <div className="app-text-overline lg:hidden">{isFactoryVariant ? "Ready by" : "Order details"}</div>
          <div className="mt-1 lg:mt-0">
            {pickupGroups.map((group, index) => {
              const representativePickup = openOrder.pickupSchedules.find((pickup) => pickup.id === group.pickupIds[0]);
              const dateLabel = representativePickup
                ? getOperationalPickupDateLabel(representativePickup.pickupDate, representativePickup.pickupTime)
                : null;
              const timeLabel = representativePickup
                ? getOperationalPickupTimeLabel(representativePickup.pickupDate, representativePickup.pickupTime)
                : null;
              const location = representativePickup?.pickupLocation ?? "";
              const scopedStatus = getStatusForScope(openOrder, group.scope);
              const statusLabel = getGroupedStatusLabel(openOrder, index, scopedStatus.label);
              const statusTone = scopedStatus.tone;

              return (
                <div
                  key={group.key}
                  className={cx(
                    "grid min-w-0 gap-3 py-2.5 lg:grid-cols-[minmax(0,1fr)_6.75rem_5rem] lg:items-start",
                    index === 0 ? "pt-0" : "border-t border-[var(--app-border)]/35",
                  )}
                >
                  <div className="min-w-0">
                    <div className="mt-0 flex flex-wrap items-center gap-2">
                      <div className="app-text-body font-medium">
                        {dateLabel ?? "Date pending"}{timeLabel ? ` · ${timeLabel}` : ""}
                      </div>
                      {location ? (
                        <div className="app-text-caption inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
                          <span>{location}</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="app-text-caption mt-1">
                      {summarizeGroupedOrderItems(group.itemSummary) || timeline.items}
                    </div>
                    {openOrder.inHouseAssignee && group.scope === "alteration" ? (
                      <div className="app-text-caption mt-1">Assigned to {openOrder.inHouseAssignee.name}</div>
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="flex min-h-14 items-center justify-start">
                      <div className={getOrdersStatusTextClassName(statusTone)}>{statusLabel}</div>
                    </div>
                  </div>
                  <div className="flex min-h-14 items-center justify-end">
                    {group.actionPickupIds.length ? (
                      <ActionButton
                        tone="primary"
                        className="min-w-[4.75rem] justify-center whitespace-nowrap px-3 py-1.5 text-[0.68rem]"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRequestMarkOpenOrderPickupReady(openOrder, group.actionPickupIds);
                        }}
                      >
                        Ready
                      </ActionButton>
                    ) : (
                      <span className="app-text-caption opacity-0">No action</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {isReadyVariant ? (
        <>
          <div className="min-w-0">
            <div className="app-text-overline lg:hidden">Pickup</div>
            <div className="app-text-body mt-1 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
                <span>{readyPickupSummary.locations}</span>
              </span>
            </div>
            {readyPickupSummary.scheduleSummary ? (
              <div className="app-text-caption mt-1">{readyPickupSummary.scheduleSummary}</div>
            ) : null}
          </div>
          <div className="min-w-0">
            <div className="app-text-overline lg:hidden">Ready</div>
            <div className="mt-1 flex min-w-0 flex-col items-start gap-1.5">
              <div className="text-[0.82rem] font-semibold leading-tight text-[var(--app-success-text)]">
                {readyStatusSummary.primary.label}
              </div>
              {readyStatusSummary.secondary ? (
                <div className="app-text-caption text-left">{readyStatusSummary.secondary}</div>
              ) : null}
            </div>
          </div>
          <div className="min-w-0 text-left lg:text-right">
            <div className="app-text-overline lg:hidden">Total</div>
            <div className="pt-1 lg:pt-0">
              <div className="text-[1.375rem] font-semibold leading-none tracking-[-0.01em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
                {formatWorklistTotal(openOrder.total)}
              </div>
            </div>
            <div className="mt-1.5">
              <span className={getWorklistPaymentTextClassName(openOrder.balanceDue)}>
                {getWorklistPaymentLabel(openOrder.balanceDue)}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="min-w-0 text-left sm:text-right">
          <div className="app-text-overline lg:hidden">Total</div>
          <div className="text-[1.375rem] font-semibold leading-none tracking-[-0.01em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
            {formatWorklistTotal(openOrder.total)}
          </div>
          <div className="mt-1.5">
            <span className={getWorklistPaymentTextClassName(openOrder.balanceDue)}>
              {getWorklistPaymentLabel(openOrder.balanceDue)}
            </span>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <div className="flex h-full items-center gap-2 bg-gradient-to-l from-[var(--app-surface)] via-[var(--app-surface)]/96 to-transparent pl-5 transition group-hover:from-[var(--app-surface-muted)]/65 group-hover:via-[var(--app-surface-muted)]/50">
          <div className="h-9 w-px bg-[var(--app-border)]/55 transition group-hover:bg-[var(--app-text-soft)]/45" />
          <ChevronRight className="h-4 w-4 text-[var(--app-text-soft)] transition group-hover:text-[var(--app-text)]" />
        </div>
      </div>
    </div>
  );
}
