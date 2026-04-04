import { ClipboardList } from "lucide-react";
import type { ClosedOrderHistoryItem } from "../../../../types";
import { EmptyState } from "../../../../components/ui/primitives";
import { ClosedOrderRow } from "./ClosedOrderRows";
import { ClosedOrdersColumnHeader, CLOSED_ORDER_ROW_GRID_CLASS, OrdersSectionHeader, openOrdersSectionClassName } from "./openOrdersLayout";

export function ClosedOrdersSection({
  filteredHistoryItems,
}: {
  filteredHistoryItems: ClosedOrderHistoryItem[];
}) {
  if (!filteredHistoryItems.length) {
    return (
      <div className="app-work-surface">
        <OrdersSectionHeader
          icon={ClipboardList}
          title="Closed orders"
          subtitle="Recent finished orders, kept here for reference."
        />
        <div className="border-t border-[var(--app-border)]/45">
          <EmptyState className="rounded-none border-0 bg-transparent shadow-none">
            No closed orders match this search.
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="app-work-surface">
      <OrdersSectionHeader
        icon={ClipboardList}
        title="Closed orders"
        subtitle="Recent finished orders, kept here for reference."
      />
      <div className="border-t border-[var(--app-border)]/45">
        <ClosedOrdersColumnHeader />
        {filteredHistoryItems.map((order, index) => (
          <div
            key={order.displayId ?? order.id}
            className={openOrdersSectionClassName(index > 0)}
          >
            <div className={CLOSED_ORDER_ROW_GRID_CLASS}>
              <ClosedOrderRow order={order} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
