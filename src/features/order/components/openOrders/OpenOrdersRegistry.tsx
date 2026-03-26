import { ClipboardList, MapPin, PackageSearch } from "lucide-react";
import { useState } from "react";
import type { ClosedOrderHistoryItem, OpenOrder, StaffMember } from "../../../../types";
import { ActionButton, EmptyState, SurfaceHeader, cx } from "../../../../components/ui/primitives";
import { ConfirmMarkReadyModal } from "../../modals/ConfirmMarkReadyModal";
import {
  type OperatorQueueStageCounts,
  formatOpenOrderCreatedAt,
  formatPickupSchedule,
  getOpenOrderPickupGroups,
  getOpenOrderReadinessBreakdown,
  getOperationalPickupDateLabel,
  getOperationalPickupTimeLabel,
  getOpenOrderLocationSummary,
  getOpenOrderOperationalLane,
  getOpenOrderStatusPills,
  getOpenOrderTypeLabel,
  type OrdersQueueKey,
} from "../../selectors";
import type { AllOrdersTab, OrdersView } from "../../hooks/useOpenOrdersView";
import { OperatorQueuePanel } from "./OperatorQueuePanel";
import { formatWorklistTotal, getWorklistPaymentLabel, getWorklistPaymentTextClassName } from "./meta";
import { QueueSection } from "./OpenOrdersWorklist";

const OPEN_ORDER_ROW_GRID_CLASS =
  "grid cursor-pointer gap-4 px-4 py-4 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,0.9fr)_minmax(16rem,0.82fr)] lg:items-start lg:gap-x-4";
const READY_ORDER_ROW_GRID_CLASS =
  "grid cursor-pointer gap-4 px-4 py-3.5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1.05fr)_minmax(9rem,0.95fr)_7.75rem] lg:items-center";

function getPickupScheduleSummary(pickups: OpenOrder["pickupSchedules"] | ClosedOrderHistoryItem["pickupSchedules"]) {
  const labels = (pickups ?? [])
    .map((pickup) => formatPickupSchedule(pickup.pickupDate, pickup.pickupTime))
    .filter((value): value is string => Boolean(value));

  return [...new Set(labels)].join(" • ");
}

function OrderIdentityDetail({
  detail,
  meta,
}: {
  detail: string;
  meta?: string;
}) {
  return (
    <>
      {detail ? <div className="app-text-caption mt-1">{detail}</div> : null}
      {meta ? <div className="app-text-caption mt-1">{meta}</div> : null}
    </>
  );
}

function summarizeOrderItems(items: string[]) {
  const uniqueItems = [...new Set(items)].filter(Boolean);
  if (uniqueItems.length <= 2) {
    return uniqueItems.join(", ");
  }

  return `${uniqueItems[0]}, ${uniqueItems[1]} +${uniqueItems.length - 2} more`;
}

function formatReadyItemLabel(item: string) {
  return item
    .replace(/^Alteration\s*-\s*/i, "")
    .replace(/^Custom garment\s*-\s*/i, "")
    .trim();
}

function summarizeReadyOrderItems(items: string[]) {
  const uniqueItems = [...new Set(items.map(formatReadyItemLabel).filter(Boolean))];
  if (uniqueItems.length <= 2) {
    return uniqueItems.join(", ");
  }

  return `${uniqueItems[0]}, ${uniqueItems[1]} +${uniqueItems.length - 2} more`;
}

function getCompactPickupScheduleSummary(pickups: OpenOrder["pickupSchedules"] | ClosedOrderHistoryItem["pickupSchedules"]) {
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

function ReadyOrdersColumnHeader() {
  return (
    <div className="app-table-head hidden border-b border-[var(--app-border)]/35 px-4 py-2 lg:block">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1.05fr)_minmax(9rem,0.95fr)_7.75rem] lg:items-center">
        <div className="app-text-overline">Customer</div>
        <div className="app-text-overline">Pickup</div>
        <div className="app-text-overline">Ready</div>
        <div className="app-text-overline text-right">Total</div>
      </div>
    </div>
  );
}

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

function getOrdersStatusTextClassName(tone: "default" | "dark" | "success" | "warn" | "danger") {
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

function getClosedOrderStatusTone(status: ClosedOrderHistoryItem["status"]) {
  if (status === "Picked up") {
    return "success" as const;
  }

  if (status === "Canceled") {
    return "danger" as const;
  }

  return "default" as const;
}

function getClosedOrderCompletedLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return formatOpenOrderCreatedAt(value);
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

function getOrderTimelineSummary(openOrder: OpenOrder) {
  return {
    schedule: getPickupScheduleSummary(openOrder.pickupSchedules) || "Pickup pending",
    location: getOpenOrderLocationSummary(openOrder) || "Pending",
    items: summarizeOrderItems(openOrder.itemSummary) || getOpenOrderOperationalLane(openOrder),
  };
}

function summarizeGroupedOrderItems(items: string[]) {
  const uniqueItems = [...new Set(items)].filter(Boolean);
  if (uniqueItems.length <= 2) {
    return uniqueItems.join(", ");
  }

  return `${uniqueItems[0]}, ${uniqueItems[1]} +${uniqueItems.length - 2} more`;
}

function getWorkflowSummaryLabel(orderType: OpenOrder["orderType"]) {
  if (orderType === "mixed") {
    return "Alteration + Custom Garment";
  }

  if (orderType === "custom") {
    return "Custom Garment";
  }

  return "Alteration";
}

function getClosedScopeLabel(scope: OpenOrder["pickupSchedules"][number]["scope"]) {
  return scope === "alteration" ? "Alteration" : "Custom Garment";
}

function OrdersSectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: typeof ClipboardList;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="px-4 py-4">
      <SurfaceHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        className="border-b border-[var(--app-border)]/45 pb-3"
        titleClassName="app-text-value"
        subtitleClassName="app-text-caption"
      />
    </div>
  );
}

function AllOrdersRow({
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

  return (
    <div
      className={rowGridClassName}
      role="button"
      tabIndex={0}
      onClick={() => onOpenOrderDetails(openOrder.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenOrderDetails(openOrder.id);
        }
      }}
    >
      <div className="min-w-0">
        <div className="app-text-strong">{openOrder.payerName}</div>
        {isReadyVariant || isFactoryVariant ? (
          <>
            <div className="app-text-caption mt-1">Order #{openOrder.id} • {formatOpenOrderCreatedAt(openOrder.createdAt)}</div>
            <div className="app-text-caption mt-2">{getWorkflowSummaryLabel(openOrder.orderType)}</div>
          </>
        ) : (
          <>
            <div className="app-text-caption mt-1">Order #{openOrder.id} • {formatOpenOrderCreatedAt(openOrder.createdAt)}</div>
            <div className="app-text-caption mt-2">{getWorkflowSummaryLabel(openOrder.orderType)}</div>
          </>
        )}
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
                  <div
                    className="flex min-h-14 items-center justify-end"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {group.actionPickupIds.length ? (
                      <ActionButton
                        tone="primary"
                        className="min-w-[4.5rem] justify-center whitespace-nowrap px-2.75 py-1.25 text-[0.68rem]"
                        onClick={() => onRequestMarkOpenOrderPickupReady(openOrder, group.actionPickupIds)}
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
    </div>
  );
}

function ClosedOrdersSection({
  filteredHistoryItems,
}: {
  filteredHistoryItems: ClosedOrderHistoryItem[];
}) {
  if (!filteredHistoryItems.length) {
    return (
      <div className="app-work-surface">
        <OrdersSectionHeader
          icon={ClipboardList}
          title="Closed orders"
          subtitle="Recent finished orders, kept here for reference."
        />
        <div className="border-t border-[var(--app-border)]/45">
          <EmptyState className="rounded-none border-0 bg-transparent shadow-none">
            No closed orders match this search.
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="app-work-surface">
      <OrdersSectionHeader
        icon={ClipboardList}
        title="Closed orders"
        subtitle="Recent finished orders, kept here for reference."
      />
      <div className="border-t border-[var(--app-border)]/45">
        {filteredHistoryItems.map((order, index) => (
          <div
            key={order.displayId ?? order.id}
            className={cx("app-table-row", index > 0 && "border-t border-[var(--app-border)]/35")}
          >
            <div
              className={cx(
                "grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,0.9fr)_minmax(16rem,0.82fr)] lg:items-start lg:gap-x-4",
              )}
            >
              <div className="min-w-0">
                <div className="app-text-strong">{order.payerName ?? order.customerName}</div>
                <div className="app-text-caption mt-1">{`Order ${order.displayId ?? order.id}`} • {formatOpenOrderCreatedAt(order.createdAt)}</div>
                <div className="app-text-caption mt-2">
                  {order.orderType ? getWorkflowSummaryLabel(order.orderType) : "Alteration"}
                </div>
              </div>
              {order.orderType === "mixed" ? (
                <div className="min-w-0 lg:col-span-2">
                  <div className="app-text-overline lg:hidden">Order details</div>
                  <div className="mt-1">
                    {order.pickupSchedules.map((pickup, pickupIndex) => (
                      <div
                        key={pickup.id}
                        className={cx(
                          "grid min-w-0 gap-3 py-2.5 lg:grid-cols-[minmax(0,0.9fr)_minmax(16rem,0.82fr)] lg:items-start",
                          pickupIndex === 0 ? "pt-0" : "border-t border-[var(--app-border)]/35",
                        )}
                      >
                        <div className="min-w-0">
                          <div className="app-text-caption">{getClosedScopeLabel(pickup.scope)}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <div className="app-text-body font-medium">
                              {formatPickupSchedule(pickup.pickupDate, pickup.pickupTime) || "Pickup pending"}
                            </div>
                            <MapPin className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
                            <span className="app-text-caption inline-flex items-center gap-1.5">
                              {pickup.pickupLocation || "Pending"}
                            </span>
                          </div>
                          <div className="app-text-caption mt-1 line-clamp-2">
                            {pickup.itemSummary.join(", ")}
                          </div>
                          {pickupIndex === 0 && order.inHouseAssignee ? (
                            <div className="app-text-caption mt-1">Assigned to {order.inHouseAssignee.name}</div>
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="mt-1 grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem] sm:items-start">
                            <div className="min-w-0">
                              <div className={getOrdersStatusTextClassName(getClosedOrderStatusTone(order.status))}>
                                Picked up
                              </div>
                              {pickup.pickedUpAt ? (
                                <div className="app-text-caption mt-1">
                                  {getClosedOrderCompletedLabel(pickup.pickedUpAt)}
                                </div>
                              ) : null}
                            </div>
                            <div className="text-left sm:text-right">
                              {pickupIndex === 0 ? (
                                <>
                                  <div className="text-[1.375rem] font-semibold leading-none tracking-[-0.01em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
                                    {formatWorklistTotal(order.total)}
                                  </div>
                                  <div className="mt-1.5">
                                    <span className={getWorklistPaymentTextClassName(order.balanceDue ?? 0)}>
                                      {getWorklistPaymentLabel(order.balanceDue ?? 0)}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <span className="app-text-caption opacity-0">Paid</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="min-w-0">
                    <div className="app-text-overline lg:hidden">Order details</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <div className="app-text-body font-medium">
                        {getCompactPickupScheduleSummary(order.pickupSchedules) || "Pickup pending"}
                      </div>
                      <MapPin className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
                      <span className="app-text-caption inline-flex items-center gap-1.5">
                        {order.pickupSchedules?.length
                          ? [...new Set(order.pickupSchedules.map((pickup) => pickup.pickupLocation).filter(Boolean))].join(" • ")
                          : "Pending"}
                      </span>
                    </div>
                    <div className="app-text-caption mt-1 line-clamp-2">
                      {order.itemSummary?.join(", ") || order.label}
                    </div>
                    {order.inHouseAssignee ? (
                      <div className="app-text-caption mt-1">Assigned to {order.inHouseAssignee.name}</div>
                    ) : null}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="app-text-overline lg:hidden">Total</div>
                    <div className="mt-1 grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem] sm:items-start">
                      <div className="min-w-0">
                        <div className={getOrdersStatusTextClassName(getClosedOrderStatusTone(order.status))}>
                          {order.status}
                        </div>
                        {order.status === "Picked up" && order.completedAt ? (
                          <div className="app-text-caption mt-1">
                            {getClosedOrderCompletedLabel(order.completedAt)}
                          </div>
                        ) : null}
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-[1.375rem] font-semibold leading-none tracking-[-0.01em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
                          {formatWorklistTotal(order.total)}
                        </div>
                        <div className="mt-1.5">
                          <span className={getWorklistPaymentTextClassName(order.balanceDue ?? 0)}>
                            {getWorklistPaymentLabel(order.balanceDue ?? 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OpenOrdersBody({
  activeView,
  activeQueue,
  allOrdersTab,
  baseOpenOrders,
  filteredQueueOrders,
  filteredReadyOrders,
  filteredOperatorOrders,
  filteredFactoryOrders,
  operatorQueueCounts,
  filteredHistoryItems,
  inHouseTailors,
  onAssignOpenOrderTailor,
  onStartOpenOrderWork,
  onMarkOpenOrderPickupReady,
  onOpenOrderDetails,
}: {
  activeView: OrdersView;
  activeQueue: OrdersQueueKey;
  allOrdersTab: AllOrdersTab;
  baseOpenOrders: OpenOrder[];
  filteredQueueOrders: OpenOrder[];
  filteredReadyOrders: OpenOrder[];
  filteredOperatorOrders: OpenOrder[];
  filteredFactoryOrders: OpenOrder[];
  operatorQueueCounts: OperatorQueueStageCounts;
  filteredHistoryItems: ClosedOrderHistoryItem[];
  inHouseTailors: StaffMember[];
  onAssignOpenOrderTailor: (openOrderId: number, staffId: string | null) => void;
  onStartOpenOrderWork: (openOrderId: number) => void;
  onMarkOpenOrderPickupReady: (openOrderId: number, pickupId: string) => void;
  onOpenOrderDetails: (openOrderId: number) => void;
}) {
  const [markReadyConfirmation, setMarkReadyConfirmation] = useState<{
    openOrder: OpenOrder;
    pickupIds: string[];
  } | null>(null);

  const handleConfirmMarkReady = () => {
    if (!markReadyConfirmation) {
      return;
    }

    markReadyConfirmation.pickupIds.forEach((pickupId) => {
      onMarkOpenOrderPickupReady(markReadyConfirmation.openOrder.id, pickupId);
    });
    setMarkReadyConfirmation(null);
  };

  return (
    <div className="pt-1">
      {activeView === "all" ? (
        allOrdersTab === "active" ? (
          baseOpenOrders.length === 0 ? (
            <div className="app-work-surface">
              <OrdersSectionHeader
                icon={ClipboardList}
                title="Open orders"
                subtitle="Every open order, with timing and status kept in one scan."
              />
              <div className="border-t border-[var(--app-border)]/45">
                <EmptyState className="rounded-none border-0 bg-transparent shadow-none">
                  No active orders match this search and filter set.
                </EmptyState>
              </div>
            </div>
          ) : (
            <div className="app-work-surface">
              <OrdersSectionHeader
                icon={ClipboardList}
                title="Open orders"
                subtitle="Every open order, with timing and status kept in one scan."
              />
              <div className="border-t border-[var(--app-border)]/45">
                {baseOpenOrders.map((openOrder, index) => (
                  <div
                    key={openOrder.id}
                    className={cx("app-table-row", index > 0 && "border-t border-[var(--app-border)]/35")}
                  >
                    <AllOrdersRow
                      openOrder={openOrder}
                      onRequestMarkOpenOrderPickupReady={(candidate, pickupIds) => setMarkReadyConfirmation({ openOrder: candidate, pickupIds })}
                      onOpenOrderDetails={onOpenOrderDetails}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          <ClosedOrdersSection filteredHistoryItems={filteredHistoryItems} />
        )
      ) : null}

      {activeView === "ready" ? (
        filteredReadyOrders.length === 0 ? (
          <EmptyState>No ready orders match this search and filter set.</EmptyState>
        ) : (
          <div className="app-work-surface">
            <ReadyOrdersColumnHeader />
            {filteredReadyOrders.map((openOrder, index) => (
              <div
                  key={openOrder.id}
                  className={cx("app-table-row", index > 0 && "border-t border-[var(--app-border)]/35")}
                >
                  <AllOrdersRow
                    openOrder={openOrder}
                    onRequestMarkOpenOrderPickupReady={(candidate, pickupIds) => setMarkReadyConfirmation({ openOrder: candidate, pickupIds })}
                    onOpenOrderDetails={onOpenOrderDetails}
                    variant="ready"
                  />
                </div>
              ))}
          </div>
        )
      ) : null}

      {activeView === "queues" ? (
        <QueueSection
          activeQueue={activeQueue}
          openOrders={filteredQueueOrders}
          onStartOpenOrderWork={onStartOpenOrderWork}
          onRequestMarkOpenOrderPickupReady={(openOrder, pickupIds) => setMarkReadyConfirmation({ openOrder, pickupIds })}
          onOpenOrderDetails={onOpenOrderDetails}
        />
      ) : null}

      {activeView === "operator" ? (
        <OperatorQueuePanel
          openOrders={filteredOperatorOrders}
          stageCounts={operatorQueueCounts}
          inHouseTailors={inHouseTailors}
          onAssignOpenOrderTailor={onAssignOpenOrderTailor}
          onStartOpenOrderWork={onStartOpenOrderWork}
          onRequestMarkOpenOrderPickupReady={(openOrder, pickupIds) => setMarkReadyConfirmation({ openOrder, pickupIds })}
          onOpenOrderDetails={onOpenOrderDetails}
        />
      ) : null}

      {activeView === "factory" ? (
        filteredFactoryOrders.length === 0 ? (
          <div className="app-work-surface">
            <OrdersSectionHeader
              icon={PackageSearch}
              title="Custom garments"
              subtitle="Custom orders that still need production or pickup follow-through."
            />
            <div className="border-t border-[var(--app-border)]/45">
              <EmptyState className="rounded-none border-0 bg-transparent shadow-none">
                No custom garment orders match this search and filter set.
              </EmptyState>
            </div>
          </div>
        ) : (
          <div className="app-work-surface">
            <OrdersSectionHeader
              icon={PackageSearch}
              title="Custom garments"
              subtitle="Custom orders that still need production or pickup follow-through."
            />
            <div className="border-t border-[var(--app-border)]/45">
              {filteredFactoryOrders.map((openOrder, index) => (
                <div
                  key={openOrder.id}
                  className={cx("app-table-row", index > 0 && "border-t border-[var(--app-border)]/35")}
                >
                  <AllOrdersRow
                    openOrder={openOrder}
                    onRequestMarkOpenOrderPickupReady={(candidate, pickupIds) => setMarkReadyConfirmation({ openOrder: candidate, pickupIds })}
                    onOpenOrderDetails={onOpenOrderDetails}
                    variant="factory"
                  />
                </div>
              ))}
            </div>
          </div>
        )
      ) : null}

      {markReadyConfirmation ? (
        <ConfirmMarkReadyModal
          openOrder={markReadyConfirmation.openOrder}
          pickupIds={markReadyConfirmation.pickupIds}
          onConfirm={handleConfirmMarkReady}
          onClose={() => setMarkReadyConfirmation(null)}
        />
      ) : null}
    </div>
  );
}
