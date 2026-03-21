import { AlertCircle, History, MapPin, MessageSquare, PencilRuler, Ruler } from "lucide-react";
import type { Customer, CustomerOrder, MeasurementSet, Screen } from "../../types";
import { ActionButton, EntityRow, SectionHeader, StatusPill } from "../ui/primitives";
import { getMeasurementStatusLabel, getMeasurementStatusTone } from "../../features/customer/selectors";

type CustomerProfileDrawerProps = {
  customer: Customer | null;
  orders: CustomerOrder[];
  measurementSets: MeasurementSet[];
  onClose: () => void;
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
      className="flex w-full items-center justify-between gap-3 rounded-[var(--app-radius-md)] px-2 py-2 text-left transition hover:bg-[var(--app-surface)]/22"
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
      <span className="app-text-overline shrink-0">Open</span>
    </button>
  );
}

export function CustomerProfileDrawer({
  customer,
  orders,
  measurementSets,
  onClose,
  onScreenChange,
}: CustomerProfileDrawerProps) {
  return (
    <div className="fixed inset-0 z-40">
      <div className="app-modal-scrim absolute inset-0" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[460px] overflow-auto border-l border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow-lg)]">
        <SectionHeader
          icon={MapPin}
          title="Customer profile"
          subtitle="Service view"
          action={
            <ActionButton tone="secondary" onClick={onClose} className="min-h-12 px-4 py-2.5 text-sm">
              Close
            </ActionButton>
          }
        />

        <div className="border-b border-[var(--app-border)]/45 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="app-text-value truncate">{customer?.name ?? "Select customer"}</div>
                {customer?.isVip ? <StatusPill tone="dark">VIP</StatusPill> : null}
              </div>
              <div className="app-text-body-muted mt-1">{customer?.phone ?? "No phone on file"}</div>
            </div>
            <ActionButton tone="secondary" className="min-h-12 px-4 py-2.5 text-sm">
              Edit
            </ActionButton>
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
              <div className="app-text-body mt-2 font-medium">{customer?.lastVisit ?? "Unknown"}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="app-text-overline">Notes</div>
            <div className="app-text-body-muted mt-2">{customer?.notes ?? "No notes yet."}</div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ActionButton tone="primary" className="min-h-12 px-4 py-2.5 text-sm">
              Check in
            </ActionButton>
            <ActionButton
              tone="secondary"
              className="min-h-12 px-4 py-2.5 text-sm"
              onClick={() => {
                onClose();
                onScreenChange("order");
              }}
            >
              Start order
            </ActionButton>
          </div>
        </div>

        <div className="mt-5 border-b border-[var(--app-border)]/45 pb-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="app-text-value">Quick actions</div>
              <div className="app-text-caption mt-1">Most common customer-service actions.</div>
            </div>
            <div className="app-text-overline">{measurementSets.length} sets</div>
          </div>

          <div className="mt-3 divide-y divide-[var(--app-border)]/35 overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)]/40 bg-[var(--app-surface)]/16">
            <div className="px-2 py-1">
              <ToolTile
                icon={Ruler}
                label="Open measurements"
                subtitle="Review or update saved measurement sets."
                onClick={() => {
                  onClose();
                  onScreenChange("measurements");
                }}
              />
            </div>
            <div className="px-2 py-1">
              <ToolTile
                icon={PencilRuler}
                label="Add new set"
                subtitle="Capture a fresh measurement profile."
                onClick={() => {
                  onClose();
                  onScreenChange("measurements");
                }}
              />
            </div>
            <div className="px-2 py-1">
              <ToolTile icon={MessageSquare} label="Message customer" subtitle="Prepare outreach or follow-up." />
            </div>
            <div className="px-2 py-1">
              <ToolTile icon={History} label="Review history" subtitle="Check previous work and service notes." />
            </div>
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

          <div className="mt-3 divide-y divide-[var(--app-border)]/35 overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)]/40 bg-[var(--app-surface)]/16">
            {orders.map((order) => (
              <EntityRow
                key={order.id}
                className="rounded-none border-0 bg-transparent px-4 py-3 hover:bg-[var(--app-surface)]/28"
                title={order.label}
                subtitle={`${order.id} • ${order.date}`}
                meta={<StatusPill>{order.status}</StatusPill>}
                action={<div className="app-text-body font-medium">{order.total}</div>}
              />
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

          <div className="mt-3 divide-y divide-[var(--app-border)]/35 overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)]/40 bg-[var(--app-surface)]/16">
            {measurementSets.map((set) => (
              <div
                key={set.id}
                className="px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="app-text-strong">{set.label}</div>
                  {set.suggested ? <StatusPill tone="success">Suggested</StatusPill> : null}
                </div>
                <div className="app-text-caption mt-1">{set.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
