import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { Appointment, Customer, PickupLocation, ServiceAppointmentType } from "../types";
import { filterCustomers, getActiveCustomers } from "../features/customer/selectors";
import { ActionButton, CalendarDayCard, EmptyState, ModalShell, SectionHeader, StatusPill, Surface, SurfaceHeader } from "../components/ui/primitives";
import {
  compareAppointments,
  getAppointmentDateKey,
  getAppointmentDateLabel,
  getAppointmentTimeLabel,
} from "../features/appointments/selectors";

type AppointmentsScreenProps = {
  appointments: Appointment[];
  customers: Customer[];
  pickupLocations: PickupLocation[];
  onCreateAppointment: (payload: {
    customerId: string;
    typeKey: ServiceAppointmentType;
    location: PickupLocation;
    scheduledFor: string;
  }) => void;
  onRescheduleAppointment: (payload: {
    appointmentId: string;
    location: PickupLocation;
    scheduledFor: string;
  }) => void;
  onCompleteAppointment: (appointmentId: string) => void;
  onCancelAppointment: (appointmentId: string) => void;
};

type AppointmentComposerState = {
  customerId: string;
  typeKey: ServiceAppointmentType;
  location: PickupLocation;
  scheduledFor: string;
};

const serviceAppointmentTypeOptions: Array<{ value: ServiceAppointmentType; label: string }> = [
  { value: "alteration_fitting", label: "Alteration fitting" },
  { value: "custom_consult", label: "Custom consult" },
  { value: "first_fitting", label: "First fitting" },
  { value: "custom_fitting", label: "Custom fitting" },
  { value: "wedding_party_fitting", label: "Wedding party fitting" },
];

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

function createEmptyAppointmentComposerState(pickupLocations: PickupLocation[]): AppointmentComposerState {
  return {
    customerId: "",
    typeKey: "alteration_fitting",
    location: pickupLocations[0] ?? "Fifth Avenue",
    scheduledFor: "",
  };
}

export function AppointmentsScreen({
  appointments,
  customers,
  pickupLocations,
  onCreateAppointment,
  onRescheduleAppointment,
  onCompleteAppointment,
  onCancelAppointment,
}: AppointmentsScreenProps) {
  const today = new Date();
  const [anchorDate, setAnchorDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(toDateKey(today));
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [composerQuery, setComposerQuery] = useState("");
  const [composerState, setComposerState] = useState<AppointmentComposerState>(() => createEmptyAppointmentComposerState(pickupLocations));

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(anchorDate);
  const dayCells = useMemo(() => getMonthDays(anchorDate), [anchorDate]);
  const todayKey = toDateKey(today);
  const sortedAppointments = [...appointments].sort(compareAppointments);
  const railAppointments = selectedDateKey
    ? sortedAppointments.filter((appointment) => getAppointmentDateKey(appointment) === selectedDateKey)
    : sortedAppointments;
  const railSubtitle = selectedDateKey
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(new Date(`${selectedDateKey}T12:00:00`))
    : "Appointments and pickups";
  const filteredComposerCustomers = useMemo(
    () => filterCustomers(getActiveCustomers(customers), composerQuery),
    [customers, composerQuery],
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={CalendarDays}
        title="Appointments"
        subtitle={monthLabel}
        action={
          <div className="flex items-center gap-2">
            <ActionButton
              tone="primary"
              className="h-9 px-3 py-0 text-xs"
              onClick={() => {
                setEditingAppointmentId(null);
                setComposerQuery("");
                setComposerState(createEmptyAppointmentComposerState(pickupLocations));
                setComposerOpen(true);
              }}
            >
              New appointment
            </ActionButton>
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
                    onClick={() => setSelectedDateKey(dayKey)}
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
                    onClick={() => setSelectedDateKey(null)}
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
              {railAppointments.map((appointment) => (
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
                      {appointment.statusKey === "scheduled" || appointment.statusKey === "ready_to_check_in" || appointment.statusKey === "prep_required" ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <ActionButton
                            tone="secondary"
                            className="px-2.5 py-1.5 text-xs"
                            onClick={() => {
                              setEditingAppointmentId(appointment.id);
                              setComposerQuery(appointment.customer);
                              setComposerState({
                                customerId: appointment.customerId ?? "",
                                typeKey: appointment.kind === "pickup" ? "alteration_fitting" : appointment.typeKey as ServiceAppointmentType,
                                location: appointment.location,
                                scheduledFor: appointment.scheduledFor.slice(0, 16),
                              });
                              setComposerOpen(true);
                            }}
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
                            onClick={() => onCancelAppointment(appointment.id)}
                          >
                            {appointment.kind === "pickup" ? "Cancel pickup" : "Cancel"}
                          </ActionButton>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Surface>
      </div>

      {composerOpen ? (
        <ModalShell
          title={editingAppointmentId ? "Reschedule appointment" : "New appointment"}
          subtitle={editingAppointmentId ? "Update timing and location." : "Create a manual service appointment."}
          onClose={() => setComposerOpen(false)}
          widthClassName="max-w-[560px]"
          footer={
            <div className="flex items-center justify-end gap-2">
              <ActionButton tone="secondary" onClick={() => setComposerOpen(false)}>
                Cancel
              </ActionButton>
              <ActionButton
                tone="primary"
                disabled={!composerState.customerId || !composerState.scheduledFor}
                onClick={() => {
                  if (editingAppointmentId) {
                    onRescheduleAppointment({
                      appointmentId: editingAppointmentId,
                      location: composerState.location,
                      scheduledFor: composerState.scheduledFor,
                    });
                  } else {
                    onCreateAppointment({
                      customerId: composerState.customerId,
                      typeKey: composerState.typeKey,
                      location: composerState.location,
                      scheduledFor: composerState.scheduledFor,
                    });
                  }
                  setComposerOpen(false);
                }}
              >
                {editingAppointmentId ? "Save changes" : "Create appointment"}
              </ActionButton>
            </div>
          }
        >
          <div className="grid gap-4">
            <label className="block">
              <div className="app-field-label mb-2">Customer</div>
              <input
                value={composerQuery}
                onChange={(event) => setComposerQuery(event.target.value)}
                placeholder="Search customer"
                className="app-input app-text-body py-3"
              />
              <div className="mt-2 max-h-[180px] overflow-auto rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45">
                {filteredComposerCustomers.length > 0 ? filteredComposerCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => {
                      setComposerState((current) => ({ ...current, customerId: customer.id }));
                      setComposerQuery(customer.name);
                    }}
                    className="app-entity-row w-full text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-[var(--app-text)]">{customer.name}</div>
                      <div className="mt-1 text-xs text-[var(--app-text-muted)]">{customer.phone}</div>
                    </div>
                  </button>
                )) : (
                  <div className="app-text-caption px-3 py-3">No active customers match this search.</div>
                )}
              </div>
            </label>

            {!editingAppointmentId ? (
              <label className="block">
                <div className="app-field-label mb-2">Appointment type</div>
                <select
                  value={composerState.typeKey}
                  onChange={(event) => setComposerState((current) => ({ ...current, typeKey: event.target.value as ServiceAppointmentType }))}
                  className="app-input app-text-body py-3"
                >
                  {serviceAppointmentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <div className="app-field-label mb-2">Date and time</div>
                <input
                  type="datetime-local"
                  value={composerState.scheduledFor}
                  onChange={(event) => setComposerState((current) => ({ ...current, scheduledFor: event.target.value }))}
                  className="app-input app-text-body py-3"
                />
              </label>

              <label className="block">
                <div className="app-field-label mb-2">Location</div>
                <select
                  value={composerState.location}
                  onChange={(event) => setComposerState((current) => ({ ...current, location: event.target.value as PickupLocation }))}
                  className="app-input app-text-body py-3"
                >
                  {pickupLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
