import { useMemo, useState } from "react";
import type { ClosedOrderHistoryItem, OpenOrder, OrderType, PickupLocation } from "../../../types";
import {
  getOperatorQueueStageCounts,
  type AssigneeFilterValue,
  filterClosedOrderHistory,
  filterOpenOrders,
  getNeedsAttentionOpenOrders,
  getOrderQueueCounts,
  type OrdersQueueKey,
} from "../selectors";

export type OrdersView = "queues" | "ready" | "operator" | "factory" | "all";
export type AllOrdersTab = "active" | "closed";

export function useOpenOrdersView(
  openOrders: OpenOrder[],
  closedOrderHistory: ClosedOrderHistoryItem[],
) {
  const [activeView, setActiveView] = useState<OrdersView>("queues");
  const [query, setQuery] = useState("");
  const [activeQueue, setActiveQueue] = useState<OrdersQueueKey>("all");
  const [allOrdersTab, setAllOrdersTab] = useState<AllOrdersTab>("active");
  const [typeFilter, setTypeFilter] = useState<OrderType | "all">("all");
  const [locationFilter, setLocationFilter] = useState<PickupLocation | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilterValue>("all");

  const baseOpenOrders = useMemo(
    () => filterOpenOrders(openOrders, { query, queue: "all", typeFilter, locationFilter, assigneeFilter }),
    [assigneeFilter, locationFilter, openOrders, query, typeFilter],
  );

  const queueCounts = useMemo(
    () => ({
      ...getOrderQueueCounts(baseOpenOrders),
      all: getNeedsAttentionOpenOrders(baseOpenOrders).length,
    }),
    [baseOpenOrders],
  );

  const needsAttentionOrders = useMemo(
    () => getNeedsAttentionOpenOrders(baseOpenOrders),
    [baseOpenOrders],
  );

  const filteredQueueOrders = useMemo(
    () => activeQueue === "all"
      ? needsAttentionOrders
      : filterOpenOrders(openOrders, { query, queue: activeQueue, typeFilter, locationFilter, assigneeFilter }),
    [activeQueue, assigneeFilter, locationFilter, needsAttentionOrders, openOrders, query, typeFilter],
  );

  const filteredReadyOrders = useMemo(
    () => filterOpenOrders(openOrders, { query, queue: "ready_for_pickup", typeFilter, locationFilter, assigneeFilter }),
    [assigneeFilter, locationFilter, openOrders, query, typeFilter],
  );

  const filteredOperatorOrders = useMemo(
    () => filterOpenOrders(openOrders, { query, queue: "in_house", typeFilter, locationFilter, assigneeFilter }),
    [assigneeFilter, locationFilter, openOrders, query, typeFilter],
  );

  const filteredFactoryOrders = useMemo(
    () => filterOpenOrders(openOrders, { query, queue: "factory", typeFilter, locationFilter, assigneeFilter }),
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
  const readySubtitle =
    filteredReadyOrders.length === 1 ? "1 order is ready for pickup" : `${filteredReadyOrders.length} orders are ready for pickup`;
  const operatorSubtitle =
    filteredOperatorOrders.length === 1
      ? "1 in-house order in production"
      : `${filteredOperatorOrders.length} in-house orders in production`;
  const factorySubtitle =
    filteredFactoryOrders.length === 1 ? "1 factory order in progress" : `${filteredFactoryOrders.length} factory orders in progress`;
  const allOrdersCount = baseOpenOrders.length + filteredHistoryItems.length;
  const allOrdersSubtitle = activeView === "all"
    ? allOrdersTab === "active"
      ? (baseOpenOrders.length === 1 ? "1 active order" : `${baseOpenOrders.length} active orders`)
      : (filteredHistoryItems.length === 1 ? "1 closed order" : `${filteredHistoryItems.length} closed orders`)
    : allOrdersCount === 1
      ? "1 order"
      : `${allOrdersCount} orders`;

  const activeSubtitle =
    activeView === "queues"
      ? queuesSubtitle
      : activeView === "ready"
        ? readySubtitle
      : activeView === "operator"
        ? operatorSubtitle
        : activeView === "factory"
          ? factorySubtitle
          : allOrdersSubtitle;

  return {
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
  };
}
