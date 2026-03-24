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
  formatSummaryCurrency,
  getOpenOrderLocationSummary,
  getOpenOrderOperationalLane,
  getOpenOrderStatusPills,
  type OrdersQueueKey,
} from "../../selectors";
import type { AllOrdersTab, OrdersView } from "../../hooks/useOpenOrdersView";
import { OperatorQueuePanel } from "./OperatorQueuePanel";
import { QueueSection } from "./OpenOrdersWorklist";

const OPEN_ORDER_ROW_GRID_CLASS =
  "grid cursor-pointer gap-3 px-4 py-3.5 lg:grid-cols-[minmax(0,1fr)_9rem_9rem_6rem_minmax(23rem,23rem)] lg:items-center";

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

function AllOrdersRow({
  openOrder,
  onOpenOrderCheckout,
}: {
  openOrder: OpenOrder;
  onOpenOrderCheckout: (openOrderId: number) => void;
}) {
  const workType = getOpenOrderOperationalLane(openOrder);
  const locations = getOpenOrderLocationSummary(openOrder);
  const statusPills = getOpenOrderStatusPills(openOrder);
  const pickupScheduleSummary = getPickupScheduleSummary(openOrder.pickupSchedules);

  return (
    <div
      className={OPEN_ORDER_ROW_GRID_CLASS}
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
          detail={openOrder.itemSummary.join(", ")}
          meta={[
            `Order #${openOrder.id}`,
            formatOpenOrderCreatedAt(openOrder.createdAt),
            pickupScheduleSummary ? `Pickup ${pickupScheduleSummary}` : "",
          ].filter(Boolean).join(" • ")}
        />
      </div>
      <div className="min-w-0">
        <div className="app-text-overline lg:hidden">Work type</div>
        <div className="app-text-body mt-1 font-medium">{workType}</div>
        {openOrder.inHouseAssignee ? (
          <div className="app-text-caption mt-1">Assigned to {openOrder.inHouseAssignee.name}</div>
        ) : null}
      </div>
      <div className="min-w-0">
        <div className="app-text-overline lg:hidden">Pickup location</div>
        <div className="app-text-body mt-1 font-medium">{locations || "Pending"}</div>
      </div>
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
            <OpenOrdersColumnHeader />
            {filteredReadyOrders.map((openOrder, index) => (
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
          pendingPickupCount={markReadyConfirmation.pickupIds.length}
          onConfirm={handleConfirmMarkReady}
          onClose={() => setMarkReadyConfirmation(null)}
        />
      ) : null}
    </div>
  );
}
