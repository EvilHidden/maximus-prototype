import { CalendarClock, MapPin } from "lucide-react";
import { ActionButton, ModalShell } from "../../../components/ui/primitives";
import { ModalFooterActions, ModalMetaRow } from "../../../components/ui/modalPatterns";
import type { Appointment } from "../../../types";
import { getAppointmentDateLabel, getAppointmentTimeLabel } from "../selectors";

type ConfirmAppointmentCancelModalProps = {
  appointment: Appointment;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmAppointmentCancelModal({
  appointment,
  onConfirm,
  onClose,
}: ConfirmAppointmentCancelModalProps) {
  const confirmLabel = appointment.kind === "pickup" ? "Cancel pickup" : "Cancel appointment";

  return (
    <ModalShell
      title={confirmLabel}
      onClose={onClose}
      showCloseButton={false}
      widthClassName="max-w-[400px]"
      footer={
        <ModalFooterActions>
          <ActionButton tone="secondary" onClick={onClose} className="min-w-[140px] justify-center">
            Keep it scheduled
          </ActionButton>
          <ActionButton tone="danger" onClick={onConfirm} className="min-w-[140px] justify-center">
            {confirmLabel}
          </ActionButton>
        </ModalFooterActions>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1.5 border-b border-[var(--app-border)]/45 pb-3">
          <div className="app-text-value">{appointment.customer}</div>
          <div className="app-text-body">{appointment.type}</div>
          <ModalMetaRow
            className="pt-1"
            items={[
              {
                icon: CalendarClock,
                content: `${getAppointmentDateLabel(appointment)} · ${getAppointmentTimeLabel(appointment)}`,
              },
              {
                icon: MapPin,
                content: appointment.location,
              },
            ]}
          />
        </div>
      </div>
    </ModalShell>
  );
}
