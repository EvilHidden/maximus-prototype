import type { OrderType, PickupLocation, StaffMember } from "../../../../types";
import { CountPill } from "../../../../components/ui/pills";
import { ModalShell, SelectField, SelectionChip, cx } from "../../../../components/ui/primitives";
import type { AssigneeFilterValue, OrdersQueueKey } from "../../selectors";
import type { AllOrdersTab, OrdersView } from "../../hooks/useOpenOrdersView";
import { queueMeta } from "./meta";
import { getAllOrdersTabOptions } from "./openOrdersControlsShared";

export function OpenOrdersMobileFiltersModal({
  activeView,
  activeQueue,
  onQueueChange,
  queueCounts,
  allOrdersTab,
  onAllOrdersTabChange,
  allOrdersTabCounts,
  typeFilter,
  onTypeFilterChange,
  locationOptions,
  locationFilter,
  onLocationFilterChange,
  showOperatorControls,
  assigneeFilter,
  onAssigneeFilterChange,
  inHouseTailors,
  onClose,
}: {
  activeView: OrdersView;
  activeQueue: OrdersQueueKey;
  onQueueChange: (queue: OrdersQueueKey) => void;
  queueCounts: Record<OrdersQueueKey, number>;
  allOrdersTab: AllOrdersTab;
  onAllOrdersTabChange: (tab: AllOrdersTab) => void;
  allOrdersTabCounts: { active: number; closed: number };
  typeFilter: OrderType | "all";
  onTypeFilterChange: (value: OrderType | "all") => void;
  locationOptions: Array<PickupLocation | "all">;
  locationFilter: PickupLocation | "all";
  onLocationFilterChange: (value: PickupLocation | "all") => void;
  showOperatorControls: boolean;
  assigneeFilter: AssigneeFilterValue;
  onAssigneeFilterChange: (value: AssigneeFilterValue) => void;
  inHouseTailors: StaffMember[];
  onClose: () => void;
}) {
  const allTabOptions = getAllOrdersTabOptions(allOrdersTabCounts);

  return (
    <ModalShell
      title="Filters"
      subtitle="Refine the orders you are looking at."
      onClose={onClose}
      widthClassName="max-w-[360px]"
    >
      <div className="space-y-3">
        {activeView === "queues" ? (
          <div className="space-y-2">
            <div className="app-text-overline">Needs attention</div>
            <div className="flex flex-wrap gap-1.5">
              {queueMeta.map((queue) => (
                <SelectionChip
                  key={queue.key}
                  selected={activeQueue === queue.key}
                  onClick={() => onQueueChange(queue.key)}
                  size="sm"
                  className={cx(
                    "min-h-9 whitespace-nowrap px-3",
                    activeQueue === queue.key ? "shadow-[inset_0_0_0_1px_var(--app-accent)]" : "bg-[var(--app-surface-muted)]/30",
                  )}
                  trailing={(
                    <CountPill
                      count={queueCounts[queue.key]}
                      icon={undefined}
                      className={cx(
                        "px-2 py-0.5 text-[11px]",
                        activeQueue === queue.key
                          ? "border-[var(--app-border-strong)] bg-[var(--app-accent)] text-[var(--app-accent-contrast)]"
                          : "border-[var(--app-border)]/55 bg-[var(--app-surface-muted)]/78 text-[var(--app-text-soft)]",
                      )}
                    />
                  )}
                >
                  {queue.label}
                </SelectionChip>
              ))}
            </div>
          </div>
        ) : null}

        {activeView === "all" ? (
          <div className="space-y-2">
            <div className="app-text-overline">Show</div>
            <div className="flex flex-wrap gap-1.5">
              {allTabOptions.map((tab) => (
                <SelectionChip
                  key={tab.key}
                  selected={allOrdersTab === tab.key}
                  onClick={() => onAllOrdersTabChange(tab.key)}
                  size="sm"
                  className={cx(
                    "min-h-9 whitespace-nowrap px-3",
                    allOrdersTab === tab.key ? "shadow-[inset_0_0_0_1px_var(--app-accent)]" : "bg-[var(--app-surface-muted)]/30",
                  )}
                  trailing={(
                    <CountPill
                      count={tab.count}
                      icon={undefined}
                      className={cx(
                        "px-2 py-0.5 text-[11px]",
                        allOrdersTab === tab.key
                          ? "border-[var(--app-border-strong)] bg-[var(--app-accent)] text-[var(--app-accent-contrast)]"
                          : "border-[var(--app-border)]/55 bg-[var(--app-surface-muted)]/78 text-[var(--app-text-soft)]",
                      )}
                    />
                  )}
                >
                  {tab.label}
                </SelectionChip>
              ))}
            </div>
          </div>
        ) : null}

        <SelectField
          label="Type"
          value={typeFilter}
          onChange={(value) => onTypeFilterChange(value as OrderType | "all")}
          density="compact"
          className="min-w-0"
        >
          <option value="all">All order types</option>
          <option value="alteration">Alterations</option>
          <option value="custom">Custom Garment</option>
          <option value="mixed">Custom + Alterations</option>
        </SelectField>

        <SelectField
          label="Location"
          value={locationFilter}
          onChange={(value) => onLocationFilterChange(value as PickupLocation | "all")}
          density="compact"
          className="min-w-0"
        >
          {locationOptions.map((location) => (
            <option key={location} value={location}>
              {location === "all" ? "All locations" : location}
            </option>
          ))}
        </SelectField>

        {activeView !== "all" ? (
          <SelectField
            label={showOperatorControls ? "Viewing queue" : "Assigned to"}
            value={assigneeFilter}
            onChange={(value) => onAssigneeFilterChange(value as AssigneeFilterValue)}
            density="compact"
            className="min-w-0"
          >
            <option value="all">{showOperatorControls ? "All in-house work" : "All tailors"}</option>
            <option value="unassigned">Unassigned</option>
            {inHouseTailors.map((staffMember) => (
              <option key={staffMember.id} value={staffMember.id}>
                {staffMember.name}
              </option>
            ))}
          </SelectField>
        ) : null}
      </div>
    </ModalShell>
  );
}
