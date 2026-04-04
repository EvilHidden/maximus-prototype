import { ClipboardList, PackageSearch } from "lucide-react";
import { useState } from "react";
import type { ClosedOrderHistoryItem, OpenOrder } from "../../../../types";
import { EmptyState } from "../../../../components/ui/primitives";
import { ConfirmMarkReadyModal } from "../../modals/ConfirmMarkReadyModal";
import type { OrdersQueueKey } from "../../selectors";
import type { AllOrdersTab, OrdersView } from "../../hooks/useOpenOrdersView";
import { OperatorQueuePanel } from "./OperatorQueuePanel";
import { QueueSection } from "./OpenOrdersWorklist";
import { AllOrdersRow } from "./AllOrdersRow";
import { ClosedOrdersSection } from "./ClosedOrdersSection";
import {
  OpenOrdersColumnHeader,
  OrdersSectionHeader,
  ReadyOrdersColumnHeader,
  openOrdersSectionClassName,
} from "./openOrdersLayout";

export function OpenOrdersBody({
  activeView,
  activeQueue,
  allOrdersTab,
  baseOpenOrders,
  filteredQueueOrders,
  filteredReadyOrders,
  filteredOperatorOrders,
  filteredFactoryOrders,
  filteredHistoryItems,
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
  filteredHistoryItems: ClosedOrderHistoryItem[];
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
    <div className="pt-1 app-open-orders-results">
      {activeView === "all" ? (
        allOrdersTab === "active" ? (
          baseOpenOrders.length === 0 ? (
            <div className="app-work-surface">
              <OrdersSectionHeader
                icon={ClipboardList}
                title="All active orders"
                subtitle="Scan every active order in one place."
              />
              <div className="border-t border-[var(--app-border)]/45">
                <OpenOrdersColumnHeader />
                <EmptyState className="rounded-none border-0 bg-transparent shadow-none">
                  No active orders match this search and filter set.
                </EmptyState>
              </div>
            </div>
          ) : (
            <div className="app-work-surface">
              <OrdersSectionHeader
                icon={ClipboardList}
                title="All active orders"
                subtitle="Scan every active order in one place."
              />
              <div className="border-t border-[var(--app-border)]/45">
                <OpenOrdersColumnHeader />
                {baseOpenOrders.map((openOrder, index) => (
                  <div
                    key={openOrder.id}
                    className={openOrdersSectionClassName(index > 0)}
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
            <OrdersSectionHeader
              icon={ClipboardList}
              title="Ready"
              subtitle="Orders with at least one pickup ready to hand off."
            />
            <ReadyOrdersColumnHeader />
            {filteredReadyOrders.map((openOrder, index) => (
              <div
                key={openOrder.id}
                className={openOrdersSectionClassName(index > 0)}
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
                subtitle="Custom work that still needs production or pickup follow-through."
              />
            <div className="border-t border-[var(--app-border)]/45">
              <OpenOrdersColumnHeader />
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
                subtitle="Custom work that still needs production or pickup follow-through."
              />
            <div className="border-t border-[var(--app-border)]/45">
              <OpenOrdersColumnHeader />
              {filteredFactoryOrders.map((openOrder, index) => (
                <div
                  key={openOrder.id}
                  className={openOrdersSectionClassName(index > 0)}
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
