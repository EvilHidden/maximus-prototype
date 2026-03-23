import { ActionButton, EmptyState, StatusPill, Surface, SurfaceHeader } from "../../../components/ui/primitives";
import type { Appointment, ServiceAppointmentType } from "../../../types";
import {
  getAppointmentContextFlagLabel,
  getAppointmentDateLabel,
  getAppointmentPrepFlagLabel,
  getAppointmentProfileFlagLabel,
  getAppointmentTimeLabel,
} from "../selectors";

type AppointmentsScheduleRailProps = {
  railAppointments: Appointment[];
  selectedDateKey: string | null;
  railSubtitle: string;
  onShowAll: () => void;
  onOpenReschedule: (appointment: Appointment) => void;
  onCompleteAppointment: (appointmentId: string) => void;
  onCancelAppointment: (appointment: Appointment) => void;
};

function getScheduleLine(appointment: Appointment) {
  if (appointment.kind !== "pickup") {
    return appointment.type;
  }

  const summary = appointment.pickupSummary ?? "";
  const hasAlteration = /Alterations:/i.test(summary);
  const hasCustom = /Custom:/i.test(summary);

  if (hasAlteration && hasCustom) {
    return "Alterations + custom pickup";
  }

  if (hasAlteration) {
    return "Alteration pickup";
  }

  if (hasCustom) {
    return "Custom pickup";
  }

  return appointment.type;
}

export function AppointmentsScheduleRail({
  railAppointments,
  selectedDateKey,
  railSubtitle,
  onShowAll,
  onOpenReschedule,
  onCompleteAppointment,
  onCancelAppointment,
}: AppointmentsScheduleRailProps) {
  return (
    <Surface tone="support" as="aside" className="flex h-full w-full min-w-[360px] max-w-[360px] flex-col p-4">
      <SurfaceHeader
        title="Upcoming schedule"
        subtitle={railSubtitle}
        className="mb-3"
        meta={
          selectedDateKey ? (
            <div className="w-[96px] shrink-0 text-right">
              <ActionButton
                tone="quiet"
                className="whitespace-nowrap px-2.5 py-1.5 text-xs"
                onClick={onShowAll}
              >
                Show all
              </ActionButton>
            </div>
          ) : null
        }
      />
      {railAppointments.length === 0 ? (
        <EmptyState className="mt-1">No appointments scheduled.</EmptyState>
      ) : (
        <div className="overflow-y-auto pr-1 [scrollbar-gutter:stable]">
          {railAppointments.map((appointment) => {
            const operationalDetail =
              appointment.prepFlags.map(getAppointmentPrepFlagLabel)[0]
              ?? appointment.profileFlags.map(getAppointmentProfileFlagLabel)[0]
              ?? appointment.contextFlags.map(getAppointmentContextFlagLabel)[0]
              ?? "Customer handoff scheduled";

            return (
              <div
                key={appointment.id}
                className="border-b border-[var(--app-border)]/55 py-3.5 last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  <div className="w-[78px] shrink-0 pt-0.5">
                    <div className="app-text-caption">{getAppointmentDateLabel(appointment)}</div>
                    <div className="app-text-body mt-1 font-medium">{getAppointmentTimeLabel(appointment)}</div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="app-text-strong">{appointment.customer}</div>
                        <div className="app-text-caption mt-1">{appointment.location}</div>
                      </div>
                      <StatusPill tone={appointment.kind === "pickup" ? "warn" : "default"}>
                        {appointment.kind === "pickup" ? "Pickup" : "Appointment"}
                      </StatusPill>
                    </div>

                    <div className="app-text-body mt-2">{getScheduleLine(appointment)}</div>
                    <div className="app-text-caption mt-1">{operationalDetail}</div>
                    {appointment.statusKey === "scheduled" || appointment.statusKey === "ready_to_check_in" || appointment.statusKey === "prep_required" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <ActionButton
                          tone="secondary"
                          className="px-2.5 py-1.5 text-xs"
                          onClick={() => onOpenReschedule(appointment)}
                        >
                          Reschedule
                        </ActionButton>
                        {appointment.kind !== "pickup" ? (
                          <ActionButton
                            tone="primary"
                            className="px-2.5 py-1.5 text-xs"
                            onClick={() => onCompleteAppointment(appointment.id)}
                          >
                            Complete
                          </ActionButton>
                        ) : null}
                        <ActionButton
                          tone="secondary"
                          className="px-2.5 py-1.5 text-xs"
                          onClick={() => onCancelAppointment(appointment)}
                        >
                          {appointment.kind === "pickup" ? "Cancel pickup" : "Cancel"}
                        </ActionButton>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Surface>
  );
}
