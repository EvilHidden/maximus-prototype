import { CalendarCheck2, ChevronLeft, ChevronRight, PencilRuler, Ruler, Scissors, Users, type LucideIcon } from "lucide-react";
import { ActionButton, CalendarDayCard, Surface } from "../../../components/ui/primitives";
import type { Appointment, AppointmentTypeKey } from "../../../types";
import { getAppointmentDateKey } from "../selectors";

export type AppointmentsMonthGridProps = {
  anchorDate: Date;
  monthLabel: string;
  selectedDateKey: string | null;
  todayKey: string;
  appointments: Appointment[];
  onSelectDate: (dateKey: string) => void;
  onPreviousMonth: () => void;
  onToday: () => void;
  onNextMonth: () => void;
  compactShell?: boolean;
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

const appointmentCalendarTypeMeta: Record<AppointmentTypeKey, { icon: LucideIcon; label: string }> = {
  alteration_fitting: { icon: Scissors, label: "Alteration fitting" },
  custom_consult: { icon: PencilRuler, label: "Custom consult" },
  first_fitting: { icon: Ruler, label: "First fitting" },
  custom_fitting: { icon: Ruler, label: "Custom fitting" },
  wedding_party_fitting: { icon: Users, label: "Wedding party fitting" },
  pickup: { icon: CalendarCheck2, label: "Pickup" },
};

function getDayAppointmentGroups(dayAppointments: Appointment[]) {
  const grouped = new Map<AppointmentTypeKey, number>();

  dayAppointments.forEach((appointment) => {
    grouped.set(appointment.typeKey, (grouped.get(appointment.typeKey) ?? 0) + 1);
  });

  return Array.from(grouped.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([typeKey, count]) => ({ typeKey, count, ...appointmentCalendarTypeMeta[typeKey] }));
}

export function AppointmentsMonthGrid({
  anchorDate,
  monthLabel,
  selectedDateKey,
  todayKey,
  appointments,
  onSelectDate,
  onPreviousMonth,
  onToday,
  onNextMonth,
  compactShell = false,
}: AppointmentsMonthGridProps) {
  const dayCells = getMonthDays(anchorDate);

  return (
    <Surface tone="work" className={compactShell ? "app-appointments-calendar-surface app-console-board app-appointments-workboard p-3.5" : "app-appointments-calendar-surface app-console-board app-appointments-workboard p-3.5 min-[1000px]:p-3"}>
      <div
        className={
          compactShell
            ? "app-appointments-calendar__header mb-3 flex flex-wrap items-start justify-between gap-2.5"
            : "app-appointments-calendar__header mb-2 flex flex-wrap items-start justify-between gap-2.5 px-1"
        }
      >
        <div>
          <div className="app-text-value">{monthLabel}</div>
        </div>
        <div className="app-appointments-calendar__toolbar flex items-center gap-2">
          <ActionButton
            tone="secondary"
            className="h-8.5 gap-1.5 px-3 py-0 text-xs"
            onClick={onPreviousMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </ActionButton>
          <ActionButton tone="secondary" className="h-8.5 px-3 py-0 text-xs" onClick={onToday}>
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
      <div
        className={
          compactShell
            ? "app-appointments-calendar__shell"
            : "app-appointments-calendar__shell rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/72 p-2 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--app-surface)_78%,transparent)] min-[1000px]:p-1.5"
        }
      >
        <div className={compactShell ? "app-appointments-month-grid grid grid-cols-7 gap-2" : "app-appointments-month-grid grid grid-cols-7 gap-2 min-[1000px]:gap-1.5"}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayLabel) => (
            <div key={dayLabel} className="app-text-overline px-2 py-1 text-center">
              {dayLabel}
            </div>
          ))}

          {dayCells.map((day) => {
            const dayKey = toDateKey(day);
            const dayAppointments = appointments.filter((appointment) => getAppointmentDateKey(appointment) === dayKey);
            const dayAppointmentGroups = getDayAppointmentGroups(dayAppointments);
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
                itemCount={dayAppointments.length}
                onClick={() => onSelectDate(dayKey)}
              >
                {hasAppointments ? (
                  <div className="px-0.5 py-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {dayAppointmentGroups.slice(0, 4).map(({ typeKey, count, icon: Icon, label }) => (
                        <div
                          key={typeKey}
                          className="inline-flex h-5 w-5 items-center justify-center text-[var(--app-text-soft)]"
                          title={`${count} ${label}${count === 1 ? "" : "s"}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                      ))}
                      {dayAppointmentGroups.length > 4 ? (
                        <div className="inline-flex h-5 min-w-5 items-center justify-center text-[10px] font-semibold text-[var(--app-text-soft)]">
                          +{dayAppointmentGroups.length - 4}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </CalendarDayCard>
            );
          })}
        </div>
      </div>
    </Surface>
  );
}
