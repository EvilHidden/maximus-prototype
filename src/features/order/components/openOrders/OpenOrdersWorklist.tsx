import { MapPin, PackageSearch, type LucideIcon } from "lucide-react";
import type { OpenOrder } from "../../../../types";
import {
  ActionButton,
  EmptyState,
  SurfaceHeader,
  cx,
} from "../../../../components/ui/primitives";
import {
  getNeedsAttentionPickupGroups,
  getNeedsAttentionGroupState,
  formatOpenOrderCreatedAt,
  getOperationalPickupDateLabel,
  getOperationalPickupTimeLabel,
  type OrdersQueueKey,
} from "../../selectors";
import { formatWorklistTotal, getPhaseTone, getWorklistPaymentLabel, getWorklistPaymentTextClassName, getWorklistPhaseLabel, queueMeta, queueOverviewMeta } from "./meta";
import { OrderDetailsLink } from "./OrderDetailsLink";

function getWorkflowSummaryLabel(orderType: OpenOrder["orderType"]) {
  if (orderType === "mixed") {
    return "Alteration + Custom Garment";
  }

  if (orderType === "custom") {
    return "Custom Garment";
  }

  return "Alteration";
}

function getWorklistStatusTextClassName(tone: "default" | "dark" | "success" | "warn" | "danger") {
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

function OpenSectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <SurfaceHeader
      icon={Icon}
      title={title}
      subtitle={subtitle}
      className="border-b border-[var(--app-border)]/45 pb-3"
      titleClassName="app-text-value"
      subtitleClassName="app-text-caption"
    />
  );
}

function WorkQueueOrderRow({
  openOrder,
  onStartOpenOrderWork,
  onRequestMarkOpenOrderPickupReady,
  onOpenOrderDetails,
}: {
  openOrder: OpenOrder;
  onStartOpenOrderWork: (openOrderId: number) => void;
  onRequestMarkOpenOrderPickupReady: (openOrder: OpenOrder, pickupIds: string[]) => void;
  onOpenOrderDetails: (openOrderId: number) => void;
}) {
  const pickupGroups = getNeedsAttentionPickupGroups(openOrder);

  const getGroupedItemSummary = (items: string[]) => {
    const uniqueItems = [...new Set(items)];
    if (uniqueItems.length <= 2) {
      return uniqueItems.join(", ");
    }

    return `${uniqueItems[0]}, ${uniqueItems[1]} +${uniqueItems.length - 2} more`;
  };

  return (
    <div className="px-4 py-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1fr)_8.75rem] lg:items-start lg:gap-x-5">
        <div className="min-w-0">
          <div className="app-text-value min-w-0">{openOrder.payerName}</div>
          <div className="app-text-caption mt-1">Order #{openOrder.id} • {formatOpenOrderCreatedAt(openOrder.createdAt)}</div>
          <div className="app-text-body-muted mt-2 font-medium">{getWorkflowSummaryLabel(openOrder.orderType)}</div>
          <div className="mt-2">
            <OrderDetailsLink onClick={() => onOpenOrderDetails(openOrder.id)} />
          </div>
        </div>

        <div className="min-w-0">
          <div className="app-text-overline lg:hidden">Ready by</div>
          <div className="mt-1 lg:mt-0">
            {pickupGroups.map((group, index) => {
              const uniqueItems = [...new Set(group.itemSummary)];
              const representativePickup = openOrder.pickupSchedules.find((pickup) => pickup.id === group.pickupIds[0]);
              const dateLabel = representativePickup
                ? getOperationalPickupDateLabel(representativePickup.pickupDate, representativePickup.pickupTime)
                : null;
              const timeLabel = representativePickup
                ? getOperationalPickupTimeLabel(representativePickup.pickupDate, representativePickup.pickupTime)
                : null;
              const location = representativePickup?.pickupLocation ?? "";
              const groupState = getNeedsAttentionGroupState(openOrder, group);

              return (
                <div
                  key={group.key}
                  className={cx(
                    "grid min-w-0 gap-3 py-2.5 lg:grid-cols-[minmax(0,1fr)_6.75rem_5rem] lg:items-center",
                    index === 0 ? "pt-0" : "",
                  )}
                >
                  <div className={cx("min-w-0", index > 0 && "border-t border-[var(--app-border)]/35 pt-2.5")}>
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
                      {getGroupedItemSummary(uniqueItems)}
                    </div>
                  </div>
                  <div className={cx("min-w-0", index > 0 && "pt-2.5")}>
                    {groupState ? (
                      <div className="flex min-h-14 items-center justify-start">
                        <div className={getWorklistStatusTextClassName(groupState.tone)}>{groupState.label}</div>
                      </div>
                    ) : null}
                  </div>
                  <div
                    className={cx("flex min-h-14 items-center justify-end", index > 0 && "pt-2.5")}
                  >
                    {groupState.actionKind === "start_work" ? (
                      index === 0 ? (
                        <ActionButton
                          tone="primary"
                          className="min-w-[4.75rem] justify-center whitespace-nowrap px-3 py-1.5 text-[0.68rem]"
                          disabled={groupState.actionDisabled}
                          onClick={() => onStartOpenOrderWork(openOrder.id)}
                        >
                          Start work
                        </ActionButton>
                      ) : (
                        <span className="app-text-caption opacity-0">No action</span>
                      )
                    ) : groupState.actionKind === "mark_ready" ? (
                      <ActionButton
                        tone="primary"
                        className="min-w-[4.75rem] justify-center whitespace-nowrap px-3 py-1.5 text-[0.68rem]"
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

        <div className="min-w-0 text-left sm:text-right lg:min-w-[7.5rem]">
          <div className="text-[1.375rem] font-semibold leading-none tracking-[-0.01em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
            {formatWorklistTotal(openOrder.total)}
          </div>
          <div className="mt-1.5">
            <span className={getWorklistPaymentTextClassName(openOrder.balanceDue)}>{getWorklistPaymentLabel(openOrder.balanceDue)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QueueSection({
  activeQueue,
  openOrders,
  onStartOpenOrderWork,
  onRequestMarkOpenOrderPickupReady,
  onOpenOrderDetails,
}: {
  activeQueue: OrdersQueueKey;
  openOrders: OpenOrder[];
  onStartOpenOrderWork: (openOrderId: number) => void;
  onRequestMarkOpenOrderPickupReady: (openOrder: OpenOrder, pickupIds: string[]) => void;
  onOpenOrderDetails: (openOrderId: number) => void;
}) {
  const count = openOrders.length;

  if (!count) {
    return (
      <div className="app-work-surface">
        <div className="px-4 py-4">
          <OpenSectionHeader
            icon={PackageSearch}
            title={queueMeta.find((queue) => queue.key === activeQueue)?.label ?? "Queue"}
            subtitle={
              activeQueue === "all"
                ? "Active orders that need attention."
                : queueOverviewMeta.find((queue) => queue.key === activeQueue)?.subtitle ?? "Orders in this view."
            }
          />
        </div>
        <div className="border-t border-[var(--app-border)]/45">
          <EmptyState className="rounded-none border-0 bg-transparent shadow-none">
            <div className="app-text-body">Nothing matches this queue and filter combination.</div>
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="app-work-surface">
      <div className="px-4 py-4">
        <OpenSectionHeader
          icon={PackageSearch}
          title={queueMeta.find((queue) => queue.key === activeQueue)?.label ?? "Queue"}
          subtitle={
            activeQueue === "all"
              ? "Active orders that need attention."
              : queueOverviewMeta.find((queue) => queue.key === activeQueue)?.subtitle ?? "Orders in this view."
          }
        />
      </div>
      <div className="border-t border-[var(--app-border)]/45">
        <div>
          <div className="app-table-head border-b border-[var(--app-border)]/35 px-4 py-2">
            <div className="app-text-overline">Active orders</div>
          </div>
          {openOrders.map((openOrder, index) => (
            <div
              key={openOrder.id}
              className={cx("app-table-row", index > 0 && "border-t border-[var(--app-border)]/35")}
            >
              <WorkQueueOrderRow
                openOrder={openOrder}
                onStartOpenOrderWork={onStartOpenOrderWork}
                onRequestMarkOpenOrderPickupReady={onRequestMarkOpenOrderPickupReady}
                onOpenOrderDetails={onOpenOrderDetails}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
