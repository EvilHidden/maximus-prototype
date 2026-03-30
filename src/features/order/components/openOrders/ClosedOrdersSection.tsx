import { ClipboardList } from "lucide-react";
import type { ClosedOrderHistoryItem } from "../../../../types";
import { EmptyState, cx } from "../../../../components/ui/primitives";
import { formatOpenOrderCreatedAt } from "../../selectors";
import {
  MixedClosedOrderRows,
  OPEN_ORDER_ROW_GRID_CLASS,
  OrdersSectionHeader,
  SingleClosedOrderRow,
  getWorkflowSummaryLabel,
} from "./openOrdersRegistryShared";

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
        {filteredHistoryItems.map((order, index) => (
          <div
            key={order.displayId ?? order.id}
            className={cx("app-table-row", index > 0 && "border-t border-[var(--app-border)]/35")}
          >
            <div className={OPEN_ORDER_ROW_GRID_CLASS}>
              <div className="min-w-0">
                <div className="app-text-strong">{order.payerName ?? order.customerName}</div>
                <div className="app-text-caption mt-1">{`Order ${order.displayId ?? order.id}`} • {formatOpenOrderCreatedAt(order.createdAt)}</div>
                <div className="app-text-caption mt-2">
                  {order.orderType ? getWorkflowSummaryLabel(order.orderType) : "Alteration"}
                </div>
              </div>
              {order.orderType === "mixed" ? <MixedClosedOrderRows order={order} /> : <SingleClosedOrderRow order={order} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
