import { CalendarDayCard, Surface } from "../../../components/ui/primitives";
import type { Appointment } from "../../../types";
import { getAppointmentDateKey, getAppointmentTimeLabel } from "../selectors";

type AppointmentsCalendarProps = {
  anchorDate: Date;
  selectedDateKey: string | null;
  todayKey: string;
  appointments: Appointment[];
  onSelectDate: (dateKey: string) => void;
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
  if (appointment.kind === "pickup") {
    return "Pickup";
  }

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
  selectedDateKey,
  todayKey,
  appointments,
  onSelectDate,
}: AppointmentsCalendarProps) {
  const dayCells = getMonthDays(anchorDate);

  return (
    <Surface tone="work" className="p-4">
      <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/72 p-2.5 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--app-surface)_78%,transparent)]">
        <div className="grid grid-cols-7 gap-2.5">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayLabel) => (
            <div
              key={dayLabel}
              className="app-text-overline px-2 py-1.5 text-center"
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
                      className={`rounded-[var(--app-radius-sm)] border px-2 py-1.5 ${
                        appointment.kind === "pickup"
                          ? "border-[var(--app-warn-border)]/45 bg-[var(--app-warn-bg)]/45"
                          : "border-[var(--app-border)]/45 bg-[var(--app-surface-muted)]/22"
                      }`}
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
                    <div className="h-[54px] rounded-[var(--app-radius-sm)] border border-dashed border-[var(--app-border)]/35 bg-[var(--app-surface-muted)]/10" />
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
