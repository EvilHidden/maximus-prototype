import { ChevronDown, ClipboardList, MapPin, UserRoundCheck } from "lucide-react";
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

export function OperatorQueueSummary({
  stageCounts,
}: {
  stageCounts: OperatorQueueStageCounts;
}) {
  const handleStageJump = (stageKey: OperatorQueueStageKey) => {
    const target = document.getElementById(`operator-queue-${stageKey}`);
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="overflow-hidden rounded-[calc(var(--app-radius-md)+0.125rem)] border border-[var(--app-border)]/50 bg-[rgba(246,242,234,0.75)] shadow-[0_1px_0_rgba(15,23,42,0.03),0_12px_28px_rgba(15,23,42,0.04)]">
      <div className="grid grid-cols-3 gap-px sm:gap-0">
        {stageMeta.map((stage, index) => (
          <button
            key={stage.key}
            type="button"
            onClick={() => handleStageJump(stage.key)}
            className={cx(
              "flex min-w-0 flex-col items-center justify-center gap-1.5 px-2 py-2 text-center transition-[transform,box-shadow,filter] duration-150 hover:z-[1] hover:brightness-[0.99] focus-visible:z-[1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-primary)]/35 active:translate-y-px sm:items-stretch sm:justify-between sm:gap-0 sm:px-4 sm:py-3 sm:text-left",
              stage.key === "needs_assignment" && "bg-[rgba(248,237,223,0.95)]",
              stage.key === "ready_to_start" && "bg-[rgba(223,230,244,0.98)]",
              stage.key === "in_progress" && "bg-[rgba(231,239,231,0.94)]",
              index > 0 && "border-l border-white/40 sm:border-l sm:border-t-0",
            )}
            aria-label={`Jump to ${stage.title.toLowerCase()} section`}
          >
            <div className="flex min-h-[1.75rem] items-center justify-center min-w-0 sm:min-h-0 sm:items-start sm:justify-between sm:gap-3">
              <div className="min-w-0 sm:pt-0.5">
                <div className="app-text-overline text-[0.52rem] leading-[1.15] text-[var(--app-text-muted)]/90 sm:mb-1 sm:text-[0.58rem] sm:leading-[1.05]">
                  {stage.title}
                </div>
                <div className="app-text-caption mt-1 hidden text-[var(--app-text-muted)]/80 sm:mt-0 sm:block sm:line-clamp-1">
                  {stage.subtitle}
                </div>
              </div>
              <div className="hidden shrink-0 sm:flex sm:items-center sm:justify-end">
                <div className="flex h-9 min-w-9 items-center justify-center rounded-full border border-black/5 bg-white/82 px-3 text-[1.35rem] font-semibold leading-none tracking-[-0.05em] text-[var(--app-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] [font-variant-numeric:tabular-nums]">
                  {stageCounts[stage.key]}
                </div>
              </div>
            </div>
            <div className="flex justify-center sm:hidden">
              <div className="flex h-5 min-w-5 items-center justify-center rounded-full border border-black/5 bg-white/78 px-1.5 text-[0.9rem] font-semibold leading-none tracking-[-0.04em] text-[var(--app-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] [font-variant-numeric:tabular-nums] sm:h-auto sm:min-w-0 sm:px-3 sm:py-2 sm:text-[1.4rem]">
                {stageCounts[stage.key]}
              </div>
            </div>
          </button>
        ))}
      </div>
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
    <div className="app-table-head hidden border-b border-[var(--app-border)]/35 px-4 py-2 pr-14 min-[1000px]:block">
      <div className="grid gap-4 min-[1000px]:grid-cols-[minmax(0,0.76fr)_minmax(0,1fr)_7.25rem_5.5rem_minmax(12.5rem,14rem)_8.75rem] min-[1000px]:items-start">
        <div className="app-text-overline">Customer</div>
        <div className="app-text-overline">Ready by</div>
        <div className="app-text-overline">Status</div>
        <div aria-hidden="true" />
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
      className="group relative cursor-pointer px-4 py-4 pr-12 min-[1000px]:pr-14"
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleRowKeyDown}
    >
      <div className="grid gap-4 min-[1000px]:grid-cols-[minmax(0,0.76fr)_minmax(0,1fr)_7.25rem_5.5rem_minmax(12.5rem,14rem)_8.75rem] min-[1000px]:items-start">
        <div className="min-w-0">
          <div className="app-text-overline min-[1000px]:hidden">Customer</div>
          <div className="app-text-value mt-1 min-w-0 min-[1000px]:mt-0">{openOrder.payerName}</div>
          <div className="app-text-caption mt-1">Order #{openOrder.id} • {formatOpenOrderCreatedAt(openOrder.createdAt)}</div>
          <div className="app-text-body mt-2 text-[var(--app-text)]/82">{getWorkflowSummaryLabel(openOrder.orderType)}</div>
        </div>

        <div className="min-w-0">
          <div className="app-text-overline min-[1000px]:hidden">Ready by</div>
          <div className="mt-1 min-[1000px]:mt-0">
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
                    "min-w-0 py-2.5",
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
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-w-0">
          <div className="app-text-overline min-[1000px]:hidden">Status</div>
          <div className="mt-1 min-[1000px]:mt-0">
            {pickupGroups.map((group, index) => {
              const representativePickup = openOrder.pickupSchedules.find((pickup) => pickup.id === group.pickupIds[0]) ?? null;
              const statusDisplay = representativePickup
                ? getAlterationPickupStatusDisplay(representativePickup, group.alertLabel)
                : null;
              const showPerPickupAction = stage === "in_progress" && group.actionPickupIds.length > 0;
              const showStageAction = index === 0 && stage === "ready_to_start";
              const showStageStatus = index === 0 && stageStatusDisplay;

              return (
                <div
                  key={`${group.key}-status`}
                  className={cx(
                    "flex min-h-14 flex-col items-start justify-center py-2.5",
                    index === 0 ? "pt-0" : "border-t border-[var(--app-border)]/35 pt-2.5",
                  )}
                >
                  {showPerPickupAction && statusDisplay ? (
                    <div className={statusDisplay.className}>{statusDisplay.label}</div>
                  ) : showStageStatus ? (
                    <div className={stageStatusDisplay.className}>{stageStatusDisplay.label}</div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
        <div className="min-w-0">
          <div className="mt-1 min-[1000px]:mt-0">
            {pickupGroups.map((group, index) => {
              const showPerPickupAction = stage === "in_progress" && group.actionPickupIds.length > 0;
              const showStageAction = index === 0 && stage === "ready_to_start";

              return (
                <div
                  key={`${group.key}-action`}
                  className={cx(
                    "flex min-h-14 items-center justify-start py-2.5",
                    index === 0 ? "pt-0" : "border-t border-[var(--app-border)]/35 pt-2.5",
                  )}
                >
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
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-w-0">
          <div className="app-text-overline min-[1000px]:hidden">Assigned tailor</div>
          <div className="mt-1 min-[1000px]:mt-0">
            <TailorAssignmentControl
              openOrder={openOrder}
              inHouseTailors={inHouseTailors}
              onAssignOpenOrderTailor={onAssignOpenOrderTailor}
            />
          </div>
        </div>

        <div className="min-w-0 text-left min-[1000px]:text-right">
          <div className="app-text-overline min-[1000px]:hidden">Total</div>
          <div className="mt-1 min-[1000px]:mt-0">
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
  stageKey,
  title,
  subtitle,
  openOrders,
  inHouseTailors,
  onAssignOpenOrderTailor,
  onStartOpenOrderWork,
  onRequestMarkOpenOrderPickupReady,
  onOpenOrderDetails,
}: {
  stageKey: OperatorQueueStageKey;
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
    <div id={`operator-queue-${stageKey}`} className="app-work-surface scroll-mt-6">
      <div className="px-4 py-4">
        <SurfaceHeader
          icon={ClipboardList}
          title={title}
          subtitle={subtitle}
          className="pb-3"
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
  inHouseTailors,
  onAssignOpenOrderTailor,
  onStartOpenOrderWork,
  onRequestMarkOpenOrderPickupReady,
  onOpenOrderDetails,
}: {
  openOrders: OpenOrder[];
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
            className="pb-3"
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
    <div className="space-y-4 pt-1">
      {stageMeta.map((stage) => (
        <OperatorQueueStageSection
          key={stage.key}
          stageKey={stage.key}
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
  );
}
