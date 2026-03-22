import type { Appointment, ClosedOrderHistoryItem, OpenOrder, PickupLocation } from "../types";
import { OpenOrdersBody, OpenOrdersControls, OpenOrdersHeader } from "../features/order/components/OpenOrdersPanels";
import { useOpenOrdersView } from "../features/order/hooks/useOpenOrdersView";

type OpenOrdersScreenProps = {
  openOrders: OpenOrder[];
  closedOrderHistory: ClosedOrderHistoryItem[];
  pickupAppointments: Appointment[];
  pickupLocations: PickupLocation[];
  onMarkOpenOrderPickupReady: (openOrderId: number, pickupId: string) => void;
  onOpenOrderCheckout: (openOrderId: number) => void;
  onStartNewOrder: () => void;
};

export function OpenOrdersScreen({
  openOrders,
  closedOrderHistory,
  pickupAppointments,
  pickupLocations,
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
    baseOpenOrders,
    queueCounts,
    filteredQueueOrders,
    filteredQueuePickups,
    filteredHistoryItems,
    activeSubtitle,
  } = useOpenOrdersView(openOrders, closedOrderHistory, pickupAppointments);

  return (
    <div className="space-y-4">
      <div className="space-y-5">
        <OpenOrdersHeader subtitle={activeSubtitle} onStartNewOrder={onStartNewOrder} />

        <OpenOrdersControls
          activeView={activeView}
          onViewChange={setActiveView}
          viewCounts={{
            queues: queueCounts.all,
            all: baseOpenOrders.length,
            history: filteredHistoryItems.length,
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
        />
      </div>

      <OpenOrdersBody
        activeView={activeView}
        activeQueue={activeQueue}
        baseOpenOrders={baseOpenOrders}
        filteredQueueOrders={filteredQueueOrders}
        filteredQueuePickups={filteredQueuePickups}
        filteredHistoryItems={filteredHistoryItems}
        onMarkOpenOrderPickupReady={onMarkOpenOrderPickupReady}
        onOpenOrderCheckout={onOpenOrderCheckout}
      />
    </div>
  );
}
