import { CalendarClock, MapPin } from "lucide-react";
import { ActionButton, ModalShell } from "../../../components/ui/primitives";
import { ModalFooterActions, ModalMetaRow, ModalSummaryCard } from "../../../components/ui/modalPatterns";
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
  const kindLabel = appointment.kind === "pickup" ? "Pickup visit" : "Appointment";

  return (
    <ModalShell
      title="Cancel this appointment?"
      onClose={onClose}
      showCloseButton={false}
      widthClassName="max-w-[420px]"
      footer={
        <ModalFooterActions>
          <ActionButton tone="secondary" onClick={onClose} className="min-w-0 flex-1 justify-center">
            Keep it scheduled
          </ActionButton>
          <ActionButton tone="danger" onClick={onConfirm} className="min-w-0 flex-1 justify-center">
            {confirmLabel}
          </ActionButton>
        </ModalFooterActions>
      }
    >
      <div className="space-y-3">
        <ModalSummaryCard
          eyebrow={kindLabel}
          title={appointment.customer}
          description={appointment.type}
          meta={
            <ModalMetaRow
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
          }
        />
        <div className="app-text-body-muted">
          This removes it from the schedule now.
        </div>
      </div>
    </ModalShell>
  );
}
