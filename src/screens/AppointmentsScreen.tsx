import { CalendarDays } from "lucide-react";
import type { Appointment } from "../types";
import { Card, EmptyState, SectionHeader, StatusPill } from "../components/ui/primitives";

type AppointmentsScreenProps = {
  appointments: Appointment[];
};

function formatDateLabel(dateValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateValue}T12:00:00`));
}

function getMonthDays(anchorDate: Date) {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
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

export function AppointmentsScreen({ appointments }: AppointmentsScreenProps) {
  const anchorDate = new Date();
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(anchorDate);
  const dayCells = getMonthDays(anchorDate);
  const todayKey = toDateKey(new Date());

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <SectionHeader
          icon={CalendarDays}
          title="Appointments"
          subtitle={monthLabel}
        />

        <div className="grid grid-cols-7 gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayLabel) => (
            <div key={dayLabel} className="app-text-overline px-2 py-1 text-center">
              {dayLabel}
            </div>
          ))}

          {dayCells.map((day) => {
            const dayKey = toDateKey(day);
            const dayAppointments = appointments.filter((appointment) => appointment.date === dayKey);
            const isCurrentMonth = day.getMonth() === anchorDate.getMonth();
            const isToday = dayKey === todayKey;

            return (
              <div
                key={dayKey}
                className={`min-h-[132px] rounded-[var(--app-radius-md)] border p-2 ${
                  isToday
                    ? "border-[var(--app-accent)] bg-[var(--app-surface)]"
                    : isCurrentMonth
                      ? "border-[var(--app-border)] bg-[var(--app-surface)]/62"
                      : "border-[var(--app-border)]/55 bg-[var(--app-surface-muted)]/28 opacity-70"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="app-text-body font-medium">{day.getDate()}</div>
                  {dayAppointments.length > 0 ? (
                    <StatusPill tone={isToday ? "dark" : "default"}>{dayAppointments.length}</StatusPill>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  {dayAppointments.slice(0, 3).map((appointment) => (
                    <div key={appointment.id} className="rounded-[var(--app-radius-sm)] bg-[var(--app-surface-muted)]/35 px-2 py-1.5">
                      <div className="text-[12px] font-semibold text-[var(--app-text)]">{appointment.time}</div>
                      <div className="mt-0.5 text-[12px] leading-snug text-[var(--app-text-muted)]">{appointment.customer}</div>
                      <div className="mt-0.5 text-[11px] leading-snug text-[var(--app-text-soft)]">{appointment.location}</div>
                    </div>
                  ))}
                  {dayAppointments.length > 3 ? (
                    <div className="app-text-caption px-1">+{dayAppointments.length - 3} more</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <div className="app-section-title">Upcoming schedule</div>
        {appointments.length === 0 ? (
          <EmptyState className="mt-3">No appointments scheduled.</EmptyState>
        ) : (
          <div className="mt-4 space-y-3">
            {[...appointments]
              .sort((left, right) => `${left.date}${left.time}`.localeCompare(`${right.date}${right.time}`))
              .map((appointment) => (
                <div key={appointment.id} className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/55 bg-[var(--app-surface)]/55 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="app-text-strong">{appointment.customer}</div>
                      <div className="app-text-caption mt-1">{appointment.type} • {appointment.location}</div>
                    </div>
                    <div className="text-right">
                      <div className="app-text-body font-medium">{formatDateLabel(appointment.date)}</div>
                      <div className="app-text-caption mt-1">{appointment.time}</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}
