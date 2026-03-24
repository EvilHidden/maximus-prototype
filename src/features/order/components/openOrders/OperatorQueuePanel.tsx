import { ClipboardList, PlayCircle, UserRoundCheck } from "lucide-react";
import type { OpenOrder, StaffMember } from "../../../../types";
import { ActionButton, EmptyState, StatusPill, SurfaceHeader, cx } from "../../../../components/ui/primitives";
import {
  formatOpenOrderCreatedAt,
  formatSummaryCurrency,
  getOpenOrderTypeLabel,
  getOperatorQueueStage,
  getOperatorQueueStageCounts,
  getPickupAlertState,
  sortOperatorQueueOrders,
  type OperatorQueueStageCounts,
  type OperatorQueueStageKey,
} from "../../selectors";
import { getPhaseTone } from "./meta";

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
  {
    key: "ready",
    title: "Ready",
    subtitle: "Finished in-house work that is ready for pickup.",
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
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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

function OperatorQueueRow({
  openOrder,
  inHouseTailors,
  onAssignOpenOrderTailor,
  onStartOpenOrderWork,
  onMarkOpenOrderPickupReady,
  onOpenOrderCheckout,
}: {
  openOrder: OpenOrder;
  inHouseTailors: StaffMember[];
  onAssignOpenOrderTailor: (openOrderId: number, staffId: string | null) => void;
  onStartOpenOrderWork: (openOrderId: number) => void;
  onMarkOpenOrderPickupReady: (openOrderId: number, pickupId: string) => void;
  onOpenOrderCheckout: (openOrderId: number) => void;
}) {
  const stage = getOperatorQueueStage(openOrder);
  const inHousePickups = openOrder.pickupSchedules.filter((pickup) => pickup.scope === "alteration");
  const pendingPickupIds = inHousePickups.filter((pickup) => !pickup.readyForPickup).map((pickup) => pickup.id);
  const nextPickup = inHousePickups
    .filter((pickup) => !pickup.readyForPickup)
    .sort((left, right) => `${left.pickupDate}T${left.pickupTime}`.localeCompare(`${right.pickupDate}T${right.pickupTime}`))[0]
    ?? inHousePickups[0];
  const pickupAlert = nextPickup ? getPickupAlertState(nextPickup.pickupDate, nextPickup.pickupTime, nextPickup.readyForPickup) : null;
  const hasAssignee = Boolean(openOrder.inHouseAssignee);
  if (!stage) {
    return null;
  }
  const stagePill = getOperatorStagePill(stage);

  return (
    <div className="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.8fr)_auto] xl:items-start">
      <div className="min-w-0">
        <div className="app-text-strong">{openOrder.payerName}</div>
        <div className="app-text-caption mt-1">
          {getOpenOrderTypeLabel(openOrder.orderType)} • Order #{openOrder.id} • {formatOpenOrderCreatedAt(openOrder.createdAt)}
        </div>
        <div className="app-text-body mt-2">{openOrder.itemSummary.join(", ")}</div>
        {nextPickup ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="app-text-caption">
              Ready by {nextPickup.pickupDate || "date pending"}{nextPickup.pickupTime ? ` at ${nextPickup.pickupTime}` : ""}
              {nextPickup.pickupLocation ? ` • ${nextPickup.pickupLocation}` : ""}
            </div>
            {pickupAlert ? (
              <StatusPill tone={pickupAlert.tone}>{pickupAlert.label}</StatusPill>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-3" onClick={(event) => event.stopPropagation()}>
        <div>
          <div className="app-text-overline">Assigned to</div>
          <div className="app-field-control mt-1 min-h-[2.75rem] px-3 py-2">
            <select
              value={openOrder.inHouseAssignee?.id ?? "unassigned"}
              onChange={(event) => onAssignOpenOrderTailor(openOrder.id, event.target.value === "unassigned" ? null : event.target.value)}
              className="app-text-body min-w-0 flex-1 appearance-none pr-7"
            >
              <option value="unassigned">Unassigned</option>
              {inHouseTailors.map((staffMember) => (
                <option key={staffMember.id} value={staffMember.id}>
                  {staffMember.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={stagePill.tone}>
            {stagePill.label}
          </StatusPill>
          <div className="app-text-caption">{formatSummaryCurrency(openOrder.total)} total</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 xl:justify-end">
        {stage === "ready_to_start" ? (
          <ActionButton
            tone="primary"
            disabled={!hasAssignee}
            onClick={(event) => {
              event.stopPropagation();
              onStartOpenOrderWork(openOrder.id);
            }}
          >
            Start work
          </ActionButton>
        ) : null}
        {stage === "in_progress" && pendingPickupIds.length > 0 ? (
          <ActionButton
            tone="primary"
            onClick={(event) => {
              event.stopPropagation();
              pendingPickupIds.forEach((pickupId) => onMarkOpenOrderPickupReady(openOrder.id, pickupId));
            }}
          >
            {pendingPickupIds.length > 1 ? `Mark ${pendingPickupIds.length} ready` : "Mark ready"}
          </ActionButton>
        ) : null}
        <ActionButton
          tone="quiet"
          onClick={(event) => {
            event.stopPropagation();
            onOpenOrderCheckout(openOrder.id);
          }}
        >
          Open order
        </ActionButton>
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
  onMarkOpenOrderPickupReady,
  onOpenOrderCheckout,
}: {
  title: string;
  subtitle: string;
  openOrders: OpenOrder[];
  inHouseTailors: StaffMember[];
  onAssignOpenOrderTailor: (openOrderId: number, staffId: string | null) => void;
  onStartOpenOrderWork: (openOrderId: number) => void;
  onMarkOpenOrderPickupReady: (openOrderId: number, pickupId: string) => void;
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
              onMarkOpenOrderPickupReady={onMarkOpenOrderPickupReady}
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
  stageCounts,
  inHouseTailors,
  onAssignOpenOrderTailor,
  onStartOpenOrderWork,
  onMarkOpenOrderPickupReady,
  onOpenOrderCheckout,
}: {
  openOrders: OpenOrder[];
  stageCounts: OperatorQueueStageCounts;
  inHouseTailors: StaffMember[];
  onAssignOpenOrderTailor: (openOrderId: number, staffId: string | null) => void;
  onStartOpenOrderWork: (openOrderId: number) => void;
  onMarkOpenOrderPickupReady: (openOrderId: number, pickupId: string) => void;
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

  if (!sortedOrders.length) {
    return (
      <div className="app-work-surface">
        <div className="px-4 py-4">
          <SurfaceHeader
            icon={UserRoundCheck}
            title="In-house production"
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
          title="In-house production"
          subtitle="Assign accepted orders, start the work, and move finished pieces to ready."
          titleClassName="app-text-value"
          subtitleClassName="app-text-caption"
        />
        <div className="mt-4">
          <OperatorQueueSummary stageCounts={stageCounts ?? getOperatorQueueStageCounts(sortedOrders)} />
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
            onMarkOpenOrderPickupReady={onMarkOpenOrderPickupReady}
            onOpenOrderCheckout={onOpenOrderCheckout}
          />
        ))}
      </div>
    </div>
  );
}
