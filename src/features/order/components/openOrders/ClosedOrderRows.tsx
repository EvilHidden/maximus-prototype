import { MapPin } from "lucide-react";
import type { ClosedOrderHistoryItem } from "../../../../types";
import { getOperationalPickupDateLabel, getOperationalPickupTimeLabel } from "../../selectors";
import { getWorklistPaymentLabel, getWorklistPaymentTextClassName, formatWorklistTotal } from "./meta";
import {
  getClosedOrderCompletedLabel,
  getClosedOrderStatusTone,
  getClosedScopeLabel,
  getCompactPickupScheduleSummary,
  getOrdersStatusTextClassName,
} from "./openOrdersFormatting";

export function MixedClosedOrderRows({ order }: { order: ClosedOrderHistoryItem }) {
  return (
    <div className="min-w-0 min-[1000px]:col-span-2">
      <div className="app-text-overline min-[1000px]:hidden">Order details</div>
      <div className="mt-1">
        {order.pickupSchedules.map((pickup, pickupIndex) => (
          <div
            key={pickup.id}
            className={
              pickupIndex === 0
                ? "grid min-w-0 gap-3 py-2.5 min-[1000px]:grid-cols-[minmax(0,0.9fr)_minmax(16rem,0.82fr)] min-[1000px]:items-start"
                : "grid min-w-0 gap-3 border-t border-[var(--app-border)]/35 py-2.5 min-[1000px]:grid-cols-[minmax(0,0.9fr)_minmax(16rem,0.82fr)] min-[1000px]:items-start"
            }
          >
            <div className="min-w-0">
              <div className="app-text-caption">{getClosedScopeLabel(pickup.scope)}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <div className="app-text-body font-medium">
                  {[getOperationalPickupDateLabel(pickup.pickupDate, pickup.pickupTime), getOperationalPickupTimeLabel(pickup.pickupDate, pickup.pickupTime)]
                    .filter(Boolean)
                    .join(" • ") || "Pickup pending"}
                </div>
                <MapPin className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
                <span className="app-text-caption inline-flex items-center gap-1.5">
                  {pickup.pickupLocation || "Pending"}
                </span>
              </div>
              <div className="app-text-caption mt-1 line-clamp-2">
                {pickup.itemSummary.join(", ")}
              </div>
              {pickupIndex === 0 && order.inHouseAssignee ? (
                <div className="app-text-caption mt-1">Assigned to {order.inHouseAssignee.name}</div>
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="mt-1 grid gap-3 md:grid-cols-[minmax(0,1fr)_7rem] md:items-start">
                <div className="min-w-0">
                  <div className={getOrdersStatusTextClassName(getClosedOrderStatusTone(order.status))}>
                    Picked up
                  </div>
                  {pickup.pickedUpAt ? (
                    <div className="app-text-caption mt-1">
                      {getClosedOrderCompletedLabel(pickup.pickedUpAt)}
                    </div>
                  ) : null}
                </div>
                <div className="text-left md:text-right">
                  {pickupIndex === 0 ? (
                    <>
                      <div className="text-[1.375rem] font-semibold leading-none tracking-[-0.01em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
                        {formatWorklistTotal(order.total)}
                      </div>
                      <div className="mt-1.5">
                        <span className={getWorklistPaymentTextClassName(order.balanceDue ?? 0)}>
                          {getWorklistPaymentLabel(order.balanceDue ?? 0)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="app-text-caption opacity-0">Paid</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SingleClosedOrderRow({ order }: { order: ClosedOrderHistoryItem }) {
  return (
    <>
      <div className="min-w-0">
        <div className="app-text-overline min-[1000px]:hidden">Order details</div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <div className="app-text-body font-medium">
            {getCompactPickupScheduleSummary(order.pickupSchedules) || "Pickup pending"}
          </div>
          <MapPin className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
          <span className="app-text-caption inline-flex items-center gap-1.5">
            {order.pickupSchedules?.length
              ? [...new Set(order.pickupSchedules.map((pickup) => pickup.pickupLocation).filter(Boolean))].join(" • ")
              : "Pending"}
          </span>
        </div>
        <div className="app-text-caption mt-1 line-clamp-2">
          {order.itemSummary?.join(", ") || order.label}
        </div>
        {order.inHouseAssignee ? (
          <div className="app-text-caption mt-1">Assigned to {order.inHouseAssignee.name}</div>
        ) : null}
      </div>
      <div className="min-w-0 text-left">
        <div className="app-text-overline min-[1000px]:hidden">Total</div>
        <div className="mt-1 grid gap-3 md:grid-cols-[minmax(0,1fr)_7rem] md:items-start">
          <div className="min-w-0">
            <div className={getOrdersStatusTextClassName(getClosedOrderStatusTone(order.status))}>
              {order.status}
            </div>
            {order.status === "Picked up" && order.completedAt ? (
              <div className="app-text-caption mt-1">
                {getClosedOrderCompletedLabel(order.completedAt)}
              </div>
            ) : null}
          </div>
          <div className="text-left md:text-right">
            <div className="text-[1.375rem] font-semibold leading-none tracking-[-0.01em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
              {formatWorklistTotal(order.total)}
            </div>
            <div className="mt-1.5">
              <span className={getWorklistPaymentTextClassName(order.balanceDue ?? 0)}>
                {getWorklistPaymentLabel(order.balanceDue ?? 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
