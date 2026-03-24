import type { OpenOrder } from "../../types";
import { getPickupDateTime } from "./orderDateUtils";

export type OperatorQueueStageKey = "needs_assignment" | "ready_to_start" | "in_progress" | "ready";

export type OperatorQueueStageCounts = Record<OperatorQueueStageKey, number>;

export function getInHouseOpenOrderPickups(openOrder: OpenOrder) {
  return openOrder.pickupSchedules.filter((pickup) => pickup.scope === "alteration" && !pickup.pickedUp);
}

export function hasInHouseOpenOrderWork(openOrder: OpenOrder) {
  return getInHouseOpenOrderPickups(openOrder).length > 0;
}

export function getOperatorQueueStage(openOrder: OpenOrder): OperatorQueueStageKey | null {
  const inHousePickups = getInHouseOpenOrderPickups(openOrder);
  if (!inHousePickups.length) {
    return null;
  }

  const hasPendingInHousePickup = inHousePickups.some((pickup) => !pickup.readyForPickup);
  if (!hasPendingInHousePickup) {
    return "ready";
  }

  if (!openOrder.inHouseAssignee) {
    return "needs_assignment";
  }

  if (openOrder.operationalStatus === "accepted") {
    return "ready_to_start";
  }

  return "in_progress";
}

export function getOperatorQueueStageCounts(openOrders: OpenOrder[]): OperatorQueueStageCounts {
  return openOrders.reduce<OperatorQueueStageCounts>((counts, openOrder) => {
    const stage = getOperatorQueueStage(openOrder);
    if (stage) {
      counts[stage] += 1;
    }

    return counts;
  }, {
    needs_assignment: 0,
    ready_to_start: 0,
    in_progress: 0,
    ready: 0,
  });
}

export function sortOperatorQueueOrders(openOrders: OpenOrder[]) {
  return [...openOrders].sort((left, right) => {
    const leftNextPickup = getInHouseOpenOrderPickups(left)
      .filter((pickup) => !pickup.readyForPickup)
      .map((pickup) => getPickupDateTime(pickup.pickupDate, pickup.pickupTime)?.getTime() ?? Number.POSITIVE_INFINITY)
      .sort((a, b) => a - b)[0] ?? Number.POSITIVE_INFINITY;
    const rightNextPickup = getInHouseOpenOrderPickups(right)
      .filter((pickup) => !pickup.readyForPickup)
      .map((pickup) => getPickupDateTime(pickup.pickupDate, pickup.pickupTime)?.getTime() ?? Number.POSITIVE_INFINITY)
      .sort((a, b) => a - b)[0] ?? Number.POSITIVE_INFINITY;

    if (leftNextPickup !== rightNextPickup) {
      return leftNextPickup - rightNextPickup;
    }

    return left.id - right.id;
  });
}
