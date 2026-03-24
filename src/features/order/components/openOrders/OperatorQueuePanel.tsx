import { ChevronDown, ClipboardList, MapPin, PlayCircle, UserRoundCheck } from "lucide-react";
import type { OpenOrder, OpenOrderPickup, StaffMember } from "../../../../types";
import { ActionButton, EmptyState, StatusPill, SurfaceHeader, cx } from "../../../../components/ui/primitives";
import {
  formatOpenOrderCreatedAt,
  getInHouseOpenOrderPickups,
  getMarkReadyActionLabel,
  getOpenOrderStatusPills,
  getOpenOrderTypeLabel,
  getOperationalPickupDateLabel,
  getOperationalPickupTimeLabel,
  getOperatorQueueStage,
  getOperatorQueueStageCounts,
  sortOperatorQueueOrders,
  type OperatorQueueStageCounts,
  type OperatorQueueStageKey,
} from "../../selectors";
import { formatWorklistTotal, getPhaseTone, getWorklistPaymentLabel, getWorklistPaymentTextClassName } from "./meta";

const stageMeta: Array<{
  key: OperatorQueueStageKey;
  title: string;
  subtitle: string;
}> = [
  {
    key: "needs_assignment",
    title: "Needs assignment",
    subtitle: "Accepted orders that still need someone assigned.",
  },
  {
    key: "ready_to_start",
    title: "Ready to start",
    subtitle: "Assigned orders that can be started now.",
  },
  {
    key: "in_progress",
    title: "In progress",
    subtitle: "Work already underway in-house.",
  },
];

function getOperatorStagePill(stage: OperatorQueueStageKey) {
  if (stage === "needs_assignment") {
    return { label: "Needs assignment", tone: "warn" as const };
  }

  if (stage === "ready_to_start") {
    return { label: "Assigned", tone: "dark" as const };
  }

  if (stage === "ready") {
    return { label: "Ready", tone: "success" as const };
  }

  return { label: "In progress", tone: getPhaseTone("In progress") };
}

function OperatorQueueSummary({
  stageCounts,
}: {
  stageCounts: OperatorQueueStageCounts;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {stageMeta.map((stage) => (
        <div key={stage.key} className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface-subtle)] px-4 py-3">
          <div className="app-text-overline">{stage.title}</div>
          <div className="mt-2 text-[1.5rem] font-semibold leading-none tracking-[-0.02em] text-[var(--app-text)]">
            {stageCounts[stage.key]}
          </div>
          <div className="app-text-caption mt-2">{stage.subtitle}</div>
        </div>
      ))}
    </div>
  );
}

function getNextPendingPickup(openOrder: OpenOrder) {
  return getInHouseOpenOrderPickups(openOrder)
    .filter((pickup) => !pickup.readyForPickup)
    .sort((left, right) => `${left.pickupDate}T${left.pickupTime}`.localeCompare(`${right.pickupDate}T${right.pickupTime}`))[0]
    ?? getInHouseOpenOrderPickups(openOrder)[0]
    ?? null;
}

function getAlterationItemSummary(pickup: OpenOrderPickup | null, openOrder: OpenOrder) {
  if (pickup?.itemSummary.length) {
    return pickup.itemSummary.join(", ");
  }

  return openOrder.itemSummary.join(", ");
}

function TailorAssignmentControl({
  openOrder,
  inHouseTailors,
  onAssignOpenOrderTailor,
}: {
  openOrder: OpenOrder;
  inHouseTailors: StaffMember[];
  onAssignOpenOrderTailor: (openOrderId: number, staffId: string | null) => void;
}) {
  const stage = getOperatorQueueStage(openOrder);
  const helperText = !openOrder.inHouseAssignee
    ? stage === "needs_assignment"
      ? "Assign a tailor before work can start."
      : "No tailor assigned yet."
    : null;

  return (
    <div className="min-w-0" onClick={(event) => event.stopPropagation()}>
      <div className="app-field-control relative min-h-[2.75rem] px-3 py-2">
        <select
          aria-label={`Assign tailor for order ${openOrder.id}`}
          value={openOrder.inHouseAssignee?.id ?? "unassigned"}
          onChange={(event) => onAssignOpenOrderTailor(openOrder.id, event.target.value === "unassigned" ? null : event.target.value)}
          className="app-text-body min-w-0 flex-1 appearance-none pr-9"
        >
          <option value="unassigned">Choose tailor</option>
          {inHouseTailors.map((staffMember) => (
            <option key={staffMember.id} value={staffMember.id}>
              {staffMember.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-soft)]" />
      </div>
      {helperText ? <div className="app-text-caption mt-1">{helperText}</div> : null}
    </div>
  );
}

function OperatorQueueColumnHeader() {
  return (
    <div className="app-table-head hidden border-b border-[var(--app-border)]/35 px-4 py-2 lg:block">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)_minmax(14rem,16rem)_10rem_minmax(12rem,0.58fr)] lg:items-center">
        <div className="app-text-overline">Customer</div>
        <div className="app-text-overline">Ready by</div>
        <div className="app-text-overline">Assigned tailor</div>
        <div className="app-text-overline">Next step</div>
        <div className="app-text-overline text-right">Status</div>
      </div>
    </div>
  );
}

function OperatorQueueRow({
  openOrder,
  inHouseTailors,
  onAssignOpenOrderTailor,
  onStartOpenOrderWork,
  onRequestMarkOpenOrderPickupReady,
  onOpenOrderCheckout,
}: {
  openOrder: OpenOrder;
  inHouseTailors: StaffMember[];
  onAssignOpenOrderTailor: (openOrderId: number, staffId: string | null) => void;
  onStartOpenOrderWork: (openOrderId: number) => void;
  onRequestMarkOpenOrderPickupReady: (openOrder: OpenOrder, pickupIds: string[]) => void;
  onOpenOrderCheckout: (openOrderId: number) => void;
}) {
  const stage = getOperatorQueueStage(openOrder);
  const nextPickup = getNextPendingPickup(openOrder);
  const statusPills = getOpenOrderStatusPills(openOrder);
  const pendingPickupIds = getInHouseOpenOrderPickups(openOrder).filter((pickup) => !pickup.readyForPickup).map((pickup) => pickup.id);
  const stagePill = stage ? getOperatorStagePill(stage) : null;
  const dateLabel = nextPickup ? getOperationalPickupDateLabel(nextPickup.pickupDate, nextPickup.pickupTime) : null;
  const timeLabel = nextPickup ? getOperationalPickupTimeLabel(nextPickup.pickupDate, nextPickup.pickupTime) : null;
  const itemSummary = getAlterationItemSummary(nextPickup, openOrder);

  if (!stage || !stagePill) {
    return null;
  }

  return (
    <div
      className="cursor-pointer px-4 py-4"
      role="button"
      tabIndex={0}
      onClick={() => onOpenOrderCheckout(openOrder.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenOrderCheckout(openOrder.id);
        }
      }}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)_minmax(14rem,16rem)_10rem_minmax(12rem,0.58fr)] lg:items-start">
        <div className="min-w-0">
          <div className="app-text-overline lg:hidden">Customer</div>
          <div className="app-text-value mt-1 lg:mt-0">{openOrder.payerName}</div>
          <div className="app-text-caption mt-1">
            {getOpenOrderTypeLabel(openOrder.orderType)} • Order #{openOrder.id} • {formatOpenOrderCreatedAt(openOrder.createdAt)}
          </div>
          <div className="app-text-caption mt-2 line-clamp-2">{itemSummary}</div>
        </div>

        <div className="min-w-0">
          <div className="app-text-overline lg:hidden">Ready by</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 lg:mt-0">
            <div className="app-text-body font-medium">
              {dateLabel ?? "Date pending"}{timeLabel ? ` · ${timeLabel}` : ""}
            </div>
          </div>
          {nextPickup?.pickupLocation ? (
            <div className="app-text-caption mt-1 inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
              <span>{nextPickup.pickupLocation}</span>
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="app-text-overline lg:hidden">Assigned tailor</div>
          <div className="mt-1 lg:mt-0">
            <TailorAssignmentControl
              openOrder={openOrder}
              inHouseTailors={inHouseTailors}
              onAssignOpenOrderTailor={onAssignOpenOrderTailor}
            />
          </div>
        </div>

        <div className="min-w-0" onClick={(event) => event.stopPropagation()}>
          <div className="app-text-overline lg:hidden">Next step</div>
          <div className="mt-1 flex items-start lg:mt-0">
            {stage === "ready_to_start" ? (
              <ActionButton
                tone="primary"
                className="w-full justify-center whitespace-nowrap px-3 py-2 text-xs"
                onClick={() => onStartOpenOrderWork(openOrder.id)}
              >
                Start work
              </ActionButton>
            ) : null}
            {stage === "in_progress" && pendingPickupIds.length > 0 ? (
              <ActionButton
                tone="primary"
                className="w-full justify-center whitespace-nowrap px-6 py-2 text-xs"
                onClick={() => onRequestMarkOpenOrderPickupReady(openOrder, pendingPickupIds)}
              >
                {getMarkReadyActionLabel(openOrder, pendingPickupIds.length)}
              </ActionButton>
            ) : null}
            {stage === "needs_assignment" ? (
              <div className="app-text-caption pt-2">Choose a tailor to unlock work.</div>
            ) : null}
          </div>
          <div className="mt-2">
            <ActionButton
              tone="quiet"
              onClick={() => onOpenOrderCheckout(openOrder.id)}
            >
              View order
            </ActionButton>
          </div>
        </div>

        <div className="min-w-0 lg:text-right">
          <div className="app-text-overline lg:hidden">Status</div>
          <div className={cx("mt-1 flex flex-wrap items-center gap-2 lg:mt-0 lg:justify-end", openOrder.orderType === "mixed" ? "lg:flex-nowrap" : "")}>
            {openOrder.orderType === "mixed"
              ? statusPills.map((pill) => (
                <StatusPill key={pill.label} tone={pill.tone} className="whitespace-nowrap">{pill.label}</StatusPill>
              ))
              : (
                <StatusPill tone={stagePill.tone}>
                  {stagePill.label}
                </StatusPill>
              )}
          </div>
          <div className="mt-3">
            <div className="text-[1.375rem] font-semibold leading-none tracking-[-0.01em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
              {formatWorklistTotal(openOrder.total)}
            </div>
            <div className="mt-1.5">
              <span className={getWorklistPaymentTextClassName(openOrder.balanceDue)}>{getWorklistPaymentLabel(openOrder.balanceDue)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OperatorQueueStageSection({
  title,
  subtitle,
  openOrders,
  inHouseTailors,
  onAssignOpenOrderTailor,
  onStartOpenOrderWork,
  onRequestMarkOpenOrderPickupReady,
  onOpenOrderCheckout,
}: {
  title: string;
  subtitle: string;
  openOrders: OpenOrder[];
  inHouseTailors: StaffMember[];
  onAssignOpenOrderTailor: (openOrderId: number, staffId: string | null) => void;
  onStartOpenOrderWork: (openOrderId: number) => void;
  onRequestMarkOpenOrderPickupReady: (openOrder: OpenOrder, pickupIds: string[]) => void;
  onOpenOrderCheckout: (openOrderId: number) => void;
}) {
  if (!openOrders.length) {
    return null;
  }

  return (
    <div className="app-work-surface">
      <div className="px-4 py-4">
        <SurfaceHeader
          icon={ClipboardList}
          title={title}
          subtitle={subtitle}
          className="border-b border-[var(--app-border)]/45 pb-3"
          titleClassName="app-text-value"
          subtitleClassName="app-text-caption"
        />
      </div>
      <div className="border-t border-[var(--app-border)]/45">
        <OperatorQueueColumnHeader />
        {openOrders.map((openOrder, index) => (
          <div
            key={openOrder.id}
            className={cx("app-table-row", index > 0 && "border-t border-[var(--app-border)]/35")}
          >
            <OperatorQueueRow
              openOrder={openOrder}
              inHouseTailors={inHouseTailors}
              onAssignOpenOrderTailor={onAssignOpenOrderTailor}
              onStartOpenOrderWork={onStartOpenOrderWork}
              onRequestMarkOpenOrderPickupReady={onRequestMarkOpenOrderPickupReady}
              onOpenOrderCheckout={onOpenOrderCheckout}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OperatorQueuePanel({
  openOrders,
  stageCounts: _stageCounts,
  inHouseTailors,
  onAssignOpenOrderTailor,
  onStartOpenOrderWork,
  onRequestMarkOpenOrderPickupReady,
  onOpenOrderCheckout,
}: {
  openOrders: OpenOrder[];
  stageCounts: OperatorQueueStageCounts;
  inHouseTailors: StaffMember[];
  onAssignOpenOrderTailor: (openOrderId: number, staffId: string | null) => void;
  onStartOpenOrderWork: (openOrderId: number) => void;
  onRequestMarkOpenOrderPickupReady: (openOrder: OpenOrder, pickupIds: string[]) => void;
  onOpenOrderCheckout: (openOrderId: number) => void;
}) {
  const sortedOrders = sortOperatorQueueOrders(openOrders);
  const ordersByStage = stageMeta.reduce<Record<OperatorQueueStageKey, OpenOrder[]>>((groups, stage) => {
    groups[stage.key] = sortedOrders.filter((openOrder) => getOperatorQueueStage(openOrder) === stage.key);
    return groups;
  }, {
    needs_assignment: [],
    ready_to_start: [],
    in_progress: [],
    ready: [],
  });
  const visibleStageCounts = getOperatorQueueStageCounts(sortedOrders);

  if (!sortedOrders.length) {
    return (
      <div className="app-work-surface">
        <div className="px-4 py-4">
          <SurfaceHeader
            icon={UserRoundCheck}
        title="Alterations"
        subtitle="In-house orders will show up here once they are accepted."
            className="border-b border-[var(--app-border)]/45 pb-3"
            titleClassName="app-text-value"
            subtitleClassName="app-text-caption"
          />
        </div>
        <div className="border-t border-[var(--app-border)]/45">
          <EmptyState className="rounded-none border-0 bg-transparent shadow-none">
            <div className="app-text-body">No in-house alteration work matches this queue view right now.</div>
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="app-control-deck px-4 py-4">
        <SurfaceHeader
          icon={PlayCircle}
          title="Alterations"
          subtitle="Assign accepted orders, start the work, and move finished pieces to ready."
          titleClassName="app-text-value"
          subtitleClassName="app-text-caption"
        />
        <div className="mt-4">
          <OperatorQueueSummary stageCounts={visibleStageCounts} />
        </div>
      </div>

      <div className="space-y-4">
        {stageMeta.map((stage) => (
          <OperatorQueueStageSection
            key={stage.key}
            title={stage.title}
            subtitle={stage.subtitle}
            openOrders={ordersByStage[stage.key]}
            inHouseTailors={inHouseTailors}
            onAssignOpenOrderTailor={onAssignOpenOrderTailor}
            onStartOpenOrderWork={onStartOpenOrderWork}
            onRequestMarkOpenOrderPickupReady={onRequestMarkOpenOrderPickupReady}
            onOpenOrderCheckout={onOpenOrderCheckout}
          />
        ))}
      </div>
    </div>
  );
}
