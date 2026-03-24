import type { ClosedOrderHistoryItem, OpenOrder, PickupLocation, StaffMember } from "../types";
import { OpenOrdersBody, OpenOrdersControls, OpenOrdersHeader } from "../features/order/components/OpenOrdersPanels";
import { useOpenOrdersView } from "../features/order/hooks/useOpenOrdersView";

type OpenOrdersScreenProps = {
  openOrders: OpenOrder[];
  closedOrderHistory: ClosedOrderHistoryItem[];
  pickupLocations: PickupLocation[];
  inHouseTailors: StaffMember[];
  onAssignOpenOrderTailor: (openOrderId: number, staffId: string | null) => void;
  onStartOpenOrderWork: (openOrderId: number) => void;
  onMarkOpenOrderPickupReady: (openOrderId: number, pickupId: string) => void;
  onOpenOrderCheckout: (openOrderId: number) => void;
  onStartNewOrder: () => void;
};

export function OpenOrdersScreen({
  openOrders,
  closedOrderHistory,
  pickupLocations,
  inHouseTailors,
  onAssignOpenOrderTailor,
  onStartOpenOrderWork,
  onMarkOpenOrderPickupReady,
  onOpenOrderCheckout,
  onStartNewOrder,
}: OpenOrdersScreenProps) {
  const {
    activeView,
    setActiveView,
    query,
    setQuery,
    activeQueue,
    setActiveQueue,
    typeFilter,
    setTypeFilter,
    locationFilter,
    setLocationFilter,
    assigneeFilter,
    setAssigneeFilter,
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
          inHouseTailors={inHouseTailors}
          assigneeFilter={assigneeFilter}
          onAssigneeFilterChange={setAssigneeFilter}
          pickupLocations={pickupLocations}
          locationFilter={locationFilter}
          onLocationFilterChange={setLocationFilter}
          activeQueue={activeQueue}
          onQueueChange={setActiveQueue}
          queueCounts={queueCounts}
        />
      </div>

      <OpenOrdersBody
        activeView={activeView}
        activeQueue={activeQueue}
        baseOpenOrders={baseOpenOrders}
        filteredQueueOrders={filteredQueueOrders}
        filteredReadyOrders={filteredReadyOrders}
        filteredOperatorOrders={filteredOperatorOrders}
        filteredFactoryOrders={filteredFactoryOrders}
        operatorQueueCounts={operatorQueueCounts}
        filteredHistoryItems={filteredHistoryItems}
        inHouseTailors={inHouseTailors}
        onAssignOpenOrderTailor={onAssignOpenOrderTailor}
        onStartOpenOrderWork={onStartOpenOrderWork}
        onMarkOpenOrderPickupReady={onMarkOpenOrderPickupReady}
        onOpenOrderCheckout={onOpenOrderCheckout}
      />
    </div>
  );
}
