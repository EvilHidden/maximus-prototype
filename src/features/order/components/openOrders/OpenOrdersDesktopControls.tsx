import type { OrderType, PickupLocation } from "../../../../types";
import { CountPill } from "../../../../components/ui/pills";
import { SearchField, SelectField, SelectionChip, cx } from "../../../../components/ui/primitives";
import { Search } from "lucide-react";
import type { AssigneeFilterValue, OrdersQueueKey } from "../../selectors";
import type { AllOrdersTab, OrdersView } from "../../hooks/useOpenOrdersView";
import { queueMeta } from "./meta";
import { getAllOrdersTabOptions, getOpenOrdersViewOptions } from "./openOrdersControlsShared";

export function OpenOrdersDesktopControls({
  activeView,
  onViewChange,
  viewCounts,
  query,
  onQueryChange,
  typeFilter,
  onTypeFilterChange,
  inHouseTailors,
  assigneeFilter,
  onAssigneeFilterChange,
  locationOptions,
  locationFilter,
  onLocationFilterChange,
  activeQueue,
  onQueueChange,
  queueCounts,
  allOrdersTab,
  onAllOrdersTabChange,
  allOrdersTabCounts,
  showOperatorControls,
}: {
  activeView: OrdersView;
  onViewChange: (view: OrdersView) => void;
  viewCounts: { queues: number; ready: number; operator: number; factory: number; all: number };
  query: string;
  onQueryChange: (value: string) => void;
  typeFilter: OrderType | "all";
  onTypeFilterChange: (value: OrderType | "all") => void;
  inHouseTailors: { id: string; name: string }[];
  assigneeFilter: AssigneeFilterValue;
  onAssigneeFilterChange: (value: AssigneeFilterValue) => void;
  locationOptions: Array<PickupLocation | "all">;
  locationFilter: PickupLocation | "all";
  onLocationFilterChange: (value: PickupLocation | "all") => void;
  activeQueue: OrdersQueueKey;
  onQueueChange: (queue: OrdersQueueKey) => void;
  queueCounts: Record<OrdersQueueKey, number>;
  allOrdersTab: AllOrdersTab;
  onAllOrdersTabChange: (tab: AllOrdersTab) => void;
  allOrdersTabCounts: { active: number; closed: number };
  showOperatorControls: boolean;
}) {
  const viewOptions = getOpenOrdersViewOptions(viewCounts);
  const allTabOptions = getAllOrdersTabOptions(allOrdersTabCounts);

  return (
    <>
      <div className="hidden -mx-1 overflow-x-auto pb-1 app-no-scrollbar min-[1000px]:mx-0 min-[1000px]:block min-[1000px]:overflow-visible min-[1000px]:pb-0">
        <div className="flex min-w-max gap-1.5 px-1 min-[1000px]:min-w-0 min-[1000px]:flex-wrap min-[1000px]:gap-2 min-[1000px]:px-0">
          {viewOptions.map((view) => (
            <SelectionChip
              key={view.key}
              selected={activeView === view.key}
              onClick={() => onViewChange(view.key)}
              size="sm"
              className={cx(
                "min-h-9 justify-between whitespace-nowrap px-3",
                activeView === view.key ? "shadow-[inset_0_0_0_1px_var(--app-accent)]" : "bg-[var(--app-surface-muted)]/30",
              )}
              trailing={(
                <CountPill
                  count={view.count}
                  icon={undefined}
                  className={cx(
                    "px-2 py-0.5 text-[11px]",
                    activeView === view.key
                      ? "border-[var(--app-border-strong)] bg-[var(--app-accent)] text-[var(--app-accent-contrast)]"
                      : "border-[var(--app-border)]/55 bg-[var(--app-surface-muted)]/78 text-[var(--app-text-soft)]",
                  )}
                />
              )}
            >
              {view.label}
            </SelectionChip>
          ))}
        </div>
      </div>

      <div className="hidden border-t border-[var(--app-border)]/40 pt-3 min-[1000px]:block">
        <div className="hidden min-[1000px]:flex min-[1000px]:flex-wrap min-[1000px]:items-end min-[1000px]:gap-2.5">
          <SearchField
            label="Search orders"
            value={query}
            onChange={onQueryChange}
            placeholder="Search by customer, garment, or order ID"
            icon={Search}
            density="compact"
            className="min-w-0 min-[1000px]:min-w-[280px] min-[1000px]:flex-[1.4]"
          />

          <SelectField
            label="Type"
            value={typeFilter}
            onChange={(value) => onTypeFilterChange(value as OrderType | "all")}
            density="compact"
            className="min-w-0 min-[1000px]:min-w-[152px] min-[1000px]:flex-[0.82]"
          >
            <option value="all">All order types</option>
            <option value="alteration">Alterations</option>
            <option value="custom">Custom Garment</option>
            <option value="mixed">Custom + Alterations</option>
          </SelectField>

          {activeView !== "all" ? (
            <SelectField
              label={showOperatorControls ? "Viewing queue" : "Assigned to"}
              value={assigneeFilter}
              onChange={(value) => onAssigneeFilterChange(value as AssigneeFilterValue)}
              density="compact"
              className="min-w-0 min-[1000px]:min-w-[164px] min-[1000px]:flex-[0.92]"
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

          <SelectField
            label="Location"
            value={locationFilter}
            onChange={(value) => onLocationFilterChange(value as PickupLocation | "all")}
            density="compact"
            className={cx(
              "min-w-0 min-[1000px]:min-w-[156px] min-[1000px]:flex-[0.86]",
              activeView === "all" ? "min-[1000px]:basis-[190px]" : "",
            )}
          >
            {locationOptions.map((location) => (
              <option key={location} value={location}>
                {location === "all" ? "All locations" : location}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      {activeView === "queues" ? (
        <div className="hidden border-t border-[var(--app-border)]/40 pt-2.5 min-[1000px]:block">
          <div className="-mx-1 overflow-x-auto pb-1 app-no-scrollbar min-[1000px]:mx-0 min-[1000px]:overflow-visible min-[1000px]:pb-0">
            <div className="flex min-w-max gap-1.5 px-1 min-[1000px]:grid min-[1000px]:min-w-0 min-[1000px]:grid-cols-4 min-[1000px]:gap-2 min-[1000px]:px-0">
              {queueMeta.map((queue) => (
                <SelectionChip
                  key={queue.key}
                  selected={activeQueue === queue.key}
                  onClick={() => onQueueChange(queue.key)}
                  size="sm"
                  className={cx(
                    "min-[1000px]:w-full min-[1000px]:justify-between",
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
        </div>
      ) : null}

      {activeView === "all" ? (
        <div className="hidden border-t border-[var(--app-border)]/40 pt-2.5 min-[1000px]:block">
          <div className="-mx-1 overflow-x-auto pb-1 app-no-scrollbar min-[1000px]:mx-0 min-[1000px]:overflow-visible min-[1000px]:pb-0">
            <div className="flex min-w-max gap-1.5 px-1 min-[1000px]:grid min-[1000px]:min-w-0 min-[1000px]:grid-cols-2 min-[1000px]:gap-2 min-[1000px]:px-0">
              {allTabOptions.map((tab) => (
                <SelectionChip
                  key={tab.key}
                  selected={allOrdersTab === tab.key}
                  onClick={() => onAllOrdersTabChange(tab.key)}
                  size="sm"
                  className={cx(
                    "min-[1000px]:w-full min-[1000px]:justify-between",
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
        </div>
      ) : null}
    </>
  );
}
