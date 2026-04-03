import { ChevronLeft, ChevronRight } from "lucide-react";
import { ActionButton, Surface, cx } from "../../../components/ui/primitives";
import type { Appointment } from "../../../types";
import { getAppointmentDateKey } from "../selectors";
import { AppointmentsScheduleRail } from "./AppointmentsScheduleRail";

type AppointmentsMobileAgendaProps = {
  anchorDate: Date;
  monthLabel: string;
  selectedDateKey: string | null;
  railSubtitle: string;
  todayKey: string;
  appointments: Appointment[];
  railAppointments: Appointment[];
  onSelectDate: (dateKey: string) => void;
  onPreviousMonth: () => void;
  onToday: () => void;
  onNextMonth: () => void;
  onOpenReschedule: (appointment: Appointment) => void;
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthDays(anchorDate: Date) {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: totalDays }, (_, index) => new Date(year, month, index + 1));
}

export function AppointmentsMobileAgenda({
  anchorDate,
  monthLabel,
  selectedDateKey,
  railSubtitle,
  todayKey,
  appointments,
  railAppointments,
  onSelectDate,
  onPreviousMonth,
  onToday,
  onNextMonth,
  onOpenReschedule,
}: AppointmentsMobileAgendaProps) {
  const monthDays = getMonthDays(anchorDate);

  return (
    <div className="space-y-3 md:hidden">
      <Surface tone="work" className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="app-text-value">{monthLabel}</div>
            <div className="app-text-caption mt-1">Choose a day to view appointments.</div>
          </div>
          <div className="flex items-center gap-1.5">
            <ActionButton
              tone="secondary"
              className="h-8.5 min-w-0 px-2.5 py-0 text-[0.72rem]"
              onClick={onPreviousMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </ActionButton>
            <ActionButton
              tone="secondary"
              className="h-8.5 px-3 py-0 text-[0.72rem]"
              onClick={onToday}
            >
              Today
            </ActionButton>
            <ActionButton
              tone="secondary"
              className="h-8.5 min-w-0 px-2.5 py-0 text-[0.72rem]"
              onClick={onNextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </ActionButton>
          </div>
        </div>

        <div className="-mx-1 mt-3 overflow-x-auto pb-1 app-no-scrollbar">
          <div className="flex min-w-max gap-2 px-1">
            {monthDays.map((day) => {
              const dayKey = toDateKey(day);
              const appointmentCount = appointments.filter((appointment) => getAppointmentDateKey(appointment) === dayKey).length;
              const isSelected = selectedDateKey === dayKey;
              const isToday = todayKey === dayKey;

              return (
                <button
                  key={dayKey}
                  type="button"
                  onClick={() => onSelectDate(dayKey)}
                  className={cx(
                    "flex min-w-[4.25rem] flex-col items-start gap-1 rounded-[var(--app-radius-md)] border px-2.5 py-2 text-left transition",
                    isSelected
                      ? "border-[var(--app-accent)] bg-[var(--app-surface)] shadow-[inset_0_0_0_1px_var(--app-accent)]"
                      : isToday
                        ? "border-[var(--app-border-strong)] bg-[var(--app-surface)]"
                        : "border-[var(--app-border)]/70 bg-[var(--app-surface-muted)]/26",
                  )}
                >
                  <div className="app-text-overline">{new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(day)}</div>
                  <div className={cx("text-[1rem] font-semibold leading-none", isSelected || isToday ? "text-[var(--app-text)]" : "text-[var(--app-text-muted)]")}>
                    {day.getDate()}
                  </div>
                  <div className="app-text-caption mt-0.5">
                    {appointmentCount === 0 ? "No appts" : `${appointmentCount} appt${appointmentCount === 1 ? "" : "s"}`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Surface>

      <AppointmentsScheduleRail
        title="Day schedule"
        railAppointments={railAppointments}
        selectedDateKey={selectedDateKey}
        railSubtitle={railSubtitle}
        onShowAll={() => {}}
        onOpenReschedule={onOpenReschedule}
        showShowAllButton={false}
        tone="work"
        className="h-auto"
      />
    </div>
  );
}
