import { CalendarClock, MapPin } from "lucide-react";
import { ActionButton } from "../../../components/ui/primitives";
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
  const kindLabel = appointment.kind === "pickup" ? "Pickup" : "Appointment";
  const scheduledAt = `${getAppointmentDateLabel(appointment)} · ${getAppointmentTimeLabel(appointment)}`;

  return (
    <div className="fixed inset-0 z-50">
      <div className="app-modal-scrim absolute inset-0" onClick={onClose} />
      <div className="app-modal absolute left-1/2 top-1/2 w-full max-w-[408px] -translate-x-1/2 -translate-y-1/2">
        <div className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-2.5">
              <div className="app-text-overline text-[var(--app-danger-text)]">{kindLabel}</div>
              <div className="app-section-title">Cancel this appointment?</div>
            </div>

            <div className="space-y-3 border-t border-[var(--app-border)]/35 pt-4">
              <div className="app-text-value">{appointment.customer}</div>
              <div className="app-text-body">{appointment.type}</div>

              <div className="space-y-2 pt-1">
                <div className="flex items-start gap-2.5">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--app-text-soft)]" />
                  <div className="min-w-0">
                    <div className="app-text-overline">When</div>
                    <div className="app-text-body">{scheduledAt}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--app-text-soft)]" />
                  <div className="min-w-0">
                    <div className="app-text-overline">Where</div>
                    <div className="app-text-body">{appointment.location}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-t border-[var(--app-border)]/35 pt-4">
            <ActionButton tone="secondary" onClick={onClose} className="min-w-0 flex-1 justify-center">
              Keep it scheduled
            </ActionButton>
            <ActionButton tone="danger" onClick={onConfirm} className="min-w-0 flex-1 justify-center">
              {confirmLabel}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
