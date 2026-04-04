import type { OrderType, PickupLocation, StaffMember } from "../../../../types";
import type { AssigneeFilterValue, OrdersQueueKey } from "../../selectors";
import type { AllOrdersTab, OrdersView } from "../../hooks/useOpenOrdersView";

export type OpenOrdersControlsProps = {
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
};

export function getOpenOrdersViewOptions(viewCounts: OpenOrdersControlsProps["viewCounts"]) {
  return [
    { key: "queues" as const, label: "Needs attention", count: viewCounts.queues },
    { key: "ready" as const, label: "Ready", count: viewCounts.ready },
    { key: "operator" as const, label: "Alterations", count: viewCounts.operator },
    { key: "factory" as const, label: "Custom Garments", count: viewCounts.factory },
    { key: "all" as const, label: "All orders", count: viewCounts.all },
  ];
}

export function getAllOrdersTabOptions(allOrdersTabCounts: OpenOrdersControlsProps["allOrdersTabCounts"]) {
  return [
    { key: "active" as const, label: "All active orders", count: allOrdersTabCounts.active },
    { key: "closed" as const, label: "Closed orders", count: allOrdersTabCounts.closed },
  ];
}

export function getMobileFilterSummary({
  typeFilter,
  locationFilter,
  activeView,
  assigneeFilter,
  inHouseTailors,
  activeQueueLabel,
  activeAllOrdersTabLabel,
}: {
  typeFilter: OpenOrdersControlsProps["typeFilter"];
  locationFilter: OpenOrdersControlsProps["locationFilter"];
  activeView: OpenOrdersControlsProps["activeView"];
  assigneeFilter: OpenOrdersControlsProps["assigneeFilter"];
  inHouseTailors: OpenOrdersControlsProps["inHouseTailors"];
  activeQueueLabel: string;
  activeAllOrdersTabLabel: string;
}) {
  return [
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
}
