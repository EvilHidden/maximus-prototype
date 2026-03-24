import { Mail, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ActionButton, ModalShell, StatusPill } from "../../../components/ui/primitives";
import { filterCustomers, getActiveCustomers } from "../../customer/selectors";
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

function getConfirmationPillClassName(status: AppointmentConfirmationStatus) {
  return status === "confirmed"
    ? "border-[color:rgb(52_211_153_/_0.18)] bg-[color:rgb(52_211_153_/_0.06)] text-[color:rgb(209_250_229)]"
    : "border-[color:rgb(245_158_11_/_0.18)] bg-[color:rgb(245_158_11_/_0.06)] text-[color:rgb(252_211_77)]";
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
      subtitle={
        isEditing
          ? "Update the visit details and schedule."
          : "Add an appointment by hand."
      }
      onClose={onClose}
      showCloseButton={false}
      widthClassName="max-w-[720px]"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {isEditing && editingAppointment && onRequestCancel ? (
              <ActionButton
                tone="secondary"
                onClick={() => onRequestCancel(editingAppointment)}
                className="border-[color:rgb(248_113_113_/_0.26)] text-[var(--app-danger-text)] hover:bg-[var(--app-danger-bg)]/18"
              >
                {isPickup ? "Cancel pickup" : "Cancel appointment"}
              </ActionButton>
            ) : (
              <div />
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
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
          </div>
        </div>
      }
    >
      <div className="grid gap-5">
        <div className="border-b border-[var(--app-border)]/45 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div>
                  <div className="app-text-overline">Customer</div>
                  {selectedCustomer ? <div className="app-text-value mt-1">{selectedCustomer.name}</div> : null}
                </div>
                <StatusPill
                  tone={isPickup ? "dark" : "default"}
                  className={
                    isPickup
                      ? "border-[color:rgb(191_219_254_/_0.16)] bg-[color:rgb(191_219_254_/_0.07)] text-[color:rgb(219_234_254)]"
                      : "border-[color:rgb(125_211_252_/_0.16)] bg-[color:rgb(125_211_252_/_0.06)] text-[color:rgb(224_242_254)]"
                  }
                >
                  {isPickup ? "Pickup" : "Appointment"}
                </StatusPill>
              </div>
              {selectedCustomer ? (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                  {selectedCustomer.phone ? (
                    <div className="app-text-caption flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--app-text-soft)]" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  ) : null}
                  {selectedCustomer.email ? (
                    <div className="app-text-caption flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--app-text-soft)]" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {!isPickup && selectedCustomer ? (
              <button
                type="button"
                className="app-text-caption shrink-0 pt-0.5 font-medium text-[var(--app-text-muted)] transition hover:text-[var(--app-text)]"
                onClick={() => {
                  setShowCustomerSearch((current) => !current);
                  onComposerQueryChange("");
                }}
              >
                {showCustomerSearch ? "Keep selected" : "Change customer"}
              </button>
            ) : null}
          </div>

          {showResults ? (
            <div className="mt-4 space-y-2">
              <input
                value={composerQuery}
                onChange={(event) => onComposerQueryChange(event.target.value)}
                placeholder="Search for a customer"
                className="app-input app-text-body py-3"
              />
              <div className="max-h-[220px] overflow-auto rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface-muted)]/16">
                {filteredComposerCustomers.length > 0 ? filteredComposerCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => {
                      onComposerStateChange({ ...composerState, customerId: customer.id });
                      onComposerQueryChange("");
                      setShowCustomerSearch(false);
                    }}
                    className="app-entity-row w-full text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="app-text-strong">{customer.name}</div>
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
                    </div>
                  </button>
                )) : (
                  <div className="app-text-caption px-3 py-3">No active customers match this search.</div>
                )}
              </div>
            </div>
          ) : null}

          {isPickup ? (
            <div className="mt-4 border-t border-[var(--app-border)]/35 pt-3">
              <div className="app-text-overline">Linked order</div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
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
          {!isPickup ? (
            <label className="block">
              <div className="app-field-label mb-2">Visit type</div>
              <select
                value={composerState.typeKey}
                onChange={(event) => onComposerStateChange({
                  ...composerState,
                  typeKey: event.target.value as ServiceAppointmentType,
                })}
                className="app-input app-text-body py-2.5"
              >
                {serviceAppointmentTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {isEditing ? (
            <label className="block">
              <div className="app-field-label mb-2">Confirmation</div>
              <select
                value={composerState.confirmationStatus}
                onChange={(event) => onComposerStateChange({
                  ...composerState,
                  confirmationStatus: event.target.value as AppointmentConfirmationStatus,
                })}
                className="app-input app-text-body py-2.5"
              >
                <option value="unconfirmed">Unconfirmed</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </label>
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
