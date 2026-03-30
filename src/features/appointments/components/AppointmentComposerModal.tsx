import { Mail, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ActionButton, EntityRow, InlineEmptyState, ModalShell, SearchField, SelectField } from "../../../components/ui/primitives";
import { filterCustomers, getActiveCustomers } from "../../customer/selectors";
import { ModalFooterActions, ModalMetaRow, ModalSectionHeading } from "../../../components/ui/modalPatterns";
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
      widthClassName="max-w-[720px]"
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
      <div className="grid gap-5">
        <div className="space-y-4 border-b border-[var(--app-border)]/45 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              <div className="app-text-overline">Customer</div>
              <div className="app-text-value">
                {selectedCustomer ? selectedCustomer.name : "Choose a customer"}
              </div>
              <div className={selectedCustomer ? "app-text-body" : "app-text-body-muted"}>
                {selectedCustomer
                  ? (isPickup ? "Linked pickup" : "Appointment")
                  : "Select who this visit belongs to before you schedule it."}
              </div>
              {selectedCustomer ? (
                <ModalMetaRow
                  className="pt-1"
                  items={[
                    ...(selectedCustomer.phone ? [{ icon: Phone, content: selectedCustomer.phone }] : []),
                    ...(selectedCustomer.email ? [{ icon: Mail, content: selectedCustomer.email }] : []),
                  ]}
                />
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              {!isPickup && selectedCustomer ? (
                <button
                  type="button"
                  className="app-text-caption font-medium text-[var(--app-text-muted)] transition hover:text-[var(--app-text)]"
                  onClick={() => {
                    setShowCustomerSearch((current) => !current);
                    onComposerQueryChange("");
                  }}
                >
                  {showCustomerSearch ? "Keep selected" : "Change customer"}
                </button>
              ) : null}
            </div>
          </div>

          {showResults ? (
            <div className="mt-4 space-y-2">
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

        <div className="grid gap-4 sm:grid-cols-2">
          <ModalSectionHeading
            eyebrow="Visit details"
            title="Set the appointment information"
            description="Set the visit type, date, time, and location."
            className="sm:col-span-2"
          />
          {!isPickup ? (
            <SelectField
              label="Visit type"
              value={composerState.typeKey}
              onChange={(value) => onComposerStateChange({
                ...composerState,
                typeKey: value as ServiceAppointmentType,
              })}
            >
                {serviceAppointmentTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </SelectField>
          ) : null}

          {isEditing ? (
            <SelectField
              label="Confirmation"
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
              className="app-input app-text-body py-3"
            />
          </label>

          <div className="block">
            <div className="app-field-label mb-2">Location</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {pickupLocations.map((location) => {
                const selected = composerState.location === location;
                return (
                  <button
                    key={location}
                    type="button"
                    onClick={() => onComposerStateChange({ ...composerState, location })}
                    className={selected
                      ? "rounded-[var(--app-radius-sm)] border border-[var(--app-border-strong)] bg-[var(--app-surface-muted)]/42 px-3 py-3 text-left app-text-body font-medium text-[var(--app-text)]"
                      : "rounded-[var(--app-radius-sm)] border border-[var(--app-border)]/55 bg-[var(--app-surface)]/14 px-3 py-3 text-left app-text-body-muted transition hover:border-[var(--app-border-strong)] hover:text-[var(--app-text)]"
                    }
                  >
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
