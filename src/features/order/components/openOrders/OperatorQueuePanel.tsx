import { ChevronDown, ClipboardList, MapPin, PlayCircle, UserRoundCheck } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { OpenOrder, OpenOrderPickup, StaffMember } from "../../../../types";
import { ActionButton, EmptyState, RowChevronAffordance, SurfaceHeader, cx } from "../../../../components/ui/primitives";
import {
  formatOpenOrderCreatedAt,
  getInHouseOpenOrderPickups,
  getOpenOrderPickupGroups,
  getOperationalPickupDateLabel,
  getOperationalPickupTimeLabel,
  getOperatorQueueStage,
  getOperatorQueueStageCounts,
  sortOperatorQueueOrders,
  type OperatorQueueStageCounts,
  type OperatorQueueStageKey,
} from "../../selectors";
import { formatWorklistTotal, getWorklistPaymentLabel, getWorklistPaymentTextClassName } from "./meta";

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

function getWorkflowSummaryLabel(orderType: OpenOrder["orderType"]) {
  if (orderType === "mixed") {
    return "Alteration + Custom Garment";
  }

  if (orderType === "custom") {
    return "Custom Garment";
  }

  return "Alteration";
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

function getAlterationItemSummary(pickup: OpenOrderPickup | null, openOrder: OpenOrder) {
  if (pickup?.itemSummary.length) {
    return pickup.itemSummary.join(", ");
  }

  return openOrder.itemSummary.join(", ");
}

function getOperatorStatusTextClassName(tone: "default" | "dark" | "success" | "warn" | "danger") {
  if (tone === "success") {
    return "text-[0.82rem] font-semibold leading-tight text-[var(--app-success-text)]";
  }

  if (tone === "danger") {
    return "text-[0.82rem] font-semibold leading-tight text-[var(--app-danger-text)]";
  }

  if (tone === "dark") {
    return "text-[0.82rem] font-semibold leading-tight text-[var(--app-text)]";
  }

  if (tone === "warn") {
    return "text-[0.82rem] font-semibold leading-tight text-[var(--app-warn-text)]";
  }

  return "text-[0.82rem] font-semibold leading-tight text-[var(--app-text-muted)]";
}

function getOperatorStageStatusDisplay(stage: OperatorQueueStageKey) {
  if (stage === "ready_to_start") {
    return {
      label: "Assigned",
      className: getOperatorStatusTextClassName("dark"),
    };
  }

  if (stage === "needs_assignment") {
    return {
      label: "Needs tailor",
      className: getOperatorStatusTextClassName("warn"),
    };
  }

  return null;
}

function getAlterationPickupStatusDisplay(
  pickup: OpenOrderPickup | null,
  alertLabel: string,
) {
  if (!pickup) {
    return null;
  }

  if (alertLabel === "Past promised ready time") {
    return {
      label: "Overdue",
      className: getOperatorStatusTextClassName("danger"),
    };
  }

  if (pickup.readyForPickup) {
    return {
      label: "Ready",
      className: getOperatorStatusTextClassName("success"),
    };
  }

  return {
    label: "In progress",
    className: getOperatorStatusTextClassName("default"),
  };
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
      <div className="app-field-control relative min-h-[2.5rem] px-2.5 py-1.5">
        <select
          aria-label={`Assign tailor for order ${openOrder.id}`}
          value={openOrder.inHouseAssignee?.id ?? "unassigned"}
          onChange={(event) => onAssignOpenOrderTailor(openOrder.id, event.target.value === "unassigned" ? null : event.target.value)}
          className="app-text-body-muted min-w-0 flex-1 appearance-none pr-8"
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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.76fr)_minmax(0,1.15fr)_minmax(12.5rem,14rem)_8.75rem] lg:items-center">
        <div className="app-text-overline">Customer</div>
        <div className="app-text-overline">Ready by</div>
        <div className="app-text-overline">Assigned tailor</div>
        <div className="app-text-overline text-right">Total</div>
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
  onOpenOrderDetails,
}: {
  openOrder: OpenOrder;
  inHouseTailors: StaffMember[];
  onAssignOpenOrderTailor: (openOrderId: number, staffId: string | null) => void;
  onStartOpenOrderWork: (openOrderId: number) => void;
  onRequestMarkOpenOrderPickupReady: (openOrder: OpenOrder, pickupIds: string[]) => void;
  onOpenOrderDetails: (openOrderId: number) => void;
}) {
  const stage = getOperatorQueueStage(openOrder);
  const pickupGroups = getOpenOrderPickupGroups(openOrder, { scopes: ["alteration"] });
  const stageStatusDisplay = getOperatorStageStatusDisplay(stage);
  const handleOpen = () => onOpenOrderDetails(openOrder.id);
  const handleRowKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpen();
    }
  };

  if (!stage) {
    return null;
  }

  return (
    <div
      className="group relative cursor-pointer px-4 py-4 pr-12 lg:pr-14"
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleRowKeyDown}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.76fr)_minmax(0,1.15fr)_minmax(12.5rem,14rem)_8.75rem] lg:items-start">
        <div className="min-w-0">
          <div className="app-text-overline lg:hidden">Customer</div>
          <div className="app-text-value mt-1 min-w-0 lg:mt-0">{openOrder.payerName}</div>
          <div className="app-text-caption mt-1">Order #{openOrder.id} • {formatOpenOrderCreatedAt(openOrder.createdAt)}</div>
          <div className="app-text-body mt-2 text-[var(--app-text)]/82">{getWorkflowSummaryLabel(openOrder.orderType)}</div>
        </div>

        <div className="min-w-0">
          <div className="app-text-overline lg:hidden">Ready by</div>
          <div className="mt-1 lg:mt-0">
            {pickupGroups.map((group, index) => {
              const representativePickup = openOrder.pickupSchedules.find((pickup) => pickup.id === group.pickupIds[0]) ?? null;
              const dateLabel = representativePickup
                ? getOperationalPickupDateLabel(representativePickup.pickupDate, representativePickup.pickupTime)
                : null;
              const timeLabel = representativePickup
                ? getOperationalPickupTimeLabel(representativePickup.pickupDate, representativePickup.pickupTime)
                : null;
              const itemSummary = getAlterationItemSummary(representativePickup, openOrder);
              const statusDisplay = representativePickup
                ? getAlterationPickupStatusDisplay(representativePickup, group.alertLabel)
                : null;
              const showPerPickupAction = stage === "in_progress" && group.actionPickupIds.length > 0;
              const showStageAction = index === 0 && stage === "ready_to_start";
              const showStageStatus = index === 0 && stageStatusDisplay;

              return (
                <div
                  key={group.key}
                  className={cx(
                    "grid min-w-0 gap-3 py-2.5 lg:grid-cols-[minmax(0,1fr)_6.5rem_4.75rem] lg:items-center",
                    index === 0 ? "pt-0" : "",
                  )}
                >
                  <div className={cx("min-w-0", index > 0 && "border-t border-[var(--app-border)]/35 pt-2.5")}>
                    <div className="app-text-body font-medium">
                      {dateLabel ?? "Date pending"}{timeLabel ? ` · ${timeLabel}` : ""}
                    </div>
                    {representativePickup?.pickupLocation ? (
                      <div className="app-text-caption mt-1 inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
                        <span>{representativePickup.pickupLocation}</span>
                      </div>
                    ) : null}
                    <div className="app-text-caption mt-1 line-clamp-2">{itemSummary}</div>
                  </div>
                  <div className={cx("min-w-0", index > 0 && "pt-2.5")}>
                    <div className="flex min-h-14 items-center">
                      {showPerPickupAction && statusDisplay ? (
                        <div className={statusDisplay.className}>{statusDisplay.label}</div>
                      ) : showStageStatus ? (
                        <div className={stageStatusDisplay.className}>{stageStatusDisplay.label}</div>
                      ) : null}
                    </div>
                  </div>
                  <div className={cx("flex min-h-14 items-center justify-end", index > 0 && "pt-2.5")}>
                    {showPerPickupAction ? (
                      <ActionButton
                        tone="primary"
                        className="min-w-[4.5rem] justify-center whitespace-nowrap px-2.75 py-1.25 text-[0.68rem]"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRequestMarkOpenOrderPickupReady(openOrder, group.actionPickupIds);
                        }}
                      >
                        Ready
                      </ActionButton>
                    ) : showStageAction ? (
                      <ActionButton
                        tone="primary"
                        className="min-w-[4.75rem] justify-center whitespace-nowrap px-2.75 py-1.25 text-[0.68rem]"
                        onClick={(event) => {
                          event.stopPropagation();
                          onStartOpenOrderWork(openOrder.id);
                        }}
                      >
                        Start
                      </ActionButton>
                    ) : (
                      <span className="app-text-caption opacity-0">No action</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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

        <div className="min-w-0 text-left lg:text-right">
          <div className="app-text-overline lg:hidden">Total</div>
          <div className="mt-1 lg:mt-0">
            <div className="text-[1.375rem] font-semibold leading-none tracking-[-0.01em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
              {formatWorklistTotal(openOrder.total)}
            </div>
            <div className="mt-1.5">
              <span className={getWorklistPaymentTextClassName(openOrder.balanceDue)}>{getWorklistPaymentLabel(openOrder.balanceDue)}</span>
            </div>
          </div>
        </div>
      </div>
      <RowChevronAffordance />
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
  onOpenOrderDetails,
}: {
  title: string;
  subtitle: string;
  openOrders: OpenOrder[];
  inHouseTailors: StaffMember[];
  onAssignOpenOrderTailor: (openOrderId: number, staffId: string | null) => void;
  onStartOpenOrderWork: (openOrderId: number) => void;
  onRequestMarkOpenOrderPickupReady: (openOrder: OpenOrder, pickupIds: string[]) => void;
  onOpenOrderDetails: (openOrderId: number) => void;
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
              onOpenOrderDetails={onOpenOrderDetails}
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
  onOpenOrderDetails,
}: {
  openOrders: OpenOrder[];
  stageCounts: OperatorQueueStageCounts;
  inHouseTailors: StaffMember[];
  onAssignOpenOrderTailor: (openOrderId: number, staffId: string | null) => void;
  onStartOpenOrderWork: (openOrderId: number) => void;
  onRequestMarkOpenOrderPickupReady: (openOrder: OpenOrder, pickupIds: string[]) => void;
  onOpenOrderDetails: (openOrderId: number) => void;
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
            onOpenOrderDetails={onOpenOrderDetails}
          />
        ))}
      </div>
    </div>
  );
}
