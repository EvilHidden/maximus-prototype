import { CalendarClock, Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ActionButton, EntityRow, InlineEmptyState, ModalShell, SearchField, SelectField } from "../../../components/ui/primitives";
import { filterCustomers, getActiveCustomers } from "../../customer/selectors";
import { ModalFooterActions, ModalMetaRow } from "../../../components/ui/modalPatterns";
import type {
  Appointment,
  AppointmentConfirmationStatus,
  AppointmentTypeKey,
  Customer,
  PickupLocation,
  ServiceAppointmentType,
} from "../../../types";

export type AppointmentComposerState = {
  customerId: string;
  typeKey: AppointmentTypeKey;
  location: PickupLocation;
  scheduledFor: string;
  confirmationStatus: AppointmentConfirmationStatus;
};

type AppointmentComposerModalProps = {
  customers: Customer[];
  pickupLocations: PickupLocation[];
  composerOpen: boolean;
  editingAppointment: Appointment | null;
  composerQuery: string;
  composerState: AppointmentComposerState;
  onComposerQueryChange: (value: string) => void;
  onComposerStateChange: (state: AppointmentComposerState) => void;
  onClose: () => void;
  onSubmit: () => void;
  onRequestCancel?: (appointment: Appointment) => void;
};

export const serviceAppointmentTypeOptions: Array<{ value: ServiceAppointmentType; label: string }> = [
  { value: "alteration_fitting", label: "Alteration fitting" },
  { value: "custom_consult", label: "Custom consultation" },
  { value: "first_fitting", label: "First fitting" },
  { value: "custom_fitting", label: "Custom fitting" },
  { value: "wedding_party_fitting", label: "Wedding party fitting" },
];

function getAppointmentConfirmationStatus(appointment: Appointment): AppointmentConfirmationStatus {
  return appointment.contextFlags.includes("confirmed") ? "confirmed" : "unconfirmed";
}

function getLinkedOrderLabel(orderId: string | null | undefined) {
  if (!orderId) {
    return null;
  }

  const numericId = orderId.replace(/^order-/, "");
  return numericId ? `Order ${numericId}` : orderId;
}

function formatAppointmentDateTime(value: string) {
  if (!value) {
    return "Not set";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

export function createEmptyAppointmentComposerState(pickupLocations: PickupLocation[]): AppointmentComposerState {
  return {
    customerId: "",
    typeKey: "alteration_fitting",
    location: pickupLocations[0] ?? "Fifth Avenue",
    scheduledFor: "",
    confirmationStatus: "unconfirmed",
  };
}

export function getComposerStateForAppointment(appointment: Appointment): AppointmentComposerState {
  return {
    customerId: appointment.customerId ?? "",
    typeKey: appointment.typeKey,
    location: appointment.location,
    scheduledFor: appointment.scheduledFor.slice(0, 16),
    confirmationStatus: getAppointmentConfirmationStatus(appointment),
  };
}

export function AppointmentComposerModal({
  customers,
  pickupLocations,
  composerOpen,
  editingAppointment,
  composerQuery,
  composerState,
  onComposerQueryChange,
  onComposerStateChange,
  onClose,
  onSubmit,
  onRequestCancel,
}: AppointmentComposerModalProps) {
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const customerById = useMemo(() => new Map(customers.map((customer) => [customer.id, customer])), [customers]);
  const selectedCustomer = composerState.customerId ? customerById.get(composerState.customerId) : undefined;
  const isEditing = Boolean(editingAppointment);
  const isPickup = editingAppointment?.kind === "pickup";
  const filteredComposerCustomers = filterCustomers(getActiveCustomers(customers), composerQuery).slice(0, 8);
  const showResults = !isPickup && (!selectedCustomer || showCustomerSearch);

  useEffect(() => {
    if (!composerOpen) {
      return;
    }

    setShowCustomerSearch(!editingAppointment && !composerState.customerId);
  }, [composerOpen, editingAppointment, composerState.customerId]);

  if (!composerOpen) {
    return null;
  }

  return (
    <ModalShell
      title={
        isEditing
          ? `Edit ${isPickup ? "pickup" : "appointment"}`
          : "New appointment"
      }
      onClose={onClose}
      showCloseButton={false}
      widthClassName="max-w-[680px]"
      footer={
        <ModalFooterActions
          leading={
            isEditing && editingAppointment && onRequestCancel ? (
              <ActionButton
                tone="danger"
                onClick={() => onRequestCancel(editingAppointment)}
              >
                {isPickup ? "Cancel pickup" : "Cancel appointment"}
              </ActionButton>
            ) : (
              <div />
            )
          }
        >
          <ActionButton tone="secondary" onClick={onClose}>
            {isEditing ? "Close" : "Cancel"}
          </ActionButton>
          <ActionButton
            tone="primary"
            disabled={!composerState.customerId || !composerState.scheduledFor}
            onClick={onSubmit}
          >
            {isEditing ? "Save changes" : "Create appointment"}
          </ActionButton>
        </ModalFooterActions>
      }
    >
      <div className="grid gap-4">
        <div className="space-y-4">
          <div className="space-y-3 border-b border-[var(--app-border)]/45 pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              <div className="app-text-overline">Customer</div>
              <div className="flex items-start justify-between gap-4">
                <div className="app-text-value min-w-0">
                  {selectedCustomer ? selectedCustomer.name : "Choose a customer"}
                </div>
                {!isPickup && selectedCustomer ? (
                  <button
                    type="button"
                    className="app-text-caption shrink-0 font-medium text-[var(--app-text-muted)] transition hover:text-[var(--app-text)]"
                    onClick={() => {
                      setShowCustomerSearch((current) => !current);
                      onComposerQueryChange("");
                    }}
                  >
                    {showCustomerSearch ? "Keep selected" : "Change customer"}
                  </button>
                ) : null}
              </div>
              {!selectedCustomer ? (
                <div className="app-text-body-muted">Choose a customer to continue.</div>
              ) : null}
              {selectedCustomer ? (
                <ModalMetaRow
                  className="pt-0.5"
                  items={[
                    ...(selectedCustomer.phone ? [{ icon: Phone, content: selectedCustomer.phone }] : []),
                    ...(selectedCustomer.email ? [{ icon: Mail, content: selectedCustomer.email }] : []),
                  ]}
                />
              ) : null}
            </div>
          </div>

          {showResults ? (
            <div className="space-y-2 border-t border-[var(--app-border)]/35 pt-3">
              <SearchField
                label="Find customer"
                value={composerQuery}
                onChange={onComposerQueryChange}
                placeholder="Search for a customer"
              />
              <div className="max-h-[220px] space-y-2 overflow-auto rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/22 p-2">
                {filteredComposerCustomers.length > 0 ? filteredComposerCustomers.map((customer) => (
                  <EntityRow
                    key={customer.id}
                    onClick={() => {
                      onComposerStateChange({ ...composerState, customerId: customer.id });
                      onComposerQueryChange("");
                      setShowCustomerSearch(false);
                    }}
                    title={customer.name}
                    subtitle={
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        <div className="app-text-caption flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--app-text-soft)]" />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.email ? (
                          <div className="app-text-caption flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--app-text-soft)]" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        ) : null}
                      </div>
                    }
                    className="w-full rounded-[var(--app-radius-md)] bg-[var(--app-surface)] px-4 py-3"
                  />
                )) : (
                  <InlineEmptyState>No active customers match this search.</InlineEmptyState>
                )}
              </div>
            </div>
          ) : null}

          {isPickup ? (
            <div className="space-y-1 border-t border-[var(--app-border)]/35 pt-3">
              <div className="app-text-overline">Linked order</div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {getLinkedOrderLabel(editingAppointment?.orderId) ? (
                  <span className="app-text-body font-medium">{getLinkedOrderLabel(editingAppointment?.orderId)}</span>
                ) : null}
                {editingAppointment?.pickupSummary ? (
                  <span className="app-text-body-muted">{editingAppointment.pickupSummary}</span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr),220px] sm:items-start">
          <div className="space-y-3">
            {!isPickup ? (
              <div className="space-y-2">
                <div className="app-field-label">Visit type</div>
                <div className="grid grid-cols-2 gap-2">
                  {serviceAppointmentTypeOptions.map((option) => {
                    const selected = composerState.typeKey === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onComposerStateChange({
                          ...composerState,
                          typeKey: option.value,
                        })}
                        className={[
                          "min-h-11 rounded-[var(--app-radius-md)] border px-3 py-2.5 text-left text-sm font-medium transition",
                          selected
                            ? "bg-[color-mix(in_srgb,var(--app-accent)_12%,var(--app-surface))] text-[var(--app-text)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--app-accent)_45%,var(--app-border))]"
                            : "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]",
                        ].join(" ")}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {isEditing ? (
              <SelectField
                label="Status"
                value={composerState.confirmationStatus}
                onChange={(value) => onComposerStateChange({
                  ...composerState,
                  confirmationStatus: value as AppointmentConfirmationStatus,
                })}
              >
                  <option value="unconfirmed">Unconfirmed</option>
                  <option value="confirmed">Confirmed</option>
              </SelectField>
            ) : null}

            <label className="block">
              <div className="app-field-label mb-2">Date and time</div>
              <input
                type="datetime-local"
                value={composerState.scheduledFor}
                onChange={(event) => onComposerStateChange({ ...composerState, scheduledFor: event.target.value })}
                className="app-input app-text-body py-2.5"
              />
            </label>
          </div>

          <div className="block space-y-2">
            <div className="app-field-label mb-2">Location</div>
            <div className="flex items-center gap-2 rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1.5">
              {pickupLocations.map((location) => {
                const selected = composerState.location === location;
                return (
                  <button
                    key={location}
                    type="button"
                    onClick={() => onComposerStateChange({ ...composerState, location })}
                    className={[
                      "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[calc(var(--app-radius-md)-2px)] px-3 py-2.5 text-sm font-medium transition",
                      selected
                        ? "bg-[color-mix(in_srgb,var(--app-accent)_12%,var(--app-surface))] text-[var(--app-text)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--app-accent)_45%,var(--app-border))]"
                        : "text-[var(--app-text-muted)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]",
                    ].join(" ")}
                  >
                    <MapPin className={["h-3.5 w-3.5 shrink-0", selected ? "text-[var(--app-accent)]" : "text-[var(--app-text-soft)]"].join(" ")} />
                    {location}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
