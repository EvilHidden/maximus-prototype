import { MapPin } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { OpenOrder } from "../../../../types";
import { ActionButton, RowChevronAffordance, cx } from "../../../../components/ui/primitives";
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
      className={cx("group relative cursor-pointer pr-12 min-[1000px]:pr-14", rowGridClassName)}
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleRowKeyDown}
    >
      <div className="space-y-3 min-[1000px]:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="app-text-value min-w-0">{openOrder.payerName}</div>
            <div className="app-text-caption mt-1">Order #{openOrder.id} • {formatOpenOrderCreatedAt(openOrder.createdAt)}</div>
            <div className="app-text-body-muted mt-1.5 font-medium">{getWorkflowSummaryLabel(openOrder.orderType)}</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[1.125rem] font-semibold leading-none tracking-[-0.01em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
              {formatWorklistTotal(openOrder.total)}
            </div>
            <div className="mt-1">
              <span className={getWorklistPaymentTextClassName(openOrder.balanceDue)}>
                {getWorklistPaymentLabel(openOrder.balanceDue)}
              </span>
            </div>
          </div>
        </div>

        {isReadyVariant ? (
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2.5 border-t border-[var(--app-border)]/35 pt-3">
            <div className="min-w-0">
              <div className="app-text-body font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
                  <span>{readyPickupSummary.locations}</span>
                </span>
              </div>
              {readyPickupSummary.scheduleSummary ? (
                <div className="app-text-caption mt-1.5">{readyPickupSummary.scheduleSummary}</div>
              ) : null}
            </div>
            <div className="min-w-[5.25rem] text-right">
              <div className="text-[0.8rem] font-semibold leading-tight text-[var(--app-success-text)]">
                {readyStatusSummary.primary.label}
              </div>
              {readyStatusSummary.secondary ? (
                <div className="app-text-caption mt-1">{readyStatusSummary.secondary}</div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="hidden min-[1000px]:contents">
        <div className="min-w-0">
          <div className="app-text-value min-w-0">{openOrder.payerName}</div>
          <div className="app-text-caption mt-1">Order #{openOrder.id} • {formatOpenOrderCreatedAt(openOrder.createdAt)}</div>
          <div className="app-text-body-muted mt-2 font-medium">{getWorkflowSummaryLabel(openOrder.orderType)}</div>
        </div>
        {isReadyVariant ? null : (
          <>
          <div className="min-w-0">
            <div className="app-text-overline min-[1000px]:hidden">Ready by</div>
            <div className="mt-1 min-[1000px]:mt-0">
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
                    "min-w-0 py-2.5",
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
                </div>
              );
            })}
            </div>
          </div>
          <div className="min-w-0">
            <div className="app-text-overline min-[1000px]:hidden">Status</div>
            <div className="mt-1 min-[1000px]:mt-0">
              {pickupGroups.map((group, index) => {
                const scopedStatus = getStatusForScope(openOrder, group.scope);
                const statusLabel = getGroupedStatusLabel(openOrder, index, scopedStatus.label);
                const statusTone = scopedStatus.tone;

                return (
                  <div
                    key={`${group.key}-status`}
                    className={cx(
                      "flex min-h-14 flex-col items-start justify-center py-2.5",
                      index === 0 ? "pt-0" : "border-t border-[var(--app-border)]/35",
                    )}
                  >
                    <div className={getOrdersStatusTextClassName(statusTone)}>{statusLabel}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="min-w-0">
            <div className="mt-1 min-[1000px]:mt-0">
              {pickupGroups.map((group, index) => (
                <div
                  key={`${group.key}-action`}
                  className={cx(
                    "flex min-h-14 items-center justify-start py-2.5",
                    index === 0 ? "pt-0" : "border-t border-[var(--app-border)]/35",
                  )}
                >
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
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          </>
        )}
        {isReadyVariant ? (
          <>
          <div className="min-w-0">
            <div className="app-text-overline min-[1000px]:hidden">Ready by</div>
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
            <div className="app-text-overline min-[1000px]:hidden">Status</div>
            <div className="mt-1 flex min-w-0 flex-col items-start gap-1.5">
              <div className="text-[0.82rem] font-semibold leading-tight text-[var(--app-success-text)]">
                {readyStatusSummary.primary.label}
              </div>
              {readyStatusSummary.secondary ? (
                <div className="app-text-caption text-left">{readyStatusSummary.secondary}</div>
              ) : null}
            </div>
          </div>
          <div className="min-w-0" />
          <div className="min-w-0 text-left min-[1000px]:text-right">
            <div className="app-text-overline min-[1000px]:hidden">Total</div>
            <div className="pt-1 min-[1000px]:pt-0">
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
          <div className="min-w-0 text-left md:text-right">
          <div className="app-text-overline min-[1000px]:hidden">Total</div>
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
      </div>
      <RowChevronAffordance />
    </div>
  );
}
