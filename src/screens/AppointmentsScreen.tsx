import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { Appointment } from "../types";
import { ActionButton, EmptyState, SectionHeader, StatusPill } from "../components/ui/primitives";

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

function getScheduleLine(appointment: Appointment) {
  if (appointment.kind !== "pickup") {
    return appointment.type;
  }

  const summary = appointment.pickupSummary ?? "";
  const hasAlteration = /Alterations:/i.test(summary);
  const hasCustom = /Custom:/i.test(summary);

  if (hasAlteration && hasCustom) {
    return "Mixed pickup";
  }

  if (hasAlteration) {
    return "Alteration pickup";
  }

  if (hasCustom) {
    return "Custom pickup";
  }

  return appointment.type;
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

export function AppointmentsScreen({ appointments }: AppointmentsScreenProps) {
  const today = new Date();
  const [anchorDate, setAnchorDate] = useState(() => {
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(toDateKey(today));
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(anchorDate);
  const dayCells = useMemo(() => getMonthDays(anchorDate), [anchorDate]);
  const todayKey = toDateKey(today);
  const sortedAppointments = [...appointments].sort((left, right) =>
    `${left.date}${left.time}`.localeCompare(`${right.date}${right.time}`),
  );
  const railAppointments = selectedDateKey
    ? sortedAppointments.filter((appointment) => appointment.date === selectedDateKey)
    : sortedAppointments;
  const railSubtitle = selectedDateKey ? formatDateLabel(selectedDateKey) : "Appointments and pickups";

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={CalendarDays}
        title="Appointments"
        subtitle={monthLabel}
        action={
          <div className="flex items-center gap-2">
            <ActionButton
              tone="secondary"
              className="h-9 gap-1.5 px-3 py-0 text-xs"
              onClick={() => {
                const nextDate = new Date(anchorDate);
                nextDate.setMonth(nextDate.getMonth() - 1);
                setAnchorDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
              }}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </ActionButton>
            <ActionButton
              tone="secondary"
              className="h-9 px-3 py-0 text-xs"
              onClick={() => {
                setAnchorDate(new Date(today.getFullYear(), today.getMonth(), 1));
                setSelectedDateKey(todayKey);
              }}
            >
              Today
            </ActionButton>
            <ActionButton
              tone="secondary"
              className="h-9 gap-1.5 px-3 py-0 text-xs"
              onClick={() => {
                const nextDate = new Date(anchorDate);
                nextDate.setMonth(nextDate.getMonth() + 1);
                setAnchorDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
              }}
              aria-label="Next month"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </ActionButton>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="app-work-surface p-4">

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
                const dayAppointments = appointments.filter((appointment) => appointment.date === dayKey);
                const isCurrentMonth = day.getMonth() === anchorDate.getMonth();
                const isToday = dayKey === todayKey;
                const isSelected = dayKey === selectedDateKey;
                const hasAppointments = dayAppointments.length > 0;

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => setSelectedDateKey(dayKey)}
                    className={`flex min-h-[118px] flex-col items-stretch justify-start rounded-[var(--app-radius-md)] border px-2.5 py-2 text-left align-top transition-colors ${
                      isSelected
                        ? "border-[var(--app-accent)] bg-[var(--app-surface)] shadow-[inset_0_0_0_1px_var(--app-accent)]"
                        : isToday
                          ? "border-[var(--app-border-strong)] bg-[var(--app-surface)]"
                          : isCurrentMonth
                            ? "border-[var(--app-border)]/75 bg-[var(--app-surface)]"
                            : "border-[var(--app-border)]/45 bg-[var(--app-surface-muted)]/16 opacity-60"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className={isSelected || isToday ? "app-text-strong" : "app-text-body font-medium"}>
                        {day.getDate()}
                      </div>
                      {hasAppointments ? (
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--app-accent)] opacity-70" />
                      ) : null}
                    </div>

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
                          <div className="text-[12px] font-semibold text-[var(--app-text)]">{appointment.time}</div>
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
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="app-support-rail flex h-full w-full min-w-[360px] max-w-[360px] flex-col p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="app-section-title">Upcoming schedule</div>
              <div className="app-section-copy">{railSubtitle}</div>
            </div>
            <div className="w-[96px] shrink-0 text-right">
              {selectedDateKey ? (
                <ActionButton
                  tone="quiet"
                  className="whitespace-nowrap px-2.5 py-1.5 text-xs"
                  onClick={() => setSelectedDateKey(null)}
                >
                  Show all
                </ActionButton>
              ) : null}
            </div>
          </div>
          {railAppointments.length === 0 ? (
            <EmptyState className="mt-1">No appointments scheduled.</EmptyState>
          ) : (
            <div className="overflow-y-auto pr-1 [scrollbar-gutter:stable]">
              {railAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border-b border-[var(--app-border)]/55 py-3.5 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-[78px] shrink-0 pt-0.5">
                      <div className="app-text-caption">{formatDateLabel(appointment.date)}</div>
                      <div className="app-text-body mt-1 font-medium">{appointment.time}</div>
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
