import { useMemo, useState } from "react";
import type { Appointment, ClosedOrderHistoryItem, OpenOrder, OrderType, PickupLocation } from "../../../types";
import {
  filterClosedOrderHistory,
  filterOpenOrders,
  filterPickupAppointments,
  getOrderQueueCounts,
  type OrdersQueueKey,
} from "../selectors";

export type OrdersView = "queues" | "all" | "history";

export function useOpenOrdersView(
  openOrders: OpenOrder[],
  closedOrderHistory: ClosedOrderHistoryItem[],
  pickupAppointments: Appointment[],
) {
  const [activeView, setActiveView] = useState<OrdersView>("queues");
  const [query, setQuery] = useState("");
  const [activeQueue, setActiveQueue] = useState<OrdersQueueKey>("all");
  const [typeFilter, setTypeFilter] = useState<OrderType | "all">("all");
  const [locationFilter, setLocationFilter] = useState<PickupLocation | "all">("all");

  const baseOpenOrders = useMemo(
    () => filterOpenOrders(openOrders, { query, queue: "all", typeFilter, locationFilter }),
    [locationFilter, openOrders, query, typeFilter],
  );

  const basePickupAppointments = useMemo(
    () => filterPickupAppointments(pickupAppointments, { query, queue: "all", locationFilter }),
    [locationFilter, pickupAppointments, query],
  );

  const queueCounts = useMemo(
    () => getOrderQueueCounts(baseOpenOrders, basePickupAppointments),
    [baseOpenOrders, basePickupAppointments],
  );

  const filteredQueueOrders = useMemo(
    () => filterOpenOrders(openOrders, { query, queue: activeQueue, typeFilter, locationFilter }),
    [activeQueue, locationFilter, openOrders, query, typeFilter],
  );

  const filteredQueuePickups = useMemo(
    () => filterPickupAppointments(pickupAppointments, { query, queue: activeQueue, locationFilter }),
    [activeQueue, locationFilter, pickupAppointments, query],
  );

  const filteredHistoryItems = useMemo(
    () => filterClosedOrderHistory([...closedOrderHistory], query),
    [closedOrderHistory, query],
  );

  const queuesSubtitle =
    queueCounts.all === 1
      ? "1 worklist item: active order or scheduled pickup"
      : `${queueCounts.all} worklist items: ${baseOpenOrders.length} active orders and ${basePickupAppointments.length} scheduled pickups`;
  const registrySubtitle =
    baseOpenOrders.length === 1 ? "1 active order only" : `${baseOpenOrders.length} active orders only`;
  const historySubtitle =
    filteredHistoryItems.length === 1 ? "1 closed order only" : `${filteredHistoryItems.length} closed orders only`;

  const activeSubtitle =
    activeView === "queues" ? queuesSubtitle : activeView === "all" ? registrySubtitle : historySubtitle;

  return {
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
    basePickupAppointments,
    queueCounts,
    filteredQueueOrders,
    filteredQueuePickups,
    filteredHistoryItems,
    activeSubtitle,
  };
}
