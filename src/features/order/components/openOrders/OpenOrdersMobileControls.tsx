import { useState } from "react";
import type { OrderType, PickupLocation } from "../../../../types";
import { ActionButton, SearchField, SelectField, Surface } from "../../../../components/ui/primitives";
import { Search, SlidersHorizontal } from "lucide-react";
import type { OrdersQueueKey } from "../../selectors";
import type { AllOrdersTab, OrdersView } from "../../hooks/useOpenOrdersView";
import { queueMeta } from "./meta";
import { getMobileFilterSummary, getOpenOrdersViewOptions } from "./openOrdersControlsShared";
import { OpenOrdersMobileFiltersModal } from "./OpenOrdersMobileFiltersModal";

export function OpenOrdersMobileControls({
  activeView,
  onViewChange,
  viewCounts,
  query,
  onQueryChange,
  typeFilter,
  onTypeFilterChange,
  locationOptions,
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
  locationOptions: Array<PickupLocation | "all">;
  locationFilter: PickupLocation | "all";
  onLocationFilterChange: (value: PickupLocation | "all") => void;
  activeQueue: OrdersQueueKey;
  onQueueChange: (queue: OrdersQueueKey) => void;
  queueCounts: Record<OrdersQueueKey, number>;
  allOrdersTab: AllOrdersTab;
  onAllOrdersTabChange: (tab: AllOrdersTab) => void;
  allOrdersTabCounts: { active: number; closed: number };
}) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const viewOptions = getOpenOrdersViewOptions(viewCounts);
  const activeMobileView = viewOptions.find((view) => view.key === activeView) ?? viewOptions[0];
  const activeQueueLabel = queueMeta.find((queue) => queue.key === activeQueue)?.label ?? "Everything";
  const activeAllOrdersTabLabel = allOrdersTab === "active" ? "All active orders" : "Closed orders";
  const mobileFilterSummary = getMobileFilterSummary({
    typeFilter,
    locationFilter,
    activeView,
    activeQueueLabel,
    activeAllOrdersTabLabel,
  });

  return (
    <>
      <div className="grid gap-2.5 min-[1000px]:hidden">
        <Surface tone="control" className="rounded-none border-0 shadow-none p-3">
          <div className="space-y-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2.5">
              <SelectField
                label="View"
                value={activeView}
                onChange={(value) => onViewChange(value as OrdersView)}
                density="compact"
                className="app-orders-mobile-field min-w-0"
              >
                {viewOptions.map((view) => (
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
                    : "All order types • All locations"}
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

      {mobileFiltersOpen ? (
        <OpenOrdersMobileFiltersModal
          activeView={activeView}
          activeQueue={activeQueue}
          onQueueChange={onQueueChange}
          queueCounts={queueCounts}
          allOrdersTab={allOrdersTab}
          onAllOrdersTabChange={onAllOrdersTabChange}
          allOrdersTabCounts={allOrdersTabCounts}
          typeFilter={typeFilter}
          onTypeFilterChange={onTypeFilterChange}
          locationOptions={locationOptions}
          locationFilter={locationFilter}
          onLocationFilterChange={onLocationFilterChange}
          onClose={() => setMobileFiltersOpen(false)}
        />
      ) : null}
    </>
  );
}
