import { ActionButton, ModalShell } from "../../../components/ui/primitives";
import { filterCustomers, getActiveCustomers } from "../../customer/selectors";
import type { Appointment, Customer, PickupLocation, ServiceAppointmentType } from "../../../types";

export type AppointmentComposerState = {
  customerId: string;
  typeKey: ServiceAppointmentType;
  location: PickupLocation;
  scheduledFor: string;
};

type AppointmentComposerModalProps = {
  customers: Customer[];
  pickupLocations: PickupLocation[];
  composerOpen: boolean;
  editingAppointmentId: string | null;
  composerQuery: string;
  composerState: AppointmentComposerState;
  onComposerQueryChange: (value: string) => void;
  onComposerStateChange: (state: AppointmentComposerState) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export const serviceAppointmentTypeOptions: Array<{ value: ServiceAppointmentType; label: string }> = [
  { value: "alteration_fitting", label: "Alteration fitting" },
  { value: "custom_consult", label: "Custom consultation" },
  { value: "first_fitting", label: "First fitting" },
  { value: "custom_fitting", label: "Custom fitting" },
  { value: "wedding_party_fitting", label: "Wedding party fitting" },
];

export function createEmptyAppointmentComposerState(pickupLocations: PickupLocation[]): AppointmentComposerState {
  return {
    customerId: "",
    typeKey: "alteration_fitting",
    location: pickupLocations[0] ?? "Fifth Avenue",
    scheduledFor: "",
  };
}

export function getComposerStateForAppointment(appointment: Appointment): AppointmentComposerState {
  return {
    customerId: appointment.customerId ?? "",
    typeKey: appointment.kind === "pickup" ? "alteration_fitting" : appointment.typeKey as ServiceAppointmentType,
    location: appointment.location,
    scheduledFor: appointment.scheduledFor.slice(0, 16),
  };
}

export function AppointmentComposerModal({
  customers,
  pickupLocations,
  composerOpen,
  editingAppointmentId,
  composerQuery,
  composerState,
  onComposerQueryChange,
  onComposerStateChange,
  onClose,
  onSubmit,
}: AppointmentComposerModalProps) {
  if (!composerOpen) {
    return null;
  }

  const filteredComposerCustomers = filterCustomers(getActiveCustomers(customers), composerQuery);

  return (
    <ModalShell
      title={editingAppointmentId ? "Reschedule appointment" : "New appointment"}
      subtitle={editingAppointmentId ? "Update the time and location." : "Add an appointment by hand."}
      onClose={onClose}
      widthClassName="max-w-[560px]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <ActionButton tone="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            tone="primary"
            disabled={!composerState.customerId || !composerState.scheduledFor}
            onClick={onSubmit}
          >
            {editingAppointmentId ? "Save changes" : "Create appointment"}
          </ActionButton>
        </div>
      }
    >
      <div className="grid gap-4">
        <label className="block">
          <div className="app-field-label mb-2">Customer</div>
          <input
            value={composerQuery}
            onChange={(event) => onComposerQueryChange(event.target.value)}
            placeholder="Search for a customer"
            className="app-input app-text-body py-3"
          />
          <div className="mt-2 max-h-[180px] overflow-auto rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45">
            {filteredComposerCustomers.length > 0 ? filteredComposerCustomers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => {
                  onComposerStateChange({ ...composerState, customerId: customer.id });
                  onComposerQueryChange(customer.name);
                }}
                className="app-entity-row w-full text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[var(--app-text)]">{customer.name}</div>
                  <div className="mt-1 text-xs text-[var(--app-text-muted)]">{customer.phone}</div>
                </div>
              </button>
            )) : (
              <div className="app-text-caption px-3 py-3">No active customers match this search.</div>
            )}
          </div>
        </label>

        {!editingAppointmentId ? (
          <label className="block">
            <div className="app-field-label mb-2">Appointment type</div>
            <select
              value={composerState.typeKey}
              onChange={(event) => onComposerStateChange({ ...composerState, typeKey: event.target.value as ServiceAppointmentType })}
              className="app-input app-text-body py-3"
            >
              {serviceAppointmentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <div className="app-field-label mb-2">Date and time</div>
            <input
              type="datetime-local"
              value={composerState.scheduledFor}
              onChange={(event) => onComposerStateChange({ ...composerState, scheduledFor: event.target.value })}
              className="app-input app-text-body py-3"
            />
          </label>

          <label className="block">
            <div className="app-field-label mb-2">Location</div>
            <select
              value={composerState.location}
              onChange={(event) => onComposerStateChange({ ...composerState, location: event.target.value as PickupLocation })}
              className="app-input app-text-body py-3"
            >
              {pickupLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </ModalShell>
  );
}
