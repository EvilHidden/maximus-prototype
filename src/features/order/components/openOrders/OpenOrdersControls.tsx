import { getLocationOptions } from "./meta";
import { OpenOrdersDesktopControls } from "./OpenOrdersDesktopControls";
import { OpenOrdersMobileControls } from "./OpenOrdersMobileControls";
import type { OpenOrdersControlsProps } from "./openOrdersControlsShared";

export function OpenOrdersControls(props: OpenOrdersControlsProps) {
  const locationOptions = getLocationOptions(props.pickupLocations);

  return (
    <div className="app-control-deck app-console-deck app-orders-controls-deck px-3 py-3 min-[1000px]:px-4 min-[1000px]:py-3">
      <div className="space-y-3 app-orders-controls-deck__stack">
        <div className="hidden min-[1000px]:flex min-[1000px]:items-end min-[1000px]:justify-between min-[1000px]:gap-6">
          <div className="app-console-intro app-orders-controls-deck__intro">
            <div className="app-text-overline">Queue board</div>
            <div className="app-text-strong mt-1">Watch demand, handoff, and in-house work in one place.</div>
          </div>
        </div>

        <OpenOrdersDesktopControls
          activeView={props.activeView}
          onViewChange={props.onViewChange}
          viewCounts={props.viewCounts}
          query={props.query}
          onQueryChange={props.onQueryChange}
          typeFilter={props.typeFilter}
          onTypeFilterChange={props.onTypeFilterChange}
          locationOptions={locationOptions}
          locationFilter={props.locationFilter}
          onLocationFilterChange={props.onLocationFilterChange}
          activeQueue={props.activeQueue}
          onQueueChange={props.onQueueChange}
          queueCounts={props.queueCounts}
          allOrdersTab={props.allOrdersTab}
          onAllOrdersTabChange={props.onAllOrdersTabChange}
          allOrdersTabCounts={props.allOrdersTabCounts}
        />

        <OpenOrdersMobileControls
          activeView={props.activeView}
          onViewChange={props.onViewChange}
          viewCounts={props.viewCounts}
          query={props.query}
          onQueryChange={props.onQueryChange}
          typeFilter={props.typeFilter}
          onTypeFilterChange={props.onTypeFilterChange}
          locationOptions={locationOptions}
          locationFilter={props.locationFilter}
          onLocationFilterChange={props.onLocationFilterChange}
          activeQueue={props.activeQueue}
          onQueueChange={props.onQueueChange}
          queueCounts={props.queueCounts}
          allOrdersTab={props.allOrdersTab}
          onAllOrdersTabChange={props.onAllOrdersTabChange}
          allOrdersTabCounts={props.allOrdersTabCounts}
        />
      </div>
    </div>
  );
}
