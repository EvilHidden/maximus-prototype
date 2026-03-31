import { ChevronLeft, ChevronRight } from "lucide-react";
import { ActionButton, CalendarDayCard, Surface } from "../../../components/ui/primitives";
import type { Appointment } from "../../../types";
import { getAppointmentDateKey, getAppointmentTimeLabel } from "../selectors";

type AppointmentsCalendarProps = {
  anchorDate: Date;
  monthLabel: string;
  selectedDateKey: string | null;
  todayKey: string;
  appointments: Appointment[];
  onSelectDate: (dateKey: string) => void;
  onPreviousMonth: () => void;
  onToday: () => void;
  onNextMonth: () => void;
};

function getMonthDays(anchorDate: Date) {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const endOffset = (7 - (((lastOfMonth.getDay() + 6) % 7) + 1)) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startOffset);
  const totalDays = firstOfMonth.getDate() - 1 + lastOfMonth.getDate() + endOffset;

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCalendarLine(appointment: Appointment) {
  if (/consult/i.test(appointment.type)) {
    return "Consult";
  }

  if (/fitting/i.test(appointment.type)) {
    return "Fitting";
  }

  return appointment.type;
}

export function AppointmentsCalendar({
  anchorDate,
  monthLabel,
  selectedDateKey,
  todayKey,
  appointments,
  onSelectDate,
  onPreviousMonth,
  onToday,
  onNextMonth,
}: AppointmentsCalendarProps) {
  const dayCells = getMonthDays(anchorDate);

  return (
    <Surface tone="work" className="p-3.5 lg:p-3">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2.5 px-1">
        <div>
          <div className="app-text-value">{monthLabel}</div>
        </div>
        <div className="flex items-center gap-2">
          <ActionButton
            tone="secondary"
            className="h-8.5 gap-1.5 px-3 py-0 text-xs"
            onClick={onPreviousMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </ActionButton>
          <ActionButton
            tone="secondary"
            className="h-8.5 px-3 py-0 text-xs"
            onClick={onToday}
          >
            Today
          </ActionButton>
          <ActionButton
            tone="secondary"
            className="h-8.5 gap-1.5 px-3 py-0 text-xs"
            onClick={onNextMonth}
            aria-label="Next month"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </ActionButton>
        </div>
      </div>
      <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/72 p-2 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--app-surface)_78%,transparent)] lg:p-1.5">
        <div className="grid grid-cols-7 gap-2 lg:gap-1.5">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayLabel) => (
            <div
              key={dayLabel}
              className="app-text-overline px-2 py-1 text-center"
            >
              {dayLabel}
            </div>
          ))}

          {dayCells.map((day) => {
            const dayKey = toDateKey(day);
            const dayAppointments = appointments.filter((appointment) => getAppointmentDateKey(appointment) === dayKey);
            const isCurrentMonth = day.getMonth() === anchorDate.getMonth();
            const isToday = dayKey === todayKey;
            const isSelected = dayKey === selectedDateKey;
            const hasAppointments = dayAppointments.length > 0;

            return (
              <CalendarDayCard
                key={dayKey}
                dayNumber={day.getDate()}
                isSelected={isSelected}
                isToday={isToday}
                isCurrentMonth={isCurrentMonth}
                hasItems={hasAppointments}
                onClick={() => onSelectDate(dayKey)}
              >
                <div className="space-y-1.5">
                  {dayAppointments.slice(0, 1).map((appointment) => (
                    <div
                      key={appointment.id}
                      className="rounded-[var(--app-radius-sm)] border border-[var(--app-border)]/45 bg-[var(--app-surface-muted)]/22 px-2 py-1"
                    >
                      <div className="text-[12px] font-semibold text-[var(--app-text)]">{getAppointmentTimeLabel(appointment)}</div>
                      <div className="mt-1 truncate text-[12px] font-medium text-[var(--app-text-muted)]">{appointment.customer}</div>
                      <div className="mt-0.5 truncate text-[11px] leading-snug text-[var(--app-text-soft)]">
                        {getCalendarLine(appointment)}
                      </div>
                    </div>
                  ))}
                  {dayAppointments.length > 1 ? (
                    <div className="app-text-caption px-1">+{dayAppointments.length - 1} more</div>
                  ) : hasAppointments ? null : (
                    <div className="h-[42px] rounded-[var(--app-radius-sm)] border border-dashed border-[var(--app-border)]/35 bg-[var(--app-surface-muted)]/10 lg:h-[36px]" />
                  )}
                </div>
              </CalendarDayCard>
            );
          })}
        </div>
      </div>
    </Surface>
  );
}
