import type { OpenOrder, StatusTone } from "../../types";
import type { OpenOrderPickupGroup } from "./orderPickupGroups";
import {
  getOpenOrderPickupsByWorkflow,
  isPastDue,
  isPickupAwaitingPickup,
  isPickupPending,
} from "./orderQueueShared";
import { sortOpenOrdersChronologically } from "./orderQueueSorting";

export type NeedsAttentionGroupState = {
  label: string;
  tone: StatusTone;
  actionKind: "start_work" | "mark_ready" | null;
  actionDisabled: boolean;
};

export function isOpenOrderReadyForPickup(openOrder: OpenOrder) {
  return openOrder.pickupSchedules.some(isPickupAwaitingPickup);
}

export function isOpenOrderFullyReadyForPickup(openOrder: OpenOrder) {
  const unpickedPickups = openOrder.pickupSchedules.filter((pickup) => !pickup.pickedUp);
  return Boolean(unpickedPickups.length) && unpickedPickups.every((pickup) => pickup.readyForPickup);
}

export function getOpenOrderReadinessBreakdown(openOrder: OpenOrder) {
  const alterationPickups = getOpenOrderPickupsByWorkflow(openOrder, "alteration");
  const customPickups = getOpenOrderPickupsByWorkflow(openOrder, "custom");

  return {
    hasAlteration: alterationPickups.length > 0,
    hasCustom: customPickups.length > 0,
    alterationReady: alterationPickups.length > 0 && alterationPickups.every(isPickupAwaitingPickup),
    alterationPickedUp: alterationPickups.length > 0 && alterationPickups.every((pickup) => pickup.pickedUp),
    customReady: customPickups.length > 0 && customPickups.every(isPickupAwaitingPickup),
    customPickedUp: customPickups.length > 0 && customPickups.every((pickup) => pickup.pickedUp),
  };
}

export function getOpenOrderReadinessDetails(openOrder: OpenOrder) {
  const breakdown = getOpenOrderReadinessBreakdown(openOrder);
  const details: string[] = [];

  if (breakdown.hasAlteration) {
    details.push(
      breakdown.alterationPickedUp
        ? "Alterations picked up"
        : breakdown.alterationReady
          ? "Alterations ready"
          : "Alterations in progress",
    );
  }

  if (breakdown.hasCustom) {
    details.push(
      breakdown.customPickedUp
        ? "Custom picked up"
        : breakdown.customReady
          ? "Custom pending pickup"
          : "Custom in progress",
    );
  }

  return details;
}

export function getNeedsAttentionGroupState(
  openOrder: OpenOrder,
  group: OpenOrderPickupGroup,
  now = new Date(),
): NeedsAttentionGroupState {
  const representativePickup = openOrder.pickupSchedules.find((pickup) => pickup.id === group.pickupIds[0]) ?? null;
  const isAlterationGroup = group.scope === "alteration";
  const hasPendingAction = group.actionPickupIds.length > 0;
  const isAccepted = openOrder.operationalStatus === "accepted";
  const isOverdue = representativePickup
    ? isPickupPending(representativePickup) && isPastDue(representativePickup.pickupDate, representativePickup.pickupTime, now)
    : false;

  if (representativePickup?.readyForPickup) {
    return {
      label: "Ready",
      tone: "success",
      actionKind: null,
      actionDisabled: false,
    };
  }

  if (isOverdue) {
    return {
      label: "Overdue",
      tone: "danger",
      actionKind: hasPendingAction ? (isAlterationGroup && isAccepted ? "start_work" : "mark_ready") : null,
      actionDisabled: false,
    };
  }

  if (isAlterationGroup && isAccepted) {
    return {
      label: "Ready to start",
      tone: "dark",
      actionKind: hasPendingAction ? "start_work" : null,
      actionDisabled: false,
    };
  }

  if (isAccepted) {
    return {
      label: "Accepted",
      tone: "dark",
      actionKind: hasPendingAction ? "mark_ready" : null,
      actionDisabled: false,
    };
  }

  return {
    label: "In progress",
    tone: "default",
    actionKind: hasPendingAction ? "mark_ready" : null,
    actionDisabled: false,
  };
}

function getAlterationStatusLabel(openOrder: OpenOrder, now = new Date()) {
  const alterationPickups = getOpenOrderPickupsByWorkflow(openOrder, "alteration");

  if (alterationPickups.length === 0) {
    return "Alterations in progress";
  }

  if (alterationPickups.every((pickup) => pickup.pickedUp)) {
    return "Alterations picked up";
  }

  if (alterationPickups.every(isPickupAwaitingPickup)) {
    return "Alterations ready";
  }

  if (alterationPickups.some((pickup) => isPickupPending(pickup) && isPastDue(pickup.pickupDate, pickup.pickupTime, now))) {
    return "Alterations overdue";
  }

  return "Alterations in progress";
}

function getAlterationStatusTone(openOrder: OpenOrder, now = new Date()) {
  const label = getAlterationStatusLabel(openOrder, now);
  return label === "Alterations ready" || label === "Alterations picked up"
    ? "success" as const
    : label === "Alterations overdue"
      ? "danger" as const
      : "default" as const;
}

function getPhaseToneForLabel(phase: string) {
  if (phase === "Accepted") {
    return "dark" as const;
  }

  if (phase === "Ready for pickup") {
    return "success" as const;
  }

  if (phase === "Overdue") {
    return "danger" as const;
  }

  return "default" as const;
}

type MixedWorkflowStatus = {
  label: string;
  shortLabel: string;
  tone: StatusTone;
  priority: number;
  workflowLabel: "Alterations" | "Custom";
};

function getMixedWorkflowStatuses(openOrder: OpenOrder, now = new Date()): [MixedWorkflowStatus, MixedWorkflowStatus] {
  const breakdown = getOpenOrderReadinessBreakdown(openOrder);
  const alterationLabel = getAlterationStatusLabel(openOrder, now);

  const alterationStatus: MixedWorkflowStatus = {
    workflowLabel: "Alterations",
    label: alterationLabel,
    shortLabel:
      alterationLabel === "Alterations picked up"
        ? "Picked up"
        : alterationLabel === "Alterations ready"
          ? "Ready"
          : alterationLabel === "Alterations overdue"
            ? "Overdue"
            : "In progress",
    tone: getAlterationStatusTone(openOrder, now),
    priority:
      alterationLabel === "Alterations overdue"
        ? 400
        : alterationLabel === "Alterations in progress"
          ? 300
          : alterationLabel === "Alterations ready"
            ? 200
            : 100,
  };

  const customStatus: MixedWorkflowStatus = {
    workflowLabel: "Custom",
    label: breakdown.customPickedUp ? "Custom picked up" : breakdown.customReady ? "Custom ready" : "Custom in progress",
    shortLabel: breakdown.customPickedUp ? "Picked up" : breakdown.customReady ? "Ready" : "In progress",
    tone: breakdown.customPickedUp || breakdown.customReady ? "success" : "default",
    priority: breakdown.customPickedUp ? 100 : breakdown.customReady ? 200 : 300,
  };

  return [alterationStatus, customStatus];
}

export function getOpenOrderMixedStatusSummary(openOrder: OpenOrder, now = new Date()) {
  if (openOrder.orderType !== "mixed") {
    return null;
  }

  const [primaryStatus, secondaryStatus] = [...getMixedWorkflowStatuses(openOrder, now)].sort(
    (left, right) => right.priority - left.priority,
  );

  return {
    primary: {
      label: primaryStatus.label,
      tone: primaryStatus.tone,
    },
    secondary: `${secondaryStatus.workflowLabel}: ${secondaryStatus.shortLabel}`,
  };
}

export function getOpenOrderOperationalLane(openOrder: OpenOrder) {
  if (openOrder.orderType === "mixed") {
    return "Alterations and custom";
  }

  if (openOrder.orderType === "custom") {
    return "Custom";
  }

  return "Alterations";
}

export function getOpenOrderOperationalPhase(openOrder: OpenOrder, now = new Date()) {
  if (isOpenOrderFullyReadyForPickup(openOrder)) {
    return "Ready for pickup";
  }

  if (openOrder.pickupSchedules.some((pickup) => isPickupPending(pickup) && isPastDue(pickup.pickupDate, pickup.pickupTime, now))) {
    return "Overdue";
  }

  if (openOrder.operationalStatus === "partially_ready" || isOpenOrderReadyForPickup(openOrder)) {
    return "Partially ready";
  }

  if (openOrder.operationalStatus === "accepted") {
    return "Accepted";
  }

  return "In progress";
}

export function getOpenOrderStatusPills(openOrder: OpenOrder, now = new Date()) {
  const breakdown = getOpenOrderReadinessBreakdown(openOrder);

  if (openOrder.orderType !== "mixed") {
    const phase = getOpenOrderOperationalPhase(openOrder, now);
    return [
      {
        label: phase,
        tone: getPhaseToneForLabel(phase),
      },
    ];
  }

  return [
    {
      label: getAlterationStatusLabel(openOrder, now),
      tone: getAlterationStatusTone(openOrder, now),
    },
    {
      label: breakdown.customPickedUp ? "Custom picked up" : breakdown.customReady ? "Custom ready" : "Custom in progress",
      tone: breakdown.customPickedUp || breakdown.customReady ? "success" as const : "default" as const,
    },
  ];
}

export function getNeedsAttentionOpenOrders(openOrders: OpenOrder[]) {
  return sortOpenOrdersChronologically(
    openOrders.filter((openOrder) => !isOpenOrderFullyReadyForPickup(openOrder)),
  );
}

export function getMarkReadyActionLabel(_openOrder: OpenOrder, pendingPickupCount: number) {
  return pendingPickupCount > 1 ? `Mark ${pendingPickupCount} ready` : "Mark ready";
}
