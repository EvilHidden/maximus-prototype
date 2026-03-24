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
  formatSummaryCurrency,
  getOpenOrderLocationSummary,
  getOpenOrderOperationalLane,
  getOpenOrderOperationalPhase,
  getOpenOrderTypeLabel,
  type OrdersQueueKey,
} from "../../selectors";
import type { OrdersView } from "../../hooks/useOpenOrdersView";
import { OperatorQueuePanel } from "./OperatorQueuePanel";
import { QueueSection } from "./OpenOrdersWorklist";
import { getPhaseTone } from "./meta";

function AllOrdersRow({
  openOrder,
  onOpenOrderCheckout,
}: {
  openOrder: OpenOrder;
  onOpenOrderCheckout: (openOrderId: number) => void;
}) {
  const phase = getOpenOrderOperationalPhase(openOrder);
  const workType = getOpenOrderOperationalLane(openOrder);
  const locations = getOpenOrderLocationSummary(openOrder);

  return (
    <div
      className="grid cursor-pointer gap-3 px-4 py-3.5 lg:grid-cols-[minmax(0,1.2fr)_180px_160px_140px_auto] lg:items-center"
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
        <div className="app-text-caption mt-1">{getOpenOrderTypeLabel(openOrder.orderType)} • {openOrder.itemSummary.join(", ")}</div>
      </div>
      <div className="min-w-0">
        <div className="app-text-overline">Work type</div>
        <div className="app-text-body mt-1 font-medium">{workType}</div>
        {openOrder.inHouseAssignee ? (
          <div className="app-text-caption mt-1">Assigned to {openOrder.inHouseAssignee.name}</div>
        ) : null}
      </div>
      <div className="min-w-0">
        <div className="app-text-overline">Pickup location</div>
        <div className="app-text-body mt-1 font-medium">{locations || "Pending"}</div>
      </div>
      <div className="min-w-0">
        <div className="app-text-overline">Total</div>
        <div className="app-text-strong mt-1">{formatSummaryCurrency(openOrder.total)}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <StatusPill tone={getPhaseTone(phase)}>{phase}</StatusPill>
        <PaymentStatusPill status={openOrder.paymentStatus} />
      </div>
    </div>
  );
}

export function OpenOrdersBody({
  activeView,
  activeQueue,
  baseOpenOrders,
  filteredQueueOrders,
  filteredOperatorOrders,
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
  baseOpenOrders: OpenOrder[];
  filteredQueueOrders: OpenOrder[];
  filteredOperatorOrders: OpenOrder[];
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
        baseOpenOrders.length === 0 ? (
          <EmptyState>No active orders match this search and filter set.</EmptyState>
        ) : (
          <div className="app-work-surface">
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

      {activeView === "history" ? (
        filteredHistoryItems.length === 0 ? (
          <EmptyState>No closed orders match this search.</EmptyState>
        ) : (
          <div className="app-work-surface">
            {filteredHistoryItems.map((order, index) => (
              <div
                key={order.id}
                className={cx(
                  "app-table-row grid gap-3 px-4 py-3.5 md:grid-cols-[minmax(0,1fr)_140px_120px_auto] md:items-center",
                  index > 0 && "border-t border-[var(--app-border)]/35",
                )}
              >
                <div className="min-w-0">
                  <div className="app-text-strong">{order.customerName}</div>
                  <div className="app-text-caption mt-1">{order.label}</div>
                </div>
                <div className="app-text-body font-medium">{formatClosedOrderDate(order.createdAt)}</div>
                <div className="app-text-strong">{formatClosedOrderTotal(order.total)}</div>
                <div className="flex justify-start md:justify-end">
                  <OrderStatusPill status={order.status} />
                </div>
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
