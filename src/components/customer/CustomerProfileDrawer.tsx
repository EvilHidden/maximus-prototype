import { useState } from "react";
import { AlertCircle, ArrowRight, History, MessageSquare, PencilRuler, Ruler, Trash2, User } from "lucide-react";
import type { Customer, CustomerOrder, MeasurementSet, Screen } from "../../types";
import { ActionButton, ModalShell, StatusPill } from "../ui/primitives";
import { getMeasurementStatusLabel, getMeasurementStatusTone } from "../../features/customer/selectors";

type CustomerProfileDrawerProps = {
  customer: Customer | null;
  orders: CustomerOrder[];
  measurementSets: MeasurementSet[];
  onClose: () => void;
  onEditCustomer: () => void;
  onDeleteCustomer: () => void;
  onScreenChange: (screen: Screen) => void;
};

function ToolTile({
  icon: Icon,
  label,
  subtitle,
  onClick,
}: {
  icon: typeof Ruler;
  label: string;
  subtitle: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/18 px-3 py-3 text-left transition hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface)]/30"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="app-icon-chip">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="app-text-strong">{label}</div>
            <div className="app-text-caption mt-0.5">{subtitle}</div>
          </div>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--app-text-soft)]" />
    </button>
  );
}

export function CustomerProfileDrawer({
  customer,
  orders,
  measurementSets,
  onClose,
  onEditCustomer,
  onDeleteCustomer,
  onScreenChange,
}: CustomerProfileDrawerProps) {
  const hasVisitHistory = Boolean(customer?.lastVisit && customer.lastVisit !== "New");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-40">
      <div className="app-modal-scrim absolute inset-0" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-[460px] flex-col border-l border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-lg)]">
        <div className="flex-1 overflow-auto p-4">
        <div className="border-b border-[var(--app-border)]/45 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="app-icon-chip mt-0.5">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="app-text-value truncate">{customer?.name ?? "Select customer"}</div>
                  {customer?.isVip ? <StatusPill tone="dark">VIP</StatusPill> : null}
                </div>
                <div className="app-text-body-muted mt-1">{customer?.phone ?? "No phone on file"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ActionButton tone="secondary" onClick={onEditCustomer} className="min-h-12 px-4 py-2.5 text-sm">
                Edit
              </ActionButton>
              <ActionButton tone="secondary" onClick={onClose} className="min-h-12 px-4 py-2.5 text-sm">
                Close
              </ActionButton>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="app-text-overline">Measurements</div>
              <div className="mt-2">
                <StatusPill tone={customer ? getMeasurementStatusTone(customer.measurementsStatus) : "default"}>
                  {customer?.measurementsStatus === "on_file" ? <Ruler className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  <span>{customer ? getMeasurementStatusLabel(customer.measurementsStatus) : "Unknown"}</span>
                </StatusPill>
              </div>
            </div>
            <div>
              <div className="app-text-overline">Last visit</div>
              <div className={hasVisitHistory ? "app-text-body mt-2 font-medium" : "app-text-caption mt-2"}>
                {hasVisitHistory ? customer?.lastVisit : "No visit history yet"}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="app-text-overline">Notes</div>
            <div className="app-text-body-muted mt-2">{customer?.notes ?? "No notes yet."}</div>
          </div>
        </div>

        <div className="mt-5 border-b border-[var(--app-border)]/45 pb-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="app-text-value">Quick actions</div>
              <div className="app-text-caption mt-1">Most common customer-service actions.</div>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <ToolTile
              icon={User}
              label="New order"
              subtitle="Start a new order for this customer."
              onClick={() => {
                onClose();
                onScreenChange("order");
              }}
            />
            <ToolTile
              icon={Ruler}
              label="Open measurements"
              subtitle="Review or update saved measurement sets."
              onClick={() => {
                onClose();
                onScreenChange("measurements");
              }}
            />
            <ToolTile
              icon={PencilRuler}
              label="Add new set"
              subtitle="Capture a fresh measurement profile."
              onClick={() => {
                onClose();
                onScreenChange("measurements");
              }}
            />
            <ToolTile icon={MessageSquare} label="Message customer" subtitle="Prepare outreach or follow-up." />
            <ToolTile icon={History} label="Review history" subtitle="Check previous work and service notes." />
          </div>
        </div>

        <div className="mt-5 border-b border-[var(--app-border)]/45 pb-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="app-text-value">Recent orders</div>
              <div className="app-text-caption mt-1">Most recent work associated with this profile.</div>
            </div>
            <div className="app-text-overline">{orders.length} orders</div>
          </div>

          <div className="mt-3 space-y-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-[minmax(0,1fr)_auto_72px] items-center gap-3 rounded-[var(--app-radius-md)] border border-[var(--app-border)]/30 bg-[var(--app-surface)]/14 px-3 py-4"
              >
                <div className="min-w-0">
                  <div className="app-text-strong truncate">{order.label}</div>
                  <div className="app-text-caption mt-1">{`${order.id} • ${order.date}`}</div>
                </div>
                <div className="justify-self-start">
                  <StatusPill>{order.status}</StatusPill>
                </div>
                <div className="app-text-body justify-self-end text-right font-medium">{order.total}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="app-text-value">Measurement history</div>
              <div className="app-text-caption mt-1">Saved sets available for tailoring work.</div>
            </div>
            <div className="app-text-overline">{measurementSets.length} saved</div>
          </div>

          <div className="mt-3 divide-y divide-[var(--app-border)]/28">
            {measurementSets.map((set) => (
              <div
                key={set.id}
                className="py-3.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="app-text-strong">{set.label}</div>
                  {set.suggested ? <StatusPill tone="success">Suggested</StatusPill> : null}
                </div>
                <div className="app-text-body mt-1 font-medium">{set.takenAt ?? set.note.split(" • ")[0] ?? "Date not recorded"}</div>
                <div className="app-text-caption mt-1">{set.note}</div>
              </div>
            ))}
          </div>
        </div>
        </div>
        <div className="border-t border-[var(--app-border)]/45 p-4">
          <button
            onClick={() => setConfirmDeleteOpen(true)}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--app-radius-md)] border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-100 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
            Delete customer
          </button>
        </div>
      </div>
      {confirmDeleteOpen ? (
        <ModalShell
          title="Delete customer"
          subtitle={customer ? `Remove ${customer.name} from the customer list?` : "Remove this customer from the customer list?"}
          onClose={() => setConfirmDeleteOpen(false)}
          showCloseButton={false}
          widthClassName="max-w-[460px]"
          footer={
            <div className="flex items-center justify-end gap-2">
              <ActionButton tone="secondary" onClick={() => setConfirmDeleteOpen(false)} className="min-h-12 px-4 py-2.5 text-sm">
                Cancel
              </ActionButton>
              <button
                onClick={() => {
                  setConfirmDeleteOpen(false);
                  onDeleteCustomer();
                }}
                className="flex min-h-12 items-center justify-center gap-2 rounded-[var(--app-radius-md)] border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-100 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
                Delete customer
              </button>
            </div>
          }
        >
          <div className="app-text-body">
            This will permanently delete the customer. This action can’t be undone.
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
