import { useState } from "react";
import { Archive, ArrowRight, CalendarDays, MapPin, MessageSquare, PencilRuler, Phone, Ruler, User } from "lucide-react";
import type { Customer, CustomerOrder, MeasurementSet, PickupLocation, Screen, ServiceAppointmentType } from "../../types";
import { ActionButton, Callout, ModalShell, StatusPill } from "../ui/primitives";
import { ModalFooterActions, ModalMetaRow, ModalSectionHeading, ModalSummaryCard } from "../ui/modalPatterns";
import { MeasurementStatusPill, OrderStatusPill, VipPill } from "../ui/pills";
import { formatCustomerOrderDate, formatCustomerOrderTotal } from "../../features/customer/selectors";
import {
  AppointmentComposerModal,
  createEmptyAppointmentComposerState,
  type AppointmentComposerState,
} from "../../features/appointments/components/AppointmentComposerModal";

type CustomerProfileDrawerProps = {
  customer: Customer | null;
  orders: CustomerOrder[];
  measurementSets: MeasurementSet[];
  onClose: () => void;
  onEditCustomer: () => void;
  onDeleteCustomer: () => void;
  onStartOrderForCustomer: (customerId: string) => void;
  onCreateAppointment: (payload: {
    customerId: string;
    typeKey: ServiceAppointmentType;
    location: PickupLocation;
    scheduledFor: string;
  }) => void;
  pickupLocations: PickupLocation[];
  customers: Customer[];
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
      className={`app-customer-rail__tool-tile flex w-full items-center justify-between gap-3 rounded-[var(--app-radius-md)] border px-3 py-2.5 text-left transition ${
        disabled
          ? "cursor-not-allowed border-[var(--app-border)]/25 bg-[var(--app-surface-muted)]/35 opacity-65"
          : "border-[var(--app-border)]/35 bg-[var(--app-surface-muted)]/85 hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-muted)]"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="app-icon-chip app-customer-rail__tool-icon">
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

function RailEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[var(--app-radius-md)] border border-dashed border-[var(--app-border)]/45 bg-[var(--app-surface)]/45 px-3 py-4">
      <div className="app-text-caption">{message}</div>
    </div>
  );
}

function RecentOrderRow({ order }: { order: CustomerOrder }) {
  return (
    <div className="app-customer-rail__order-row">
      <div className="min-w-0">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="app-text-body truncate font-medium">{order.label}</div>
          <div className="app-text-body shrink-0 text-right font-medium">{formatCustomerOrderTotal(order.total)}</div>
        </div>
        <div className="mt-1.5 flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="app-text-caption">{formatCustomerOrderDate(order.createdAt)}</div>
            <div className="app-text-caption text-[var(--app-text-soft)]">{order.id}</div>
          </div>
          <div className="shrink-0">
            <OrderStatusPill status={order.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

function getMeasurementHistoryContent(set: MeasurementSet) {
  if (set.takenAt) {
    return {
      title: set.note || "Measurement set",
      date: set.takenAt,
    };
  }

  const [firstSegment, ...rest] = set.note.split(" • ");

  return {
    title: rest.join(" • ") || "Measurement set",
    date: firstSegment || "Date not recorded",
  };
}

function MeasurementHistoryRow({
  set,
  isLast,
}: {
  set: MeasurementSet;
  isLast: boolean;
}) {
  const { title, date } = getMeasurementHistoryContent(set);

  return (
    <div className="app-customer-rail__measurement-row grid grid-cols-[18px_minmax(0,1fr)] gap-3 last:pb-0">
      <div className="relative flex justify-center">
        {!isLast ? <div className="app-customer-rail__measurement-line absolute top-3 h-[calc(100%+0.85rem)] w-px" /> : null}
        <div className="app-customer-rail__measurement-dot mt-1 h-3 w-3 rounded-full" />
      </div>
      <div className="min-w-0">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="app-text-body truncate font-medium">{title}</div>
            {set.suggested ? <StatusPill tone="success">Suggested</StatusPill> : null}
          </div>
          <div className="app-text-caption mt-1">{date}</div>
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
  onCreateAppointment,
  pickupLocations,
  customers,
  onScreenChange,
}: CustomerProfileDrawerProps) {
  const hasVisitHistory = Boolean(customer?.lastVisit && customer.lastVisit !== "New");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [appointmentComposerOpen, setAppointmentComposerOpen] = useState(false);
  const [appointmentComposerQuery, setAppointmentComposerQuery] = useState("");
  const [appointmentComposerState, setAppointmentComposerState] = useState<AppointmentComposerState>(() => createEmptyAppointmentComposerState(pickupLocations));
  const archived = customer?.archived ?? false;
  const customerLocation = customer?.preferredLocation ?? "No preferred location";
  const customerEmail = customer?.email || "No email on file";
  const customerPhone = customer?.phone || "No phone on file";

  return (
    <div className="fixed inset-0 z-40">
      <div className="app-modal-scrim absolute inset-0" onClick={onClose} />
      <div className="app-customer-rail absolute right-0 top-0 flex h-full w-full max-w-[30rem] flex-col border-l border-[var(--app-border)]/70 shadow-[var(--app-shadow-lg)]">
      <div className="app-customer-rail__scroll flex-1 overflow-auto p-3.5">
          <div className="space-y-3">
            <div className="app-customer-rail__topbar">
              <ActionButton tone="secondary" onClick={onClose} className="min-h-9 px-3 py-1.5 text-sm">
                Close
              </ActionButton>
            </div>

            <div className="app-customer-rail__hero">
              <div className="app-customer-rail__identity">
                <div className="flex items-start gap-3">
                  <div className="app-icon-chip mt-0.5 hidden sm:flex">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="app-customer-rail__name truncate">{customer?.name ?? "Select customer"}</div>
                      {customer?.isVip ? <VipPill /> : null}
                      {archived ? <StatusPill>Archived</StatusPill> : null}
                    </div>
                    <div className="app-text-body-muted mt-1">{customerEmail}</div>
                  </div>
                </div>
                <ModalMetaRow
                  className="mt-3"
                  items={[
                    { icon: Phone, content: customerPhone },
                    { icon: MapPin, content: customerLocation },
                    { icon: MapPin, content: customer?.address || "No address on file" },
                  ]}
                />
              </div>

              <div className="app-customer-rail__stats mt-3">
                <div className="app-customer-rail__stat">
                  <div className="app-text-overline">Measurements</div>
                  <div className="mt-2">
                    {customer ? <MeasurementStatusPill status={customer.measurementsStatus} showIcon /> : <StatusPill>Unknown</StatusPill>}
                  </div>
                </div>
                <div className="app-customer-rail__stat">
                  <div className="app-text-overline">Last visit</div>
                  <div className={hasVisitHistory ? "app-text-body mt-2 font-medium" : "app-text-caption mt-2"}>
                    {hasVisitHistory ? customer?.lastVisit : "No visit history yet"}
                  </div>
                </div>
              </div>

              <div className="app-customer-rail__notes mt-3">
                <div className="app-text-overline">Notes</div>
                <div className="app-text-body-muted mt-2">{customer?.notes ?? "No notes yet."}</div>
              </div>
            </div>

            <section className="app-customer-rail__section app-customer-rail__section--flush">
              <ModalSectionHeading
                className="app-customer-rail__section-heading"
                title={<span className="app-customer-rail__section-title">Quick actions</span>}
                description="Most common customer-service actions."
              />

              <div className="space-y-1.5">
                <ToolTile
                  icon={User}
                  label="New Order"
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
                  icon={CalendarDays}
                  label="New Appointment"
                  subtitle={archived ? "Archived profiles are view-only." : "Book a new visit for this customer."}
                  disabled={archived}
                  onClick={archived ? undefined : () => {
                    if (customer) {
                      setAppointmentComposerQuery("");
                      setAppointmentComposerState({
                        ...createEmptyAppointmentComposerState(pickupLocations),
                        customerId: customer.id,
                      });
                      setAppointmentComposerOpen(true);
                    }
                  }}
                />
                <ToolTile
                  icon={Ruler}
                  label="Open Measurements"
                  subtitle={archived ? "Archived profiles are view-only." : "Review or update saved measurement sets."}
                  disabled={archived}
                  onClick={archived ? undefined : () => {
                    onClose();
                    onScreenChange("measurements");
                  }}
                />
                <ToolTile
                  icon={PencilRuler}
                  label="Add New Measurement Set"
                  subtitle={archived ? "Archived profiles are view-only." : "Capture a fresh measurement profile."}
                  disabled={archived}
                  onClick={archived ? undefined : () => {
                    onClose();
                    onScreenChange("measurements");
                  }}
                />
                <ToolTile icon={MessageSquare} label="Message Customer" subtitle="Prepare outreach or follow-up." />
              </div>
            </section>

            <section className="app-customer-rail__section">
              <ModalSectionHeading
                className="app-customer-rail__section-heading"
                title={<span className="app-customer-rail__section-title">Recent orders</span>}
                action={<div className="app-customer-rail__section-count whitespace-nowrap">{orders.length} orders</div>}
              />

              <div className="app-customer-rail__order-list divide-y divide-[var(--app-border)]/28">
                {orders.length ? orders.map((order) => <RecentOrderRow key={order.id} order={order} />) : <RailEmptyState message="No recent orders for this profile yet." />}
              </div>
            </section>

            <section className="app-customer-rail__section">
              <ModalSectionHeading
                className="app-customer-rail__section-heading"
                title={<span className="app-customer-rail__section-title">Measurement history</span>}
                action={<div className="app-customer-rail__section-count whitespace-nowrap">{measurementSets.length} saved</div>}
              />

              <div className="app-customer-rail__history pt-0.5">
                {measurementSets.length ? (
                  <div>
                    {measurementSets.map((set, index) => (
                      <MeasurementHistoryRow key={set.id} set={set} isLast={index === measurementSets.length - 1} />
                    ))}
                  </div>
                ) : (
                  <RailEmptyState message="No saved measurement sets on file yet." />
                )}
              </div>
            </section>
          </div>
        </div>
        <div className="app-customer-rail__footer px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="app-text-overline">Profile actions</div>
              <div className="app-text-caption mt-1">
                {archived ? "Archived profiles stay available for historical lookup." : "Edit or archive this customer record."}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!archived ? (
                <ActionButton tone="secondary" onClick={onEditCustomer} className="min-h-11 px-4 py-2.5 text-sm">
                  Edit
                </ActionButton>
              ) : null}
              {!archived ? (
                <ActionButton
                  tone="danger"
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="min-h-11 px-4 py-2.5 text-sm"
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </ActionButton>
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
            <ModalFooterActions>
              <ActionButton tone="secondary" onClick={() => setConfirmDeleteOpen(false)} className="min-h-12 px-4 py-2.5 text-sm">
                Cancel
              </ActionButton>
              <ActionButton
                tone="danger"
                onClick={() => {
                  setConfirmDeleteOpen(false);
                  onDeleteCustomer();
                }}
                className="min-h-12 px-4 py-2.5 text-sm"
              >
                <Archive className="h-4 w-4" />
                Archive customer
              </ActionButton>
            </ModalFooterActions>
          }
        >
          <div className="space-y-3">
            <ModalSummaryCard
              eyebrow="Customer record"
              title={customer?.name ?? "Customer"}
              description="This profile will leave new operational workflows, but its history stays attached for lookup."
            />
            <Callout tone="warn">
              <div className="app-text-caption">
                Past orders, appointments, and measurement history will remain available for reference after archiving.
              </div>
            </Callout>
          </div>
        </ModalShell>
      ) : null}
      <AppointmentComposerModal
        customers={customers}
        pickupLocations={pickupLocations}
        composerOpen={appointmentComposerOpen}
        editingAppointment={null}
        composerQuery={appointmentComposerQuery}
        composerState={appointmentComposerState}
        onComposerQueryChange={setAppointmentComposerQuery}
        onComposerStateChange={setAppointmentComposerState}
        onClose={() => setAppointmentComposerOpen(false)}
        onSubmit={() => {
          onCreateAppointment({
            customerId: appointmentComposerState.customerId,
            typeKey: appointmentComposerState.typeKey as ServiceAppointmentType,
            location: appointmentComposerState.location,
            scheduledFor: appointmentComposerState.scheduledFor,
          });
          setAppointmentComposerOpen(false);
        }}
      />
    </div>
  );
}
