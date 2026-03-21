import { AlertCircle, History, MapPin, MessageSquare, PencilRuler, Ruler } from "lucide-react";
import type { Customer, CustomerOrder, MeasurementSet, Screen } from "../../types";
import { ActionButton, DefinitionList, EntityRow, PanelSection, SectionHeader, StatusPill } from "../ui/primitives";
import { getMeasurementStatusLabel, getMeasurementStatusTone } from "../../features/customer/selectors";

type CustomerProfileDrawerProps = {
  customer: Customer | null;
  orders: CustomerOrder[];
  measurementSets: MeasurementSet[];
  onClose: () => void;
  onScreenChange: (screen: Screen) => void;
};

export function CustomerProfileDrawer({ customer, orders, measurementSets, onClose, onScreenChange }: CustomerProfileDrawerProps) {
  return (
    <div className="fixed inset-0 z-40">
      <div className="app-modal-scrim absolute inset-0" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[430px] overflow-auto border-l border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow-lg)]">
        <SectionHeader
          icon={MapPin}
          title="Customer profile"
          subtitle="Service view"
          action={<ActionButton tone="secondary" onClick={onClose}>Close</ActionButton>}
        />

        <div className="app-panel-section bg-[var(--app-surface-muted)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="app-text-value truncate">{customer?.name ?? "Select customer"}</div>
                {customer?.isVip ? <StatusPill tone="dark">VIP</StatusPill> : null}
              </div>
              <div className="app-text-body-muted mt-1">{customer?.phone ?? "No phone on file"}</div>
            </div>
            <ActionButton tone="secondary" className="px-3 py-2">Edit</ActionButton>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--app-border)] pt-3">
            <StatusPill tone={customer ? getMeasurementStatusTone(customer.measurementsStatus) : "default"}>
              {customer?.measurementsStatus === "on_file" ? <Ruler className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              <span>{customer ? getMeasurementStatusLabel(customer.measurementsStatus) : "Unknown"}</span>
            </StatusPill>
            <div className="text-right">
              <div className="app-kicker">Last visit</div>
              <div className="app-text-body mt-1">{customer?.lastVisit ?? "Unknown"}</div>
            </div>
          </div>

          <PanelSection title="Notes" className="mt-4">
            <div className="app-text-body-muted">{customer?.notes ?? "No notes yet."}</div>
          </PanelSection>

          <div className="mt-4 flex items-center gap-2">
            <ActionButton tone="primary" className="px-3 py-2.5">Check in</ActionButton>
            <ActionButton tone="secondary" className="px-3 py-2.5" onClick={() => {
              onClose();
              onScreenChange("order");
            }}>
              Start order
            </ActionButton>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="app-text-strong">Recent orders</div>
            <div className="app-text-caption">{measurementSets.length} measurement sets</div>
          </div>

          <div className="space-y-2">
            {orders.map((order) => (
              <EntityRow
                key={order.id}
                title={order.label}
                subtitle={`${order.id} • ${order.date}`}
                meta={<StatusPill>{order.status}</StatusPill>}
                action={<div className="app-text-body-muted">{order.total}</div>}
              />
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="app-text-strong mb-2">Tools</div>
          <div className="grid grid-cols-4 gap-2">
            <ActionButton tone="quiet" className="flex min-h-16 flex-col items-center justify-center gap-1 px-1.5 py-2 text-[10px] leading-tight" onClick={() => {
              onClose();
              onScreenChange("measurements");
            }}>
              <Ruler className="h-4 w-4" />
              <span className="app-text-overline">Measure</span>
            </ActionButton>
            <ActionButton tone="quiet" className="flex min-h-16 flex-col items-center justify-center gap-1 px-1.5 py-2 text-[10px] leading-tight">
              <MessageSquare className="h-4 w-4" />
              <span className="app-text-overline">Message</span>
            </ActionButton>
            <ActionButton tone="quiet" className="flex min-h-16 flex-col items-center justify-center gap-1 px-1.5 py-2 text-[10px] leading-tight" onClick={() => {
              onClose();
              onScreenChange("measurements");
            }}>
              <PencilRuler className="h-4 w-4" />
              <span className="app-text-overline">Add</span>
            </ActionButton>
            <ActionButton tone="quiet" className="flex min-h-16 flex-col items-center justify-center gap-1 px-1.5 py-2 text-[10px] leading-tight">
              <History className="h-4 w-4" />
              <span className="app-text-overline">History</span>
            </ActionButton>
          </div>

          <DefinitionList
            className="mt-2"
            items={[
              { label: "Last payment", value: customer?.id === "C-1042" ? "Paid in full" : "Deposit only" },
              { label: "Preferred contact", value: "Text" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
