import type { Appointment, ClosedOrderHistoryItem, OpenOrder } from "../../../../types";
import { EmptyState, StatusPill, cx } from "../../../../components/ui/primitives";
import { OrderStatusPill, PaymentStatusPill } from "../../../../components/ui/pills";
import {
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
  const lane = getOpenOrderOperationalLane(openOrder);
  const locations = getOpenOrderLocationSummary(openOrder);
  const hasCollectibleBalance = openOrder.balanceDue > 0;
  const allPickupScopesReady = openOrder.pickupSchedules.length > 0 && openOrder.pickupSchedules.every((pickup) => pickup.readyForPickup);
  const rowIsActionable = hasCollectibleBalance || openOrder.paymentStatus === "pending" || allPickupScopesReady;

  return (
    <div
      className={cx("grid gap-3 px-4 py-3.5 lg:grid-cols-[minmax(0,1.2fr)_180px_160px_140px_auto] lg:items-center", rowIsActionable && "cursor-pointer")}
      role={rowIsActionable ? "button" : undefined}
      tabIndex={rowIsActionable ? 0 : undefined}
      onClick={rowIsActionable ? () => onOpenOrderCheckout(openOrder.id) : undefined}
      onKeyDown={rowIsActionable ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenOrderCheckout(openOrder.id);
        }
      } : undefined}
    >
      <div className="min-w-0">
        <div className="app-text-strong">{openOrder.payerName}</div>
        <div className="app-text-caption mt-1">{getOpenOrderTypeLabel(openOrder.orderType)} • {openOrder.itemSummary.join(", ")}</div>
      </div>
      <div className="min-w-0">
        <div className="app-text-overline">Lane</div>
        <div className="app-text-body mt-1 font-medium">{lane}</div>
      </div>
      <div className="min-w-0">
        <div className="app-text-overline">Pickup</div>
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
  filteredQueuePickups,
  filteredHistoryItems,
  onMarkOpenOrderPickupReady,
  onOpenOrderCheckout,
}: {
  activeView: OrdersView;
  activeQueue: OrdersQueueKey;
  baseOpenOrders: OpenOrder[];
  filteredQueueOrders: OpenOrder[];
  filteredQueuePickups: Appointment[];
  filteredHistoryItems: ClosedOrderHistoryItem[];
  onMarkOpenOrderPickupReady: (openOrderId: number, pickupId: string) => void;
  onOpenOrderCheckout: (openOrderId: number) => void;
}) {
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
          pickupAppointments={filteredQueuePickups}
          onMarkOpenOrderPickupReady={onMarkOpenOrderPickupReady}
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
    </div>
  );
}
