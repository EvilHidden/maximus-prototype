import { ActionButton, EmptyState, Surface, SurfaceHeader, cx } from "../../../components/ui/primitives";
import type { Appointment } from "../../../types";
import {
  getAppointmentConfirmationLabel,
  getAppointmentDateLabel,
  getAppointmentTimeLabel,
  getAppointmentVisitLabel,
} from "../selectors";

type AppointmentsScheduleRailProps = {
  railAppointments: Appointment[];
  selectedDateKey: string | null;
  railSubtitle: string;
  onShowAll: () => void;
  onOpenReschedule: (appointment: Appointment) => void;
};

export function AppointmentsScheduleRail({
  railAppointments,
  selectedDateKey,
  railSubtitle,
  onShowAll,
  onOpenReschedule,
}: AppointmentsScheduleRailProps) {
  const showDateInRow = !selectedDateKey;

  return (
    <Surface tone="support" as="aside" className="flex h-full w-full min-w-[360px] max-w-[360px] flex-col p-4 md:p-5">
      <SurfaceHeader
        title="Coming up"
        subtitle={railSubtitle}
        className="mb-3 border-b border-[var(--app-border)]/40 pb-3"
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
        <EmptyState className="mt-1">Nothing scheduled here.</EmptyState>
      ) : (
        <div className="overflow-y-auto pr-1 [scrollbar-gutter:stable]">
          {railAppointments.map((appointment) => {
            const confirmation = getAppointmentConfirmationLabel(appointment);
            const isUnconfirmed = confirmation === "Unconfirmed";
            const isActive = appointment.statusKey === "scheduled" || appointment.statusKey === "ready_to_check_in" || appointment.statusKey === "prep_required";

            return (
              <div
                key={appointment.id}
                className="border-b border-[var(--app-border)]/50 py-4 last:border-b-0"
              >
                <div className="grid grid-cols-[84px_minmax(0,1fr)_auto] gap-3">
                  <div className="pt-0.5">
                    {showDateInRow ? <div className="app-text-caption">{getAppointmentDateLabel(appointment)}</div> : null}
                    <div className="app-text-strong mt-1">{getAppointmentTimeLabel(appointment)}</div>
                  </div>

                  <div className="min-w-0">
                    <div className="app-text-value text-[0.95rem]">{appointment.customer}</div>
                    <div className="app-text-caption mt-1">{appointment.location}</div>
                    <div className="app-text-body mt-2 font-medium">{getAppointmentVisitLabel(appointment)}</div>
                    {isUnconfirmed ? (
                      <div
                        className={cx(
                          "app-text-caption mt-1 font-medium",
                          "text-[var(--app-warn-text)]",
                        )}
                      >
                        {confirmation}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex min-w-[54px] flex-col items-end gap-2 pt-0.5">
                    {isActive ? (
                      <ActionButton
                        tone="quiet"
                        className="min-h-8 px-2.5 py-1.5 text-xs"
                        onClick={() => onOpenReschedule(appointment)}
                      >
                        Edit
                      </ActionButton>
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
