import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import type { Appointment, ClosedOrderHistoryItem, OpenOrder } from "../types";
import { ActionButton, Card, EmptyState, EntityRow, SectionHeader, StatusPill, cx } from "../components/ui/primitives";
import { CountPill, LocationPill, OrderStatusPill, PaymentStatusPill } from "../components/ui/pills";
import { formatPickupSchedule, formatSummaryCurrency, getCustomFulfillmentSummary } from "../features/order/selectors";

type OpenOrdersScreenProps = {
  openOrders: OpenOrder[];
  closedOrderHistory: ClosedOrderHistoryItem[];
  pickupAppointments: Appointment[];
  onMarkOpenOrderPickupReady: (openOrderId: number, pickupId: string) => void;
  onStartNewOrder: () => void;
};

type OrdersTab = "open" | "history";
type PickupAlertTone = "default" | "warn" | "danger" | "success";

function normalizePickupTime(timeValue: string) {
  if (/^\d{2}:\d{2}$/.test(timeValue)) {
    return timeValue;
  }

  const match = timeValue.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return null;
  }

  const [, rawHour, minute, meridiem] = match;
  let hour = Number(rawHour);
  if (Number.isNaN(hour)) {
    return null;
  }

  const isPm = meridiem.toUpperCase() === "PM";
  if (isPm && hour !== 12) {
    hour += 12;
  }

  if (!isPm && hour === 12) {
    hour = 0;
  }

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function getPickupDateTime(dateValue: string, timeValue: string) {
  const normalizedTime = normalizePickupTime(timeValue);
  if (!dateValue || !normalizedTime) {
    return null;
  }

  const dateTime = new Date(`${dateValue}T${normalizedTime}`);
  return Number.isNaN(dateTime.getTime()) ? null : dateTime;
}

function getPickupTimingLabel(dateValue: string) {
  const target = new Date(`${dateValue}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (target.toDateString() === today.toDateString()) {
    return "Pickup due today";
  }

  if (target.toDateString() === tomorrow.toDateString()) {
    return "Pickup due tomorrow";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(target);
}

function getPickupAlertState(dateValue: string, timeValue: string, readyForPickup: boolean) {
  if (readyForPickup) {
    return {
      tone: "success" as PickupAlertTone,
      label: "Ready for pickup",
    };
  }

  const pickupDateTime = getPickupDateTime(dateValue, timeValue);
  if (!pickupDateTime) {
    return {
      tone: "default" as PickupAlertTone,
      label: null,
    };
  }

  const minutesUntilPickup = (pickupDateTime.getTime() - Date.now()) / 60000;
  if (minutesUntilPickup < 0) {
    return {
      tone: "danger" as PickupAlertTone,
      label: "Running late",
    };
  }

  if (minutesUntilPickup <= 60) {
    return {
      tone: "warn" as PickupAlertTone,
      label: "Pickup within 1 hour",
    };
  }

  return {
    tone: "default" as PickupAlertTone,
    label: null,
  };
}

function getPickupToneClass(tone: PickupAlertTone) {
  if (tone === "warn") {
    return "text-[var(--app-warn-text)]";
  }

  if (tone === "danger") {
    return "text-[var(--app-danger-text)]";
  }

  if (tone === "success") {
    return "text-[var(--app-success-text)]";
  }

  return "text-[var(--app-text)]";
}

function getOrderTypeLabel(orderType: OpenOrder["orderType"]) {
  if (orderType === "custom") {
    return "Custom garment order";
  }

  if (orderType === "mixed") {
    return "Mixed order";
  }

  return "Alteration order";
}

function getPickupStatusSummary(openOrder: OpenOrder["pickupSchedules"][number]) {
  if (openOrder.scope === "custom" && !openOrder.pickupDate) {
    return getCustomFulfillmentSummary(openOrder.eventType, openOrder.eventDate, openOrder.pickupLocation);
  }

  const pickupSummary = formatPickupSchedule(openOrder.pickupDate, openOrder.pickupTime);
  return `${pickupSummary ?? "Pickup details pending"}${openOrder.pickupLocation ? ` • ${openOrder.pickupLocation}` : ""}`;
}

export function OpenOrdersScreen({
  openOrders,
  closedOrderHistory,
  pickupAppointments,
  onMarkOpenOrderPickupReady,
  onStartNewOrder,
}: OpenOrdersScreenProps) {
  const [activeTab, setActiveTab] = useState<OrdersTab>("open");
  const totalOpenItems = openOrders.length + pickupAppointments.length;
  const totalHistoryItems = closedOrderHistory.length;
  const activeSubtitle = activeTab === "open"
    ? (totalOpenItems === 1 ? "1 active order or pickup" : `${totalOpenItems} active orders and pickups`)
    : (totalHistoryItems === 1 ? "1 closed order" : `${totalHistoryItems} closed orders`);
  const historyItems = useMemo(
    () => [...closedOrderHistory],
    [closedOrderHistory],
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <SectionHeader
          icon={ClipboardList}
          title="Orders"
          subtitle={activeSubtitle}
          action={
            <ActionButton tone="primary" className="px-3 py-2 text-xs" onClick={onStartNewOrder}>
              New order
            </ActionButton>
          }
        />

        <div className="mb-4 flex flex-wrap gap-2 border-b border-[var(--app-border)] pb-4">
          <button
            onClick={() => setActiveTab("open")}
            className={cx(
              "inline-flex min-h-10 items-center gap-2 rounded-[var(--app-radius-md)] border px-3.5 py-2 text-sm font-medium transition",
              activeTab === "open"
                ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-[var(--app-accent-contrast)]"
                : "border-[var(--app-border)] bg-[var(--app-surface-muted)]/30 text-[var(--app-text-muted)] hover:text-[var(--app-text)]",
            )}
          >
            Open orders
            <CountPill
              count={totalOpenItems}
              icon={undefined}
              className={cx(
                "px-2 py-0.5 text-[11px]",
                activeTab === "open"
                  ? "border-transparent bg-[rgba(255,255,255,0.18)] text-[var(--app-accent-contrast)]"
                  : "border-transparent bg-[var(--app-surface)] text-[var(--app-text-soft)]",
              )}
            />
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cx(
              "inline-flex min-h-10 items-center gap-2 rounded-[var(--app-radius-md)] border px-3.5 py-2 text-sm font-medium transition",
              activeTab === "history"
                ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-[var(--app-accent-contrast)]"
                : "border-[var(--app-border)] bg-[var(--app-surface-muted)]/30 text-[var(--app-text-muted)] hover:text-[var(--app-text)]",
            )}
          >
            Order history
            <CountPill
              count={totalHistoryItems}
              icon={undefined}
              className={cx(
                "px-2 py-0.5 text-[11px]",
                activeTab === "history"
                  ? "border-transparent bg-[rgba(255,255,255,0.18)] text-[var(--app-accent-contrast)]"
                  : "border-transparent bg-[var(--app-surface)] text-[var(--app-text-soft)]",
              )}
            />
          </button>
        </div>

        {activeTab === "open" ? (
          totalOpenItems === 0 ? (
            <EmptyState>No open orders yet. Scheduled pickups and newly created work orders will appear here.</EmptyState>
          ) : (
            <div className="space-y-3">
              {pickupAppointments.map((appointment) => (
                <Card key={appointment.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="app-text-value">{appointment.customer}</div>
                      <div className="app-text-caption mt-1">
                        {appointment.pickupSummary ?? appointment.type}
                      </div>
                    </div>
                    <LocationPill location={appointment.location} />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <EntityRow title="Pickup appointment" subtitle={`${getPickupTimingLabel(appointment.date)} • ${appointment.time}`} />
                    <EntityRow title="Prep status" subtitle={appointment.missing === "Complete" ? "Ready for release" : appointment.missing} />
                  </div>
                </Card>
              ))}

              {openOrders.map((openOrder) => {
                return (
                  <Card key={openOrder.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="app-text-value">{openOrder.payerName}</div>
                        <div className="app-text-caption mt-1">
                          {getOrderTypeLabel(openOrder.orderType)} • {openOrder.createdAtLabel}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <PaymentStatusPill status={openOrder.paymentStatus} />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                      <div className="space-y-3">
                        {openOrder.pickupSchedules.map((pickup) => {
                          const pickupAlert = getPickupAlertState(pickup.pickupDate, pickup.pickupTime, pickup.readyForPickup);
                          const pickupSummary = getPickupStatusSummary(pickup);

                          return (
                            <div key={pickup.id} className="rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)]/20 px-3.5 py-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="app-text-caption">{pickup.label}</div>
                                  <div className={cx("mt-1 text-sm font-semibold", getPickupToneClass(pickupAlert.tone))}>
                                    {pickupSummary}
                                  </div>
                                  <div className="app-text-caption mt-1">{pickup.itemSummary.join(", ")}</div>
                                  {pickupAlert.label ? (
                                    <div className={cx("mt-1 text-xs font-medium", getPickupToneClass(pickupAlert.tone))}>
                                      {pickupAlert.label}
                                    </div>
                                  ) : null}
                                </div>
                                {pickup.readyForPickup ? (
                                  <StatusPill tone="success">Ready</StatusPill>
                                ) : (
                                  <ActionButton
                                    tone="secondary"
                                    className="px-3 py-2 text-xs"
                                    onClick={() => onMarkOpenOrderPickupReady(openOrder.id, pickup.id)}
                                  >
                                    Mark as ready
                                  </ActionButton>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)]/20 px-3.5 py-3">
                        <div className="app-text-caption">Collected today</div>
                        <div className="mt-1 app-text-strong">{formatSummaryCurrency(openOrder.collectedToday)}</div>
                        <div className="app-text-caption mt-1">
                          {openOrder.paymentStatus === "prepaid" ? "Payment captured at scheduling" : "No payment collected yet"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {openOrder.itemSummary.map((item) => (
                        <EntityRow key={`${openOrder.id}-${item}`} title={item} />
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--app-border)] pt-4">
                      <div className="app-text-caption">{openOrder.itemCount} item{openOrder.itemCount === 1 ? "" : "s"} in work</div>
                      <div className="app-text-strong">Order total {formatSummaryCurrency(openOrder.total)}</div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          historyItems.length === 0 ? (
            <EmptyState>No closed orders yet.</EmptyState>
          ) : (
            <div className="space-y-3">
              {historyItems.map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="app-text-value">{order.customerName}</div>
                      <div className="app-text-caption mt-1">{order.label}</div>
                    </div>
                    <OrderStatusPill status={order.status} />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <EntityRow title="Closed date" subtitle={order.date} />
                    <EntityRow title="Final total" meta={<span className="app-text-strong">{order.total}</span>} />
                  </div>
                </Card>
              ))}
            </div>
          )
        )}
      </Card>
    </div>
  );
}
