import { useState } from "react";
import type { OrderType, PickupLocation, StaffMember } from "../../../../types";
import { CountPill } from "../../../../components/ui/pills";
import { ActionButton, ModalShell, SearchField, SelectField, SelectionChip, Surface, cx } from "../../../../components/ui/primitives";
import { Search, SlidersHorizontal } from "lucide-react";
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const mobileViewOptions = [
    { key: "queues" as const, label: "Needs attention", count: viewCounts.queues },
    { key: "ready" as const, label: "Ready", count: viewCounts.ready },
    { key: "operator" as const, label: "Alterations", count: viewCounts.operator },
    { key: "factory" as const, label: "Custom Garments", count: viewCounts.factory },
    { key: "all" as const, label: "All orders", count: viewCounts.all },
  ];
  const activeMobileView = mobileViewOptions.find((view) => view.key === activeView) ?? mobileViewOptions[0];
  const activeQueueLabel = queueMeta.find((queue) => queue.key === activeQueue)?.label ?? "Everything";
  const activeAllOrdersTabLabel = allOrdersTab === "active" ? "All active orders" : "Closed orders";
  const mobileFilterSummary = [
    typeFilter === "all" ? null : typeFilter === "mixed" ? "Custom + Alterations" : typeFilter === "alteration" ? "Alterations" : "Custom Garment",
    locationFilter === "all" ? null : locationFilter,
    activeView !== "all" && assigneeFilter !== "all"
      ? assigneeFilter === "unassigned"
        ? "Unassigned"
        : inHouseTailors.find((staffMember) => staffMember.id === assigneeFilter)?.name ?? null
      : null,
    activeView === "queues" ? activeQueueLabel : null,
    activeView === "all" ? activeAllOrdersTabLabel : null,
  ].filter(Boolean) as string[];

  return (
    <div className="app-control-deck app-orders-controls-deck px-3 py-3 min-[1000px]:px-4 min-[1000px]:py-3">
      <div className="space-y-3">
        <div className="hidden -mx-1 overflow-x-auto pb-1 app-no-scrollbar min-[1000px]:mx-0 min-[1000px]:block min-[1000px]:overflow-visible min-[1000px]:pb-0">
          <div className="flex min-w-max gap-1.5 px-1 min-[1000px]:min-w-0 min-[1000px]:flex-wrap min-[1000px]:gap-2 min-[1000px]:px-0">
            {mobileViewOptions.map((view) => (
              <SelectionChip
                key={view.key}
                selected={activeView === view.key}
                onClick={() => onViewChange(view.key)}
                size="sm"
                className={cx(
                  "min-h-9 justify-between whitespace-nowrap px-3",
                  activeView === view.key ? "shadow-[inset_0_0_0_1px_var(--app-accent)]" : "bg-[var(--app-surface-muted)]/30",
                )}
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
        </div>

        <div className="grid gap-2.5 min-[1000px]:hidden">
          <Surface tone="control" className="p-3">
            <div className="space-y-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2.5">
                <SelectField
                  label="View"
                  value={activeView}
                  onChange={(value) => onViewChange(value as OrdersView)}
                  density="compact"
                  className="app-orders-mobile-field min-w-0"
                >
                  {mobileViewOptions.map((view) => (
                    <option key={view.key} value={view.key}>
                      {view.label}
                    </option>
                  ))}
                </SelectField>
                <div className="app-text-caption pb-2 whitespace-nowrap">{activeMobileView.count} orders</div>
              </div>

              <SearchField
                label="Search orders"
                value={query}
                onChange={onQueryChange}
                placeholder="Search by customer, garment, or order ID"
                icon={Search}
                density="compact"
                className="app-orders-mobile-field min-w-0"
              />

              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="app-text-overline">Filters</div>
                  <div className="app-text-caption mt-1">
                    {mobileFilterSummary.length
                      ? mobileFilterSummary.join(" • ")
                      : `All order types • All locations${activeView !== "all" ? " • All assignees" : ""}`}
                  </div>
                </div>
                <ActionButton
                  tone="secondary"
                  className="min-h-9 shrink-0 px-3 py-1.5 text-[0.72rem]"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters
                </ActionButton>
              </div>
            </div>
          </Surface>
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
            <div className="-mx-1 overflow-x-auto pb-1 app-no-scrollbar">
              <div className="flex min-w-max gap-1.5 px-1">
                {queueMeta.map((queue) => (
                  <SelectionChip
                    key={queue.key}
                    selected={activeQueue === queue.key}
                    onClick={() => onQueueChange(queue.key)}
                    size="sm"
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
          <div className="hidden border-t border-[var(--app-border)]/40 pt-2.5 min-[1000px]:block">
            <div className="-mx-1 overflow-x-auto pb-1 app-no-scrollbar">
              <div className="flex min-w-max gap-1.5 px-1">
                {([
                  { key: "active", label: "All active orders", count: allOrdersTabCounts.active },
                  { key: "closed", label: "Closed orders", count: allOrdersTabCounts.closed },
                ] as const).map((tab) => (
                  <SelectionChip
                    key={tab.key}
                    selected={allOrdersTab === tab.key}
                    onClick={() => onAllOrdersTabChange(tab.key)}
                    size="sm"
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
      {mobileFiltersOpen ? (
        <ModalShell
          title="Filters"
          subtitle="Refine the orders you are looking at."
          onClose={() => setMobileFiltersOpen(false)}
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
            ) : null}

            {activeView === "all" ? (
              <div className="space-y-2">
                <div className="app-text-overline">Show</div>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    { key: "active", label: "All active orders", count: allOrdersTabCounts.active },
                    { key: "closed", label: "Closed orders", count: allOrdersTabCounts.closed },
                  ] as const).map((tab) => (
                    <SelectionChip
                      key={tab.key}
                      selected={allOrdersTab === tab.key}
                      onClick={() => onAllOrdersTabChange(tab.key)}
                      size="sm"
                      className={cx(
                        "min-h-9 whitespace-nowrap px-3",
                        allOrdersTab === tab.key ? "shadow-[inset_0_0_0_1px_var(--app-accent)]" : "bg-[var(--app-surface-muted)]/30",
                      )}
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
      ) : null}
    </div>
  );
}
