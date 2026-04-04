import { getLocationOptions } from "./meta";
import { OpenOrdersDesktopControls } from "./OpenOrdersDesktopControls";
import { OpenOrdersMobileControls } from "./OpenOrdersMobileControls";
import type { OpenOrdersControlsProps } from "./openOrdersControlsShared";

export function OpenOrdersControls(props: OpenOrdersControlsProps) {
  const locationOptions = getLocationOptions(props.pickupLocations);
  const showOperatorControls = props.activeView === "operator";

  return (
    <div className="app-control-deck app-orders-controls-deck px-3 py-3 min-[1000px]:px-4 min-[1000px]:py-3">
      <div className="space-y-3">
        <OpenOrdersDesktopControls
          activeView={props.activeView}
          onViewChange={props.onViewChange}
          viewCounts={props.viewCounts}
          query={props.query}
          onQueryChange={props.onQueryChange}
          typeFilter={props.typeFilter}
          onTypeFilterChange={props.onTypeFilterChange}
          inHouseTailors={props.inHouseTailors}
          assigneeFilter={props.assigneeFilter}
          onAssigneeFilterChange={props.onAssigneeFilterChange}
          locationOptions={locationOptions}
          locationFilter={props.locationFilter}
          onLocationFilterChange={props.onLocationFilterChange}
          activeQueue={props.activeQueue}
          onQueueChange={props.onQueueChange}
          queueCounts={props.queueCounts}
          allOrdersTab={props.allOrdersTab}
          onAllOrdersTabChange={props.onAllOrdersTabChange}
          allOrdersTabCounts={props.allOrdersTabCounts}
          showOperatorControls={showOperatorControls}
        />

        <OpenOrdersMobileControls
          activeView={props.activeView}
          onViewChange={props.onViewChange}
          viewCounts={props.viewCounts}
          query={props.query}
          onQueryChange={props.onQueryChange}
          typeFilter={props.typeFilter}
          onTypeFilterChange={props.onTypeFilterChange}
          inHouseTailors={props.inHouseTailors}
          assigneeFilter={props.assigneeFilter}
          onAssigneeFilterChange={props.onAssigneeFilterChange}
          locationOptions={locationOptions}
          locationFilter={props.locationFilter}
          onLocationFilterChange={props.onLocationFilterChange}
          activeQueue={props.activeQueue}
          onQueueChange={props.onQueueChange}
          queueCounts={props.queueCounts}
          allOrdersTab={props.allOrdersTab}
          onAllOrdersTabChange={props.onAllOrdersTabChange}
          allOrdersTabCounts={props.allOrdersTabCounts}
          showOperatorControls={showOperatorControls}
        />
      </div>
    </div>
  );
}
