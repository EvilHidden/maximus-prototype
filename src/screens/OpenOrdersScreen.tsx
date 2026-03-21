import { ClipboardList } from "lucide-react";
import type { Appointment, OpenOrder } from "../types";
import { ActionButton, Card, EmptyState, EntityRow, SectionHeader, StatusPill } from "../components/ui/primitives";
import { formatPickupSchedule, formatSummaryCurrency } from "../features/order/selectors";

type OpenOrdersScreenProps = {
  openOrders: OpenOrder[];
  pickupAppointments: Appointment[];
  onStartNewOrder: () => void;
};

export function OpenOrdersScreen({ openOrders, pickupAppointments, onStartNewOrder }: OpenOrdersScreenProps) {
  const totalOpenItems = openOrders.length + pickupAppointments.length;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <SectionHeader
          icon={ClipboardList}
          title="Open Orders"
          subtitle={totalOpenItems === 1 ? "1 active order or pickup" : `${totalOpenItems} active orders and pickups`}
          action={
            <ActionButton tone="primary" className="px-3 py-2 text-xs" onClick={onStartNewOrder}>
              New order
            </ActionButton>
          }
        />

        {totalOpenItems === 0 ? (
          <EmptyState>No open orders yet. Scheduled pickups and newly created work orders will appear here.</EmptyState>
        ) : (
          <div className="space-y-3">
            {pickupAppointments.map((appointment) => (
              <Card key={appointment.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="app-text-value">{appointment.customer}</div>
                    <div className="app-text-caption mt-1">{appointment.day === "today" ? "Pickup due today" : "Pickup due tomorrow"}</div>
                  </div>
                  <StatusPill tone={appointment.day === "today" ? "dark" : "default"}>
                    {appointment.status}
                  </StatusPill>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <EntityRow title="Pickup appointment" subtitle={`${appointment.time} • ${appointment.type}`} />
                  <EntityRow title="Prep status" subtitle={appointment.missing === "Complete" ? "Ready for release" : appointment.missing} />
                </div>
              </Card>
            ))}

            {openOrders.map((openOrder) => {
              const pickupSummary = formatPickupSchedule(openOrder.pickupDate, openOrder.pickupTime);

              return (
                <Card key={openOrder.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="app-text-value">{openOrder.payerName}</div>
                      <div className="app-text-caption mt-1">{openOrder.createdAtLabel}</div>
                    </div>
                    <StatusPill tone={openOrder.paymentStatus === "prepaid" ? "success" : "warn"}>
                      {openOrder.paymentStatus === "prepaid" ? "Prepaid" : "Pay later"}
                    </StatusPill>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <EntityRow
                      title="Scheduled pickup"
                      subtitle={pickupSummary && openOrder.pickupLocation ? `${pickupSummary} • ${openOrder.pickupLocation}` : "Pickup details pending"}
                    />
                    <EntityRow
                      title="Collected today"
                      subtitle={openOrder.paymentStatus === "prepaid" ? "Payment captured at scheduling" : "No payment collected yet"}
                      meta={<span className="app-text-strong">{formatSummaryCurrency(openOrder.collectedToday)}</span>}
                    />
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
        )}
      </Card>
    </div>
  );
}
