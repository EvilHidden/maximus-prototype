import { MapPin } from "lucide-react";
import { useState } from "react";
import type { ClosedOrderHistoryItem, OpenOrder, StaffMember } from "../../../../types";
import { EmptyState, StatusPill, cx } from "../../../../components/ui/primitives";
import { OrderStatusPill, PaymentStatusPill } from "../../../../components/ui/pills";
import { ConfirmMarkReadyModal } from "../../modals/ConfirmMarkReadyModal";
import {
  type OperatorQueueStageCounts,
  formatClosedOrderDate,
  formatClosedOrderTotal,
  formatOpenOrderCreatedAt,
  formatPickupSchedule,
  getOpenOrderReadinessBreakdown,
  getOperationalPickupDateLabel,
  getOperationalPickupTimeLabel,
  formatSummaryCurrency,
  getOpenOrderLocationSummary,
  getOpenOrderOperationalLane,
  getOpenOrderStatusPills,
  type OrdersQueueKey,
} from "../../selectors";
import type { AllOrdersTab, OrdersView } from "../../hooks/useOpenOrdersView";
import { OperatorQueuePanel } from "./OperatorQueuePanel";
import { formatWorklistTotal, getWorklistPaymentLabel, getWorklistPaymentTextClassName } from "./meta";
import { QueueSection } from "./OpenOrdersWorklist";

const OPEN_ORDER_ROW_GRID_CLASS =
  "grid cursor-pointer gap-3 px-4 py-3.5 lg:grid-cols-[minmax(0,1fr)_9rem_9rem_6rem_minmax(23rem,23rem)] lg:items-center";
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

function getReadyCustomerDetail(openOrder: OpenOrder) {
  const itemSummary = summarizeReadyOrderItems(openOrder.itemSummary);
  const workType = getOpenOrderOperationalLane(openOrder);

  if (!itemSummary) {
    return workType;
  }

  return `${workType} • ${itemSummary}`;
}

function getCompactPickupScheduleSummary(pickups: OpenOrder["pickupSchedules"]) {
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

function OpenOrdersColumnHeader() {
  return (
    <div className="app-table-head hidden border-b border-[var(--app-border)]/35 px-4 py-2 lg:block">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_9rem_9rem_6rem_minmax(23rem,23rem)] lg:items-center">
        <div className="app-text-overline">Customer</div>
        <div className="app-text-overline">Work type</div>
        <div className="app-text-overline">Pickup location</div>
        <div className="app-text-overline">Total</div>
        <div className="app-text-overline pl-4 text-right">Status</div>
      </div>
    </div>
  );
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
  const displayPickups = readyPickups.length ? readyPickups : openOrder.pickupSchedules;
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
    ? { label: "Alterations ready", tone: "success" as const }
    : breakdown.customReady
      ? { label: "Custom ready", tone: "success" as const }
      : null;

  if (!primary) {
    return null;
  }

  const secondary = breakdown.alterationReady
    ? breakdown.customPickedUp
      ? "Custom: Picked up"
      : breakdown.customReady
        ? "Custom: Ready"
        : "Custom: In progress"
    : breakdown.alterationPickedUp
      ? "Alterations: Picked up"
      : breakdown.alterationReady
        ? "Alterations: Ready"
        : "Alterations: In progress";

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

function AllOrdersRow({
  openOrder,
  onOpenOrderCheckout,
  variant = "default",
}: {
  openOrder: OpenOrder;
  onOpenOrderCheckout: (openOrderId: number) => void;
  variant?: "default" | "ready";
}) {
  const workType = getOpenOrderOperationalLane(openOrder);
  const locations = getOpenOrderLocationSummary(openOrder);
  const statusPills = getOpenOrderStatusPills(openOrder);
  const pickupScheduleSummary = getPickupScheduleSummary(openOrder.pickupSchedules);
  const readyPickupSummary = getReadyPickupSummary(openOrder);
  const readyStatusSummary = getReadyStatusSummary(openOrder);
  const isReadyVariant = variant === "ready";
  const rowGridClassName = isReadyVariant ? READY_ORDER_ROW_GRID_CLASS : OPEN_ORDER_ROW_GRID_CLASS;

  return (
    <div
      className={rowGridClassName}
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
      <div className="min-w-0">
        <div className="app-text-strong">{openOrder.payerName}</div>
        <OrderIdentityDetail
          detail={isReadyVariant ? getReadyCustomerDetail(openOrder) : openOrder.itemSummary.join(", ")}
          meta={[
            !isReadyVariant ? `Order #${openOrder.id}` : "",
            !isReadyVariant ? formatOpenOrderCreatedAt(openOrder.createdAt) : "",
            !isReadyVariant && pickupScheduleSummary ? `Pickup ${pickupScheduleSummary}` : "",
          ].filter(Boolean).join(" • ")}
        />
      </div>
      {isReadyVariant ? null : (
        <div className="min-w-0">
          <div className="app-text-overline lg:hidden">Work type</div>
          <div className="app-text-body mt-1 font-medium">{workType}</div>
          {openOrder.inHouseAssignee ? (
            <div className="app-text-caption mt-1">Assigned to {openOrder.inHouseAssignee.name}</div>
          ) : null}
        </div>
      )}
      <div className="min-w-0">
        <div className="app-text-overline lg:hidden">{isReadyVariant ? "Pickup" : "Pickup location"}</div>
        <div className="app-text-body mt-1 font-medium">
          {isReadyVariant ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
              <span>{readyPickupSummary.locations}</span>
            </span>
          ) : (
            locations || "Pending"
          )}
        </div>
        {isReadyVariant && readyPickupSummary.scheduleSummary ? (
          <div className="app-text-caption mt-1">{readyPickupSummary.scheduleSummary}</div>
        ) : null}
      </div>
      {isReadyVariant ? (
        <>
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
        <>
          <div className="min-w-0">
            <div className="app-text-overline lg:hidden">Total</div>
            <div className="app-text-strong mt-1">{formatSummaryCurrency(openOrder.total)}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:min-w-[23rem] lg:flex-nowrap lg:justify-end lg:pl-4">
          <div className="app-text-overline w-full lg:hidden">Status</div>
          {statusPills.map((pill) => (
            <StatusPill key={pill.label} tone={pill.tone} className="whitespace-nowrap">{pill.label}</StatusPill>
          ))}
          <div className="shrink-0">
            <PaymentStatusPill status={openOrder.paymentStatus} />
          </div>
          </div>
        </>
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
        <div className="app-table-head border-b border-[var(--app-border)]/35 px-4 py-2">
          <div className="app-text-overline">Closed orders</div>
        </div>
        <EmptyState className="rounded-none border-0 bg-transparent shadow-none">
          No closed orders match this search.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="app-work-surface">
      <div className="app-table-head border-b border-[var(--app-border)]/35 px-4 py-2">
        <div className="app-text-overline">Closed orders</div>
      </div>
      <OpenOrdersColumnHeader />
      {filteredHistoryItems.map((order, index) => (
        <div
          key={order.displayId ?? order.id}
          className={cx("app-table-row", index > 0 && "border-t border-[var(--app-border)]/35")}
        >
          <div className="grid gap-3 px-4 py-3.5 lg:grid-cols-[minmax(0,1fr)_9rem_9rem_6rem_minmax(23rem,23rem)] lg:items-center">
            <div className="min-w-0">
              <div className="app-text-strong">{order.payerName ?? order.customerName}</div>
              <OrderIdentityDetail
                detail={order.itemSummary?.join(", ") || order.label}
                meta={[
                  `Order ${order.displayId ?? order.id}`,
                  formatClosedOrderDate(order.createdAt),
                ].filter(Boolean).join(" • ")}
              />
            </div>
            <div className="min-w-0">
              <div className="app-text-overline lg:hidden">Work type</div>
              <div className="app-text-body mt-1 font-medium">
                {order.orderType === "mixed"
                  ? "Alterations and custom"
                  : order.orderType === "custom"
                    ? "Custom"
                    : "Alterations"}
              </div>
              {order.inHouseAssignee ? (
                <div className="app-text-caption mt-1">Assigned to {order.inHouseAssignee.name}</div>
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="app-text-overline lg:hidden">Pickup location</div>
              <div className="app-text-body mt-1 font-medium">
                {order.pickupSchedules?.length
                  ? [...new Set(order.pickupSchedules.map((pickup) => pickup.pickupLocation).filter(Boolean))].join(" • ")
                  : "Pending"}
              </div>
            </div>
            <div className="min-w-0">
              <div className="app-text-overline lg:hidden">Total</div>
              <div className="app-text-strong mt-1">{formatClosedOrderTotal(order.total)}</div>
            </div>
            <div className="flex items-center gap-2 lg:min-w-[23rem] lg:justify-end lg:pl-4">
              <div className="app-text-overline w-full lg:hidden">Status</div>
              <OrderStatusPill status={order.status} />
            </div>
          </div>
        </div>
      ))}
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
  onOpenOrderCheckout,
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
  onOpenOrderCheckout: (openOrderId: number) => void;
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
              <div className="app-table-head border-b border-[var(--app-border)]/35 px-4 py-2">
                <div className="app-text-overline">Active orders</div>
              </div>
              <EmptyState className="rounded-none border-0 bg-transparent shadow-none">
                No active orders match this search and filter set.
              </EmptyState>
            </div>
          ) : (
            <div className="app-work-surface">
              <div className="app-table-head px-4 py-2 lg:border-b lg:border-[var(--app-border)]/35">
                <div className="app-text-overline">Active orders</div>
              </div>
              <OpenOrdersColumnHeader />
              {baseOpenOrders.map((openOrder, index) => (
                <div
                  key={openOrder.id}
                  className={cx("app-table-row", index > 0 && "border-t border-[var(--app-border)]/35")}
                >
                  <AllOrdersRow openOrder={openOrder} onOpenOrderCheckout={onOpenOrderCheckout} />
                </div>
              ))}
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
                <AllOrdersRow openOrder={openOrder} onOpenOrderCheckout={onOpenOrderCheckout} variant="ready" />
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
          onOpenOrderCheckout={onOpenOrderCheckout}
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
          onOpenOrderCheckout={onOpenOrderCheckout}
        />
      ) : null}

      {activeView === "factory" ? (
        filteredFactoryOrders.length === 0 ? (
          <EmptyState>No factory orders match this search and filter set.</EmptyState>
        ) : (
          <div className="app-work-surface">
            <OpenOrdersColumnHeader />
            {filteredFactoryOrders.map((openOrder, index) => (
              <div
                key={openOrder.id}
                className={cx("app-table-row", index > 0 && "border-t border-[var(--app-border)]/35")}
              >
                <AllOrdersRow openOrder={openOrder} onOpenOrderCheckout={onOpenOrderCheckout} />
              </div>
            ))}
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
