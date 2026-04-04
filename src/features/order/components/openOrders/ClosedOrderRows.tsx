import { MapPin } from "lucide-react";
import type { ClosedOrderHistoryItem } from "../../../../types";
import { OpenOrdersTotalSection } from "./OpenOrdersRowSections";
import {
  getClosedOrderCompletedLabel,
  getClosedOrderStatusTone,
  getCompactPickupScheduleSummary,
  getPickupLocationSummary,
  getOrdersStatusTextClassName,
} from "./openOrdersFormatting";

export function ClosedOrderRow({ order }: { order: ClosedOrderHistoryItem }) {
  const pickupSummary = getCompactPickupScheduleSummary(order.pickupSchedules ?? []);
  const locationSummary = getPickupLocationSummary(order.pickupSchedules ?? []);
  const itemSummary = order.itemSummary?.join(", ") || order.label;
  const completedLabel = getClosedOrderCompletedLabel(order.completedAt ?? order.pickupSchedules?.[0]?.pickedUpAt);

  return (
    <>
      <div className="min-w-0">
        <div className="app-text-overline min-[1000px]:hidden">Customer</div>
        <div className="app-text-strong">{order.payerName ?? order.customerName}</div>
        <div className="app-text-caption mt-1">{`Order ${order.displayId ?? order.id}`} • {getClosedOrderCompletedLabel(order.createdAt)}</div>
        <div className="app-text-caption mt-2">{order.orderType === "mixed" ? "Alteration + Custom Garment" : order.orderType === "custom" ? "Custom Garment" : "Alteration"}</div>
      </div>
      <div className="min-w-0">
        <div className="app-text-overline min-[1000px]:hidden">Closed out</div>
        <div className="mt-1 flex flex-wrap items-center gap-2 min-[1000px]:mt-0">
          <div className="app-text-body font-medium">
            {pickupSummary || "Pickup pending"}
          </div>
          {locationSummary ? (
            <>
              <MapPin className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
              <span className="app-text-caption inline-flex items-center gap-1.5">{locationSummary}</span>
            </>
          ) : null}
        </div>
        <div className="app-text-caption mt-1.5 line-clamp-2 min-[1000px]:mt-1">{itemSummary}</div>
      </div>
      <div className="min-w-0">
        <div className="app-text-overline min-[1000px]:hidden">Status</div>
        <div className={getOrdersStatusTextClassName(getClosedOrderStatusTone(order.status))}>
          {order.status}
        </div>
        {completedLabel ? <div className="app-text-caption mt-1">{completedLabel}</div> : null}
      </div>
      <OpenOrdersTotalSection total={order.total} balanceDue={order.balanceDue ?? 0} />
    </>
  );
}
