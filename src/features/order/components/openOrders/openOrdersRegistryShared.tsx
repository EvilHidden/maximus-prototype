import { ClipboardList, MapPin, type LucideIcon } from "lucide-react";
import type { ClosedOrderHistoryItem, OpenOrder } from "../../../../types";
import { EmptyState, SurfaceHeader, cx } from "../../../../components/ui/primitives";
import {
  formatOpenOrderCreatedAt,
  formatPickupSchedule,
  getOpenOrderLocationSummary,
  getOpenOrderOperationalLane,
  getOpenOrderReadinessBreakdown,
  getOperationalPickupDateLabel,
  getOperationalPickupTimeLabel,
} from "../../selectors";
import { formatWorklistTotal, getWorklistPaymentLabel, getWorklistPaymentTextClassName } from "./meta";

export const OPEN_ORDER_ROW_GRID_CLASS =
  "grid gap-4 px-4 py-4 min-[1000px]:grid-cols-[minmax(0,0.78fr)_minmax(0,0.92fr)_7.25rem_5.5rem_7.75rem] min-[1000px]:items-start min-[1000px]:gap-x-4";
export const READY_ORDER_ROW_GRID_CLASS =
  "grid gap-4 px-4 py-3.5 min-[1000px]:grid-cols-[minmax(0,1.2fr)_minmax(0,1.05fr)_7.25rem_5.5rem_7.75rem] min-[1000px]:items-start min-[1000px]:gap-x-4";

export function getPickupScheduleSummary(pickups: OpenOrder["pickupSchedules"] | ClosedOrderHistoryItem["pickupSchedules"]) {
  const labels = (pickups ?? [])
    .map((pickup) => formatPickupSchedule(pickup.pickupDate, pickup.pickupTime))
    .filter((value): value is string => Boolean(value));

  return [...new Set(labels)].join(" • ");
}

export function summarizeOrderItems(items: string[]) {
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
    items: summarizeOrderItems(openOrder.itemSummary) || getOpenOrderOperationalLane(openOrder),
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

export function getClosedScopeLabel(scope: OpenOrder["pickupSchedules"][number]["scope"]) {
  return scope === "alteration" ? "Alteration" : "Custom Garment";
}

export function OrdersSectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="px-4 py-4">
      <SurfaceHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        className="pb-3"
        titleClassName="app-text-value"
        subtitleClassName="app-text-caption"
      />
    </div>
  );
}

export function ReadyOrdersColumnHeader() {
  return (
    <div className="app-table-head hidden border-b border-[var(--app-border)]/35 px-4 py-2 pr-14 min-[1000px]:block">
      <div className="grid gap-4 min-[1000px]:grid-cols-[minmax(0,1.2fr)_minmax(0,1.05fr)_7.25rem_5.5rem_7.75rem] min-[1000px]:items-start min-[1000px]:gap-x-4">
        <div className="app-text-overline">Customer</div>
        <div className="app-text-overline">Ready by</div>
        <div className="app-text-overline">Status</div>
        <div aria-hidden="true" />
        <div className="app-text-overline text-right">Total</div>
      </div>
    </div>
  );
}

export function OpenOrdersColumnHeader() {
  return (
    <div className="app-table-head hidden border-b border-[var(--app-border)]/35 px-4 py-2 pr-14 min-[1000px]:block">
      <div className="grid gap-4 min-[1000px]:grid-cols-[minmax(0,0.78fr)_minmax(0,0.92fr)_7.25rem_5.5rem_7.75rem] min-[1000px]:items-start min-[1000px]:gap-x-4">
        <div className="app-text-overline">Customer</div>
        <div className="app-text-overline">Ready by</div>
        <div className="app-text-overline">Status</div>
        <div aria-hidden="true" />
        <div className="app-text-overline text-right">Total</div>
      </div>
    </div>
  );
}

export function getOrdersStatusTextClassName(tone: "default" | "dark" | "success" | "warn" | "danger") {
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
    return "success" as const;
  }

  if (status === "Canceled") {
    return "danger" as const;
  }

  return "default" as const;
}

export function getClosedOrderCompletedLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return formatOpenOrderCreatedAt(value);
}

export function MixedClosedOrderRows({ order }: { order: ClosedOrderHistoryItem }) {
  return (
    <div className="min-w-0 min-[1000px]:col-span-2">
      <div className="app-text-overline min-[1000px]:hidden">Order details</div>
      <div className="mt-1">
        {order.pickupSchedules.map((pickup, pickupIndex) => (
          <div
            key={pickup.id}
            className={cx(
              "grid min-w-0 gap-3 py-2.5 min-[1000px]:grid-cols-[minmax(0,0.9fr)_minmax(16rem,0.82fr)] min-[1000px]:items-start",
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
              <div className="mt-1 grid gap-3 md:grid-cols-[minmax(0,1fr)_7rem] md:items-start">
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
                <div className="text-left md:text-right">
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
  );
}

export function SingleClosedOrderRow({ order }: { order: ClosedOrderHistoryItem }) {
  return (
    <>
      <div className="min-w-0">
        <div className="app-text-overline min-[1000px]:hidden">Order details</div>
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
        <div className="app-text-overline min-[1000px]:hidden">Total</div>
        <div className="mt-1 grid gap-3 md:grid-cols-[minmax(0,1fr)_7rem] md:items-start">
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
          <div className="text-left md:text-right">
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
  );
}
