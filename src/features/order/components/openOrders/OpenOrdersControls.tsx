import type { OrderType, PickupLocation, StaffMember } from "../../../../types";
import { CountPill } from "../../../../components/ui/pills";
import { SearchField, SelectField, SelectionChip, cx } from "../../../../components/ui/primitives";
import { Search } from "lucide-react";
import type { AssigneeFilterValue, OrdersQueueKey } from "../../selectors";
import type { AllOrdersTab, OrdersView } from "../../hooks/useOpenOrdersView";
import { getLocationOptions, queueMeta } from "./meta";

export function OpenOrdersControls({
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
  pickupLocations,
  locationFilter,
  onLocationFilterChange,
  activeQueue,
  onQueueChange,
  queueCounts,
  allOrdersTab,
  onAllOrdersTabChange,
  allOrdersTabCounts,
}: {
  activeView: OrdersView;
  onViewChange: (view: OrdersView) => void;
  viewCounts: { queues: number; ready: number; operator: number; factory: number; all: number };
  query: string;
  onQueryChange: (value: string) => void;
  typeFilter: OrderType | "all";
  onTypeFilterChange: (value: OrderType | "all") => void;
  inHouseTailors: StaffMember[];
  assigneeFilter: AssigneeFilterValue;
  onAssigneeFilterChange: (value: AssigneeFilterValue) => void;
  pickupLocations: PickupLocation[];
  locationFilter: PickupLocation | "all";
  onLocationFilterChange: (value: PickupLocation | "all") => void;
  activeQueue: OrdersQueueKey;
  onQueueChange: (queue: OrdersQueueKey) => void;
  queueCounts: Record<OrdersQueueKey, number>;
  allOrdersTab: AllOrdersTab;
  onAllOrdersTabChange: (tab: AllOrdersTab) => void;
  allOrdersTabCounts: { active: number; closed: number };
}) {
  const locationOptions = getLocationOptions(pickupLocations);
  const showOperatorControls = activeView === "operator";

  return (
    <div className="app-control-deck px-4 py-4 md:px-5">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {([
            { key: "queues", label: "Needs attention", count: viewCounts.queues },
            { key: "ready", label: "Ready", count: viewCounts.ready },
            { key: "operator", label: "Alterations", count: viewCounts.operator },
            { key: "factory", label: "Custom Garments", count: viewCounts.factory },
            { key: "all", label: "All orders", count: viewCounts.all },
          ] as const).map((view) => (
            <SelectionChip
              key={view.key}
              selected={activeView === view.key}
              onClick={() => onViewChange(view.key)}
              className={activeView === view.key ? "shadow-[inset_0_0_0_1px_var(--app-accent)]" : "bg-[var(--app-surface-muted)]/30"}
              trailing={
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
              }
            >
              {view.label}
            </SelectionChip>
          ))}
        </div>

        <div className="border-t border-[var(--app-border)]/40 pt-4">
          <div className="flex flex-wrap items-end gap-3 lg:flex-nowrap">
            <SearchField
              label="Search orders"
              value={query}
              onChange={onQueryChange}
              placeholder="Search by customer, garment, or order ID"
              icon={Search}
              className="min-w-0 basis-full sm:min-w-[240px] sm:flex-1 lg:min-w-[280px] lg:flex-[1.35]"
            />

            <SelectField
              label="Type"
              value={typeFilter}
              onChange={(value) => onTypeFilterChange(value as OrderType | "all")}
              className="min-w-0 basis-full sm:min-w-[160px] lg:min-w-[168px] lg:flex-none"
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
                className="min-w-0 basis-full sm:min-w-[176px] lg:min-w-[184px] lg:flex-none"
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
              className="min-w-0 basis-full sm:min-w-[160px] lg:min-w-[168px] lg:flex-none"
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
          <div className="border-t border-[var(--app-border)]/40 pt-4">
            <div className="-mx-1 overflow-x-auto pb-1 app-no-scrollbar">
              <div className="flex min-w-max gap-2 px-1">
                {queueMeta.map((queue) => (
                  <SelectionChip
                    key={queue.key}
                    selected={activeQueue === queue.key}
                    onClick={() => onQueueChange(queue.key)}
                    className={activeQueue === queue.key ? "shadow-[inset_0_0_0_1px_var(--app-accent)]" : "bg-[var(--app-surface-muted)]/30"}
                    trailing={
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
                    }
                  >
                    {queue.label}
                  </SelectionChip>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {activeView === "all" ? (
          <div className="border-t border-[var(--app-border)]/40 pt-4">
            <div className="-mx-1 overflow-x-auto pb-1 app-no-scrollbar">
              <div className="flex min-w-max gap-2 px-1">
                {([
                  { key: "active", label: "All active orders", count: allOrdersTabCounts.active },
                  { key: "closed", label: "Closed orders", count: allOrdersTabCounts.closed },
                ] as const).map((tab) => (
                  <SelectionChip
                    key={tab.key}
                    selected={allOrdersTab === tab.key}
                    onClick={() => onAllOrdersTabChange(tab.key)}
                    className={allOrdersTab === tab.key ? "shadow-[inset_0_0_0_1px_var(--app-accent)]" : "bg-[var(--app-surface-muted)]/30"}
                    trailing={
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
                    }
                  >
                    {tab.label}
                  </SelectionChip>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
