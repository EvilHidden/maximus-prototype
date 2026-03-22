import { useState } from "react";
import { ArrowRight, History, MessageSquare, PencilRuler, Ruler, Trash2, User } from "lucide-react";
import type { Customer, CustomerOrder, MeasurementSet, Screen } from "../../types";
import { ActionButton, ModalShell, StatusPill } from "../ui/primitives";
import { MeasurementStatusPill, OrderStatusPill, VipPill } from "../ui/pills";
import { formatCustomerOrderDate, formatCustomerOrderTotal } from "../../features/customer/selectors";

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
      className="flex w-full items-center justify-between gap-3 rounded-[var(--app-radius-md)] border border-[var(--app-border)]/35 bg-[var(--app-surface-muted)]/85 px-3 py-3 text-left transition hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-muted)]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="app-icon-chip">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="app-text-strong">{label}</div>
          <div className="app-text-caption mt-0.5">{subtitle}</div>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--app-text-soft)]" />
    </button>
  );
}

function SectionHeading({
  title,
  subtitle,
  meta,
}: {
  title: string;
  subtitle: string;
  meta?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="app-text-value">{title}</div>
        <div className="app-text-caption mt-1">{subtitle}</div>
      </div>
      {meta ? <div className="app-text-overline">{meta}</div> : null}
    </div>
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
        <div className="border-b border-[var(--app-border)]/45 pb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="app-icon-chip mt-0.5">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="app-text-value truncate">{customer?.name ?? "Select customer"}</div>
                  {customer?.isVip ? <VipPill /> : null}
                </div>
                <div className="app-text-body-muted mt-1">{customer?.phone ?? "No phone on file"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ActionButton tone="secondary" onClick={onClose} className="min-h-12 px-4 py-2.5 text-sm">
                Close
              </ActionButton>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="app-text-overline">Measurements</div>
              <div className="mt-2">
                {customer ? <MeasurementStatusPill status={customer.measurementsStatus} showIcon /> : <StatusPill>Unknown</StatusPill>}
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

        <div className="mt-6">
          <SectionHeading
            title="Quick actions"
            subtitle="Most common customer-service actions."
          />

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

        <div className="mt-6 border-t border-[var(--app-border)]/45 pt-5">
          <SectionHeading
            title="Recent orders"
            subtitle="Most recent work associated with this profile."
            meta={`${orders.length} orders`}
          />

          <div className="mt-3 divide-y divide-[var(--app-border)]/28">
            {orders.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3.5"
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                  <div className="app-text-strong truncate">{order.label}</div>
                  <OrderStatusPill status={order.status} />
                  </div>
                  <div className="app-text-caption mt-1 truncate">{`${order.id} • ${formatCustomerOrderDate(order.createdAt)}`}</div>
                </div>
                <div className="app-text-body self-start justify-self-end text-right font-medium">{formatCustomerOrderTotal(order.total)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-[var(--app-border)]/45 pt-5">
          <SectionHeading
            title="Measurement history"
            subtitle="Saved sets available for tailoring work."
            meta={`${measurementSets.length} saved`}
          />
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
        <div className="border-t border-[var(--app-border)]/45 bg-[var(--app-surface-muted)]/75 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="app-text-overline">Profile actions</div>
              <div className="app-text-caption mt-1">Edit or remove this customer record.</div>
            </div>
            <div className="flex items-center gap-2">
              <ActionButton tone="secondary" onClick={onEditCustomer} className="min-h-12 px-4 py-2.5 text-sm">
                Edit
              </ActionButton>
              <button
                onClick={() => setConfirmDeleteOpen(true)}
                className="flex min-h-12 items-center justify-center gap-2 rounded-[var(--app-radius-md)] border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-100 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
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
