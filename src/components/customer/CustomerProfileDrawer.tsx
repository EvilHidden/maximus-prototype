import { AlertCircle, History, MapPin, MessageSquare, PencilRuler, Ruler } from "lucide-react";
import type { Customer, CustomerOrder, Screen } from "../../types";
import { ActionButton, DefinitionList, SectionHeader, StatusPill } from "../ui/primitives";

type CustomerProfileDrawerProps = {
  customer: Customer | null;
  orders: CustomerOrder[];
  onClose: () => void;
  onScreenChange: (screen: Screen) => void;
};

export function CustomerProfileDrawer({ customer, orders, onClose, onScreenChange }: CustomerProfileDrawerProps) {
  const measurementTone =
    customer?.measurementsStatus === "On file"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : customer?.measurementsStatus === "Needs update"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[430px] overflow-auto border-l border-slate-200 bg-white p-4 shadow-xl">
        <SectionHeader
          icon={MapPin}
          title="Customer profile"
          subtitle="Service view"
          action={<ActionButton tone="secondary" onClick={onClose}>Close</ActionButton>}
        />

        <div className="customer-drawer-panel rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate text-lg font-semibold text-slate-900">{customer?.name ?? "Select customer"}</div>
                {customer?.isVip ? <StatusPill tone="dark">VIP</StatusPill> : null}
              </div>
              <div className="mt-1 text-sm text-slate-500">{customer?.phone ?? "No phone on file"}</div>
            </div>
            <ActionButton tone="secondary" className="px-3 py-2 text-xs">Edit</ActionButton>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
            <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-medium ${measurementTone}`}>
              {customer?.measurementsStatus === "On file" ? <Ruler className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              <span>{customer?.measurementsStatus ?? "Unknown"}</span>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Last visit</div>
              <div className="mt-1 text-sm text-slate-900">{customer?.lastVisit ?? "Unknown"}</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Notes</div>
            <div className="mt-2 text-sm text-slate-600">{customer?.notes ?? "No notes yet."}</div>
          </div>

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
            <div className="text-sm font-semibold text-slate-900">Recent orders</div>
            <div className="text-xs text-slate-500">Recent activity</div>
          </div>

          <div className="space-y-2">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{order.label}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {order.id} • {order.date}
                    </div>
                  </div>
                  <StatusPill>{order.status}</StatusPill>
                </div>
                <div className="mt-2 text-sm text-slate-600">{order.total}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 text-sm font-semibold text-slate-900">Tools</div>
          <div className="grid grid-cols-4 gap-2">
            <ActionButton tone="quiet" className="flex min-h-16 flex-col items-center justify-center gap-1 px-1.5 py-2 text-[10px] leading-tight" onClick={() => {
              onClose();
              onScreenChange("measurements");
            }}>
              <Ruler className="h-4 w-4" />
              Measure
            </ActionButton>
            <ActionButton tone="quiet" className="flex min-h-16 flex-col items-center justify-center gap-1 px-1.5 py-2 text-[10px] leading-tight">
              <MessageSquare className="h-4 w-4" />
              Message
            </ActionButton>
            <ActionButton tone="quiet" className="flex min-h-16 flex-col items-center justify-center gap-1 px-1.5 py-2 text-[10px] leading-tight" onClick={() => {
              onClose();
              onScreenChange("measurements");
            }}>
              <PencilRuler className="h-4 w-4" />
              Add
            </ActionButton>
            <ActionButton tone="quiet" className="flex min-h-16 flex-col items-center justify-center gap-1 px-1.5 py-2 text-[10px] leading-tight">
              <History className="h-4 w-4" />
              History
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
