import { useMemo, useState } from "react";
import type { ClosedOrderHistoryItem, OpenOrder, OrderType, PickupLocation } from "../../../types";
import {
  getOperatorQueueStageCounts,
  type AssigneeFilterValue,
  filterClosedOrderHistory,
  filterOpenOrders,
  getOrderQueueCounts,
  type OrdersQueueKey,
} from "../selectors";

export type OrdersView = "queues" | "operator" | "all" | "history";

export function useOpenOrdersView(
  openOrders: OpenOrder[],
  closedOrderHistory: ClosedOrderHistoryItem[],
) {
  const [activeView, setActiveView] = useState<OrdersView>("queues");
  const [query, setQuery] = useState("");
  const [activeQueue, setActiveQueue] = useState<OrdersQueueKey>("all");
  const [typeFilter, setTypeFilter] = useState<OrderType | "all">("all");
  const [locationFilter, setLocationFilter] = useState<PickupLocation | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilterValue>("all");

  const baseOpenOrders = useMemo(
    () => filterOpenOrders(openOrders, { query, queue: "all", typeFilter, locationFilter, assigneeFilter }),
    [assigneeFilter, locationFilter, openOrders, query, typeFilter],
  );

  const queueCounts = useMemo(
    () => getOrderQueueCounts(baseOpenOrders),
    [baseOpenOrders],
  );

  const filteredQueueOrders = useMemo(
    () => filterOpenOrders(openOrders, { query, queue: activeQueue, typeFilter, locationFilter, assigneeFilter }),
    [activeQueue, assigneeFilter, locationFilter, openOrders, query, typeFilter],
  );

  const filteredOperatorOrders = useMemo(
    () => filterOpenOrders(openOrders, { query, queue: "in_house", typeFilter, locationFilter, assigneeFilter }),
    [assigneeFilter, locationFilter, openOrders, query, typeFilter],
  );

  const operatorQueueCounts = useMemo(
    () => getOperatorQueueStageCounts(filteredOperatorOrders),
    [filteredOperatorOrders],
  );

  const filteredHistoryItems = useMemo(
    () => filterClosedOrderHistory([...closedOrderHistory], query),
    [closedOrderHistory, query],
  );

  const queuesSubtitle =
    queueCounts.all === 1
      ? "1 active order needs attention"
      : `${queueCounts.all} active orders need attention`;
  const registrySubtitle =
    baseOpenOrders.length === 1 ? "1 active order" : `${baseOpenOrders.length} active orders`;
  const historySubtitle =
    filteredHistoryItems.length === 1 ? "1 closed order" : `${filteredHistoryItems.length} closed orders`;
  const operatorSubtitle =
    filteredOperatorOrders.length === 1
      ? "1 in-house order in production"
      : `${filteredOperatorOrders.length} in-house orders in production`;

  const activeSubtitle =
    activeView === "queues"
      ? queuesSubtitle
      : activeView === "operator"
        ? operatorSubtitle
        : activeView === "all"
          ? registrySubtitle
          : historySubtitle;

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
    assigneeFilter,
    setAssigneeFilter,
    baseOpenOrders,
    queueCounts,
    filteredQueueOrders,
    filteredOperatorOrders,
    operatorQueueCounts,
    filteredHistoryItems,
    activeSubtitle,
  };
}
