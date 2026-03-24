import { MapPin, PackageSearch, type LucideIcon } from "lucide-react";
import type { OpenOrder } from "../../../../types";
import {
  ActionButton,
  EmptyState,
  StatusPill,
  SurfaceHeader,
  cx,
} from "../../../../components/ui/primitives";
import {
  getOpenOrderOperationalPhase,
  getOpenOrderTypeLabel,
  formatOpenOrderCreatedAt,
  getOperationalPickupDateLabel,
  getOperationalPickupTimeLabel,
  getPickupAlertState,
  getPickupStatusSummary,
  type OrdersQueueKey,
} from "../../selectors";
import { formatWorklistTotal, getPhaseTone, getWorklistPaymentLabel, getWorklistPaymentTextClassName, getWorklistPhaseLabel, queueMeta, queueOverviewMeta } from "./meta";

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
  onMarkOpenOrderPickupReady,
  onOpenOrderCheckout,
}: {
  openOrder: OpenOrder;
  onStartOpenOrderWork: (openOrderId: number) => void;
  onMarkOpenOrderPickupReady: (openOrderId: number, pickupId: string) => void;
  onOpenOrderCheckout: (openOrderId: number) => void;
}) {
  const phase = getOpenOrderOperationalPhase(openOrder);
  const inHousePickups = openOrder.pickupSchedules.filter((pickup) => pickup.scope === "alteration");
  const pendingInHousePickupIds = inHousePickups.filter((pickup) => !pickup.readyForPickup).map((pickup) => pickup.id);
  const canManageInHouseWork = inHousePickups.length > 0;
  const canStartWork = canManageInHouseWork && openOrder.operationalStatus === "accepted";
  const canMarkReady = canManageInHouseWork && !canStartWork && pendingInHousePickupIds.length > 0;
  const pickupGroups = openOrder.pickupSchedules.reduce<Array<{
    key: string;
    summary: string;
    alertLabel: string;
    items: string[];
  }>>((groups, pickup) => {
    const pickupAlert = getPickupAlertState(pickup.pickupDate, pickup.pickupTime, pickup.readyForPickup);
    const pickupSummary = getPickupStatusSummary(pickup);
    const key = `${pickupSummary}__${pickupAlert.label}`;
    const existingGroup = groups.find((group) => group.key === key);

    if (existingGroup) {
      existingGroup.items.push(...pickup.itemSummary);
      return groups;
    }

    groups.push({
      key,
      summary: pickupSummary,
      alertLabel: pickupAlert.label,
      items: [...pickup.itemSummary],
    });

    return groups;
  }, []);

  const getGroupedItemSummary = (items: string[]) => {
    const uniqueItems = [...new Set(items)];
    if (uniqueItems.length <= 2) {
      return uniqueItems.join(", ");
    }

    return `${uniqueItems[0]}, ${uniqueItems[1]} +${uniqueItems.length - 2} more`;
  };

  return (
    <div
      className="cursor-pointer px-4 py-4"
      role="button"
      tabIndex={0}
      onClick={() => onOpenOrderCheckout(openOrder.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenOrderCheckout(openOrder.id);
        }
      }}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)_160px_180px] lg:items-start">
        <div className="min-w-0">
          <div className="app-text-value">{openOrder.payerName}</div>
          <div className="app-text-caption mt-1">{getOpenOrderTypeLabel(openOrder.orderType)} • {formatOpenOrderCreatedAt(openOrder.createdAt)}</div>
        </div>

        <div className="min-w-0 space-y-3">
          {pickupGroups.map((group) => {
            const uniqueItems = [...new Set(group.items)];
            const representativePickup = openOrder.pickupSchedules.find((pickup) => {
              const pickupAlert = getPickupAlertState(pickup.pickupDate, pickup.pickupTime, pickup.readyForPickup);
              const pickupSummary = getPickupStatusSummary(pickup);
              return `${pickupSummary}__${pickupAlert.label}` === group.key;
            });
            const dateLabel = representativePickup
              ? getOperationalPickupDateLabel(representativePickup.pickupDate, representativePickup.pickupTime)
              : null;
            const timeLabel = representativePickup
              ? getOperationalPickupTimeLabel(representativePickup.pickupDate, representativePickup.pickupTime)
              : null;
            const location = representativePickup?.pickupLocation ?? "";

            return (
              <div
                key={group.key}
                className="min-w-0"
              >
                <div className="min-w-0">
                  <div className="app-text-overline">Ready by</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
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
              </div>
            );
          })}
        </div>

        <div className="flex items-start lg:justify-center" onClick={(event) => event.stopPropagation()}>
          {canStartWork ? (
            <ActionButton
              tone="primary"
              className="w-full px-3 py-2 text-xs lg:w-auto"
              disabled={!openOrder.inHouseAssignee}
              onClick={() => onStartOpenOrderWork(openOrder.id)}
            >
              Start work
            </ActionButton>
          ) : null}
          {canMarkReady ? (
            <ActionButton
              tone="primary"
              className="w-full px-3 py-2 text-xs lg:w-auto"
              onClick={() => {
                pendingInHousePickupIds.forEach((pickupId) => onMarkOpenOrderPickupReady(openOrder.id, pickupId));
              }}
            >
              {pendingInHousePickupIds.length > 1 ? `Mark ${pendingInHousePickupIds.length} ready` : "Mark ready"}
            </ActionButton>
          ) : null}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3 lg:flex-col lg:items-end lg:text-right">
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <StatusPill tone={getPhaseTone(phase)}>{getWorklistPhaseLabel(phase)}</StatusPill>
          </div>
          <div>
            <div className="text-[1.375rem] font-semibold leading-none tracking-[-0.01em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
              {formatWorklistTotal(openOrder.total)}
            </div>
            <div className="mt-1.5">
              <span className={getWorklistPaymentTextClassName(openOrder.balanceDue)}>{getWorklistPaymentLabel(openOrder.balanceDue)}</span>
            </div>
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
  onMarkOpenOrderPickupReady,
  onOpenOrderCheckout,
}: {
  activeQueue: OrdersQueueKey;
  openOrders: OpenOrder[];
  onStartOpenOrderWork: (openOrderId: number) => void;
  onMarkOpenOrderPickupReady: (openOrderId: number, pickupId: string) => void;
  onOpenOrderCheckout: (openOrderId: number) => void;
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
                onMarkOpenOrderPickupReady={onMarkOpenOrderPickupReady}
                onOpenOrderCheckout={onOpenOrderCheckout}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
