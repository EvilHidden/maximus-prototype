import { ActionButton, ModalShell, StatusPill } from "../../../components/ui/primitives";
import type { Appointment } from "../../../types";
import { getAppointmentDateLabel, getAppointmentTimeLabel } from "../selectors";

type ConfirmAppointmentCancelModalProps = {
  appointment: Appointment;
  onConfirm: () => void;
  onClose: () => void;
};

function getKindLabel(appointment: Appointment) {
  return appointment.kind === "pickup" ? "Pickup" : "Appointment";
}

export function ConfirmAppointmentCancelModal({
  appointment,
  onConfirm,
  onClose,
}: ConfirmAppointmentCancelModalProps) {
  const confirmLabel = appointment.kind === "pickup" ? "Cancel pickup" : "Cancel appointment";

  return (
    <ModalShell
      title={confirmLabel}
      subtitle={`Remove ${appointment.customer} from the active schedule?`}
      onClose={onClose}
      showCloseButton={false}
      widthClassName="max-w-[460px]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <ActionButton tone="secondary" onClick={onClose}>
            Keep scheduled
          </ActionButton>
          <button
            onClick={onConfirm}
            className="flex min-h-11 items-center justify-center gap-2 rounded-[var(--app-radius-md)] border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 transition hover:border-amber-300 hover:bg-amber-100"
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <StatusPill tone={appointment.kind === "pickup" ? "warn" : "default"}>
            {getKindLabel(appointment)}
          </StatusPill>
          <div className="app-text-caption">
            {getAppointmentDateLabel(appointment)} at {getAppointmentTimeLabel(appointment)}
          </div>
        </div>
        <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/18 px-3 py-3">
          <div className="app-text-strong">{appointment.customer}</div>
          <div className="app-text-caption mt-1">{appointment.type}</div>
          <div className="app-text-caption mt-1">{appointment.location}</div>
        </div>
        <div className="app-text-body">
          This keeps the appointment in history, but removes it from active workflow views.
        </div>
      </div>
    </ModalShell>
  );
}
