import { useState } from "react";
import { Archive, ArrowRight, History, MessageSquare, PencilRuler, Ruler, User } from "lucide-react";
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
  onStartOrderForCustomer: (customerId: string) => void;
  onScreenChange: (screen: Screen) => void;
};

function ToolTile({
  icon: Icon,
  label,
  subtitle,
  onClick,
  disabled = false,
}: {
  icon: typeof Ruler;
  label: string;
  subtitle: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-between gap-3 rounded-[var(--app-radius-md)] border px-3 py-3 text-left transition ${
        disabled
          ? "cursor-not-allowed border-[var(--app-border)]/25 bg-[var(--app-surface-muted)]/35 opacity-65"
          : "border-[var(--app-border)]/35 bg-[var(--app-surface-muted)]/85 hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-muted)]"
      }`}
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

function RailEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[var(--app-radius-md)] border border-dashed border-[var(--app-border)]/45 bg-[var(--app-surface)]/45 px-3 py-4">
      <div className="app-text-caption">{message}</div>
    </div>
  );
}

function RecentOrderRow({ order }: { order: CustomerOrder }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3.5">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <div className="app-text-body truncate font-medium">{order.label}</div>
          <OrderStatusPill status={order.status} />
        </div>
        <div className="app-text-caption mt-1 truncate">{`${order.id} • ${formatCustomerOrderDate(order.createdAt)}`}</div>
      </div>
      <div className="app-text-body self-start shrink-0 text-right font-medium">{formatCustomerOrderTotal(order.total)}</div>
    </div>
  );
}

function getMeasurementHistoryContent(set: MeasurementSet) {
  if (set.takenAt) {
    return {
      date: set.takenAt,
      detail: set.note,
    };
  }

  const [firstSegment, ...rest] = set.note.split(" • ");

  return {
    date: firstSegment || "Date not recorded",
    detail: rest.join(" • "),
  };
}

function MeasurementHistoryRow({
  set,
  isLast,
}: {
  set: MeasurementSet;
  isLast: boolean;
}) {
  const { date, detail } = getMeasurementHistoryContent(set);

  return (
    <div className="grid grid-cols-[18px_minmax(0,1fr)] gap-3 pb-4 last:pb-0">
      <div className="relative flex justify-center">
        {!isLast ? <div className="absolute top-3 h-[calc(100%+1rem)] w-px bg-[var(--app-border)]/35" /> : null}
        <div className="mt-1 h-3 w-3 rounded-full border border-[var(--app-border-strong)]/40 bg-[var(--app-surface)]" />
      </div>
      <div className="min-w-0">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="app-text-body truncate font-medium">{set.label}</div>
            {set.suggested ? <StatusPill tone="success">Suggested</StatusPill> : null}
          </div>
          <div className="app-text-body mt-1 font-medium">{date}</div>
          {detail ? <div className="app-text-caption mt-1">{detail}</div> : null}
        </div>
      </div>
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
  onStartOrderForCustomer,
  onScreenChange,
}: CustomerProfileDrawerProps) {
  const hasVisitHistory = Boolean(customer?.lastVisit && customer.lastVisit !== "New");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const archived = customer?.archived ?? false;

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
                  {archived ? <StatusPill>Archived</StatusPill> : null}
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
              subtitle={archived ? "Archived profiles are historical only." : "Start a new order for this customer."}
              disabled={archived}
              onClick={archived ? undefined : () => {
                onClose();
                if (customer) {
                  onStartOrderForCustomer(customer.id);
                }
              }}
            />
            <ToolTile
              icon={Ruler}
              label="Open measurements"
              subtitle={archived ? "Archived profiles are view-only." : "Review or update saved measurement sets."}
              disabled={archived}
              onClick={archived ? undefined : () => {
                onClose();
                onScreenChange("measurements");
              }}
            />
            <ToolTile
              icon={PencilRuler}
              label="Add new set"
              subtitle={archived ? "Archived profiles are view-only." : "Capture a fresh measurement profile."}
              disabled={archived}
              onClick={archived ? undefined : () => {
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
            subtitle="Current and recent work tied to this customer."
            meta={`${orders.length} orders`}
          />

          <div className="mt-3 divide-y divide-[var(--app-border)]/28">
            {orders.length ? orders.map((order) => <RecentOrderRow key={order.id} order={order} />) : <RailEmptyState message="No recent orders for this profile yet." />}
          </div>
        </div>

        <div className="mt-6 border-t border-[var(--app-border)]/45 pt-5">
          <SectionHeading
            title="Measurement history"
            subtitle="Saved versions available for fittings and custom work."
            meta={`${measurementSets.length} saved`}
          />
          <div className="mt-4">
            {measurementSets.length ? (
              <div>
                {measurementSets.map((set, index) => (
                  <MeasurementHistoryRow
                    key={set.id}
                    set={set}
                    isLast={index === measurementSets.length - 1}
                  />
                ))}
              </div>
            ) : (
              <RailEmptyState message="No saved measurement sets on file yet." />
            )}
          </div>
        </div>
        </div>
        <div className="border-t border-[var(--app-border)]/45 bg-[var(--app-surface-muted)]/75 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="app-text-overline">Profile actions</div>
              <div className="app-text-caption mt-1">
                {archived ? "Archived profiles stay available for historical lookup." : "Edit or archive this customer record."}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!archived ? (
                <ActionButton tone="secondary" onClick={onEditCustomer} className="min-h-12 px-4 py-2.5 text-sm">
                  Edit
                </ActionButton>
              ) : null}
              {!archived ? (
                <button
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-[var(--app-radius-md)] border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 transition hover:border-amber-300 hover:bg-amber-100"
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {confirmDeleteOpen ? (
        <ModalShell
          title="Archive customer"
          subtitle={customer ? `Archive ${customer.name} and keep the history attached?` : "Archive this customer and keep the history attached?"}
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
                className="flex min-h-12 items-center justify-center gap-2 rounded-[var(--app-radius-md)] border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 transition hover:border-amber-300 hover:bg-amber-100"
              >
                <Archive className="h-4 w-4" />
                Archive customer
              </button>
            </div>
          }
        >
          <div className="app-text-body">
            This customer will be removed from new operational workflows, but their past orders, appointments, and measurements will stay attached for lookup.
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
