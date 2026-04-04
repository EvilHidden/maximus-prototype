import type { ClosedOrderHistoryItem, OpenOrder, PickupLocation } from "../types";
import { OpenOrdersBody, OpenOrdersControls, OpenOrdersHeader } from "../features/order/components/OpenOrdersPanels";
import { OpenOrdersInfoBar } from "../features/order/components/openOrders/OpenOrdersInfoBar";
import { useOpenOrdersView } from "../features/order/hooks/useOpenOrdersView";

type OpenOrdersScreenProps = {
  openOrders: OpenOrder[];
  closedOrderHistory: ClosedOrderHistoryItem[];
  pickupLocations: PickupLocation[];
  onStartOpenOrderWork: (openOrderId: number) => void;
  onMarkOpenOrderPickupReady: (openOrderId: number, pickupId: string) => void;
  onOpenOrderDetails: (openOrderId: number) => void;
  onStartNewOrder: () => void;
};

export function OpenOrdersScreen({
  openOrders,
  closedOrderHistory,
  pickupLocations,
  onStartOpenOrderWork,
  onMarkOpenOrderPickupReady,
  onOpenOrderDetails,
  onStartNewOrder,
}: OpenOrdersScreenProps) {
  const {
    activeView,
    setActiveView,
    query,
    setQuery,
    activeQueue,
    setActiveQueue,
    allOrdersTab,
    setAllOrdersTab,
    typeFilter,
    setTypeFilter,
    locationFilter,
    setLocationFilter,
    baseOpenOrders,
    queueCounts,
    filteredQueueOrders,
    filteredReadyOrders,
    filteredOperatorOrders,
    filteredFactoryOrders,
    operatorQueueCounts,
    filteredHistoryItems,
    activeSubtitle,
  } = useOpenOrdersView(openOrders, closedOrderHistory);

  return (
    <div className="space-y-4">
      <div className="space-y-5">
        <OpenOrdersHeader subtitle={activeSubtitle} onStartNewOrder={onStartNewOrder} />

        <OpenOrdersInfoBar stageCounts={operatorQueueCounts} onShowAlterationsView={() => setActiveView("operator")} />

        <OpenOrdersControls
          activeView={activeView}
          onViewChange={setActiveView}
          viewCounts={{
            queues: queueCounts.all,
            ready: queueCounts.ready_for_pickup,
            operator: filteredOperatorOrders.length,
            factory: queueCounts.factory,
            all: baseOpenOrders.length + filteredHistoryItems.length,
          }}
          query={query}
          onQueryChange={setQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          pickupLocations={pickupLocations}
          locationFilter={locationFilter}
          onLocationFilterChange={setLocationFilter}
          activeQueue={activeQueue}
          onQueueChange={setActiveQueue}
          queueCounts={queueCounts}
          allOrdersTab={allOrdersTab}
          onAllOrdersTabChange={setAllOrdersTab}
          allOrdersTabCounts={{
            active: baseOpenOrders.length,
            closed: filteredHistoryItems.length,
          }}
        />
      </div>

      <OpenOrdersBody
        activeView={activeView}
        activeQueue={activeQueue}
        allOrdersTab={allOrdersTab}
        baseOpenOrders={baseOpenOrders}
        filteredQueueOrders={filteredQueueOrders}
        filteredReadyOrders={filteredReadyOrders}
        filteredOperatorOrders={filteredOperatorOrders}
        filteredFactoryOrders={filteredFactoryOrders}
        filteredHistoryItems={filteredHistoryItems}
        onStartOpenOrderWork={onStartOpenOrderWork}
        onMarkOpenOrderPickupReady={onMarkOpenOrderPickupReady}
        onOpenOrderDetails={onOpenOrderDetails}
      />
    </div>
  );
}
