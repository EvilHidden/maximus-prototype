import type { ClosedOrderHistoryItem, OpenOrder, PickupLocation } from "../../types";
import { getOpenOrderTypeLabel } from "./orderWorkflow";
import { type AssigneeFilterValue, type OrdersQueueKey } from "./orderQueues";
import {
  getOpenOrderLocationSummary,
  getPickupAlertState,
} from "./orderPickupGroups";
import { isOpenOrderFullyReadyForPickup, isOpenOrderReadyForPickup } from "./orderReadiness";
import {
  formatCompactCurrency,
  isPastDue,
  isPickupAwaitingPickup,
  isPickupPending,
  normalizeSearchValue,
} from "./orderQueueShared";
import { sortOpenOrdersChronologically } from "./orderQueueSorting";
import { isToday, isTomorrow } from "./orderDateUtils";

function getOpenOrderSearchText(openOrder: OpenOrder) {
  return normalizeSearchValue(
    [
      openOrder.id,
      openOrder.payerName,
      openOrder.inHouseAssignee?.name,
      getOpenOrderTypeLabel(openOrder.orderType),
      ...openOrder.itemSummary,
      ...openOrder.pickupSchedules.flatMap((pickup) => [
        pickup.label,
        pickup.pickupLocation,
        pickup.itemSummary.join(" "),
      ]),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function getClosedOrderSearchText(order: ClosedOrderHistoryItem) {
  return normalizeSearchValue(
    [
      order.displayId ?? order.id,
      order.payerName ?? order.customerName,
      order.label,
      ...(order.itemSummary ?? []),
      ...(order.pickupSchedules?.flatMap((pickup) => [pickup.pickupLocation, pickup.itemSummary.join(" ")]) ?? []),
      order.status,
      formatCompactCurrency(order.total),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function openOrderMatchesLocation(openOrder: OpenOrder, locationFilter: PickupLocation | "all") {
  if (locationFilter === "all") {
    return true;
  }

  return openOrder.pickupSchedules.some((pickup) => pickup.pickupLocation === locationFilter);
}

function openOrderMatchesAssignee(openOrder: OpenOrder, assigneeFilter: AssigneeFilterValue) {
  if (assigneeFilter === "all") {
    return true;
  }

  if (assigneeFilter === "unassigned") {
    return (openOrder.orderType === "alteration" || openOrder.orderType === "mixed") && !openOrder.inHouseAssignee;
  }

  return openOrder.inHouseAssignee?.id === assigneeFilter;
}

function openOrderMatchesQueue(openOrder: OpenOrder, queue: OrdersQueueKey, now = new Date()) {
  if (queue === "all") {
    return true;
  }

  if (queue === "in_house") {
    return openOrder.orderType === "alteration" || openOrder.orderType === "mixed";
  }

  if (queue === "factory") {
    return openOrder.orderType === "custom" || openOrder.orderType === "mixed";
  }

  if (queue === "ready_for_pickup") {
    return openOrder.pickupSchedules.some(isPickupAwaitingPickup);
  }

  if (queue === "overdue") {
    return openOrder.pickupSchedules.some((pickup) => isPickupPending(pickup) && isPastDue(pickup.pickupDate, pickup.pickupTime, now));
  }

  if (queue === "due_today") {
    return !isOpenOrderFullyReadyForPickup(openOrder)
      && openOrder.pickupSchedules.some((pickup) => pickup.pickupDate && isToday(pickup.pickupDate, now));
  }

  if (queue === "due_tomorrow") {
    return !isOpenOrderFullyReadyForPickup(openOrder)
      && openOrder.pickupSchedules.some((pickup) => pickup.pickupDate && isTomorrow(pickup.pickupDate, now));
  }

  return false;
}

export type OpenOrderFilterOptions = {
  query: string;
  queue: OrdersQueueKey;
  typeFilter: OpenOrder["orderType"] | "all";
  locationFilter: PickupLocation | "all";
  assigneeFilter: AssigneeFilterValue;
};

export function getOrderQueueCounts(openOrders: OpenOrder[], options: { now?: Date } = {}) {
  const now = options.now ?? new Date();
  const queueKeys: OrdersQueueKey[] = [
    "all",
    "due_today",
    "due_tomorrow",
    "ready_for_pickup",
    "overdue",
    "in_house",
    "factory",
  ];

  return queueKeys.reduce<Record<OrdersQueueKey, number>>((accumulator, queueKey) => {
    const openOrderCount = openOrders.filter((openOrder) => openOrderMatchesQueue(openOrder, queueKey, now)).length;
    accumulator[queueKey] = openOrderCount;
    return accumulator;
  }, {
    all: 0,
    due_today: 0,
    due_tomorrow: 0,
    ready_for_pickup: 0,
    overdue: 0,
    in_house: 0,
    factory: 0,
  });
}

export function filterOpenOrders(
  openOrders: OpenOrder[],
  { query, queue, typeFilter, locationFilter, assigneeFilter }: OpenOrderFilterOptions,
  options: { now?: Date } = {},
) {
  const now = options.now ?? new Date();
  const normalizedQuery = normalizeSearchValue(query);

  return sortOpenOrdersChronologically(openOrders.filter((openOrder) => {
    if (typeFilter !== "all" && openOrder.orderType !== typeFilter) {
      return false;
    }

    if (!openOrderMatchesLocation(openOrder, locationFilter)) {
      return false;
    }

    if (!openOrderMatchesAssignee(openOrder, assigneeFilter)) {
      return false;
    }

    if (!openOrderMatchesQueue(openOrder, queue, now)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return getOpenOrderSearchText(openOrder).includes(normalizedQuery);
  }));
}

export function filterClosedOrderHistory(historyItems: ClosedOrderHistoryItem[], query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) {
    return historyItems;
  }

  return historyItems.filter((order) => getClosedOrderSearchText(order).includes(normalizedQuery));
}
