import { CalendarDays, CheckSquare2, List, Search, Square } from "lucide-react";
import { useState } from "react";
import type { Appointment, Customer, PickupLocation, ServiceAppointmentType } from "../types";
import { ActionButton, SearchField, SectionHeader, SelectField, SelectionChip } from "../components/ui/primitives";
import {
  AppointmentComposerModal,
  createEmptyAppointmentComposerState,
  getComposerStateForAppointment,
  type AppointmentComposerState,
} from "../features/appointments/components/AppointmentComposerModal";
import { AppointmentsCalendar } from "../features/appointments/components/AppointmentsCalendar";
import { AppointmentsMobileAgenda } from "../features/appointments/components/AppointmentsMobileAgenda";
import { ConfirmAppointmentCancelModal } from "../features/appointments/components/ConfirmAppointmentCancelModal";
import { AppointmentsRegistry } from "../features/appointments/components/AppointmentsRegistry";
import { AppointmentsScheduleList } from "../features/appointments/components/AppointmentsScheduleList";
import {
  compareAppointments,
  getAppointmentDateKey,
  getAppointmentSearchText,
  isActiveAppointment,
} from "../features/appointments/selectors";

type AppointmentsViewMode = "calendar" | "list";
type AppointmentStatusFilter = "all" | "active" | "completed" | "canceled";

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
  onUpdateAppointment: (payload: {
    appointmentId: string;
    customerId: string;
    typeKey: Appointment["typeKey"];
    location: PickupLocation;
    scheduledFor: string;
    confirmationStatus: "confirmed" | "unconfirmed";
  }) => void;
  onConfirmAppointment: (appointmentId: string) => void;
  onCancelAppointment: (appointmentId: string) => void;
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AppointmentsScreen({
  appointments,
  customers,
  pickupLocations,
  onCreateAppointment,
  onUpdateAppointment,
  onConfirmAppointment,
  onCancelAppointment,
}: AppointmentsScreenProps) {
  const today = new Date();
  const [anchorDate, setAnchorDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(toDateKey(today));
  const [viewMode, setViewMode] = useState<AppointmentsViewMode>("calendar");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatusFilter>("active");
  const [activeLocations, setActiveLocations] = useState<PickupLocation[]>(pickupLocations);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [cancelingAppointment, setCancelingAppointment] = useState<Appointment | null>(null);
  const [composerQuery, setComposerQuery] = useState("");
  const [composerState, setComposerState] = useState<AppointmentComposerState>(() => createEmptyAppointmentComposerState(pickupLocations));

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(anchorDate);
  const todayKey = toDateKey(today);
  const sortedAppointments = [...appointments].sort(compareAppointments);
  const allLocationsActive =
    activeLocations.length === pickupLocations.length && pickupLocations.every((location) => activeLocations.includes(location));
  const filteredAppointments = sortedAppointments.filter((appointment) => activeLocations.includes(appointment.location));
  const listAppointments = sortedAppointments.filter((appointment) => {
    const matchesQuery = query.trim().length === 0 || getAppointmentSearchText(appointment).includes(query.trim().toLowerCase());
    const matchesLocation = activeLocations.includes(appointment.location);
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
          ? isActiveAppointment(appointment)
          : appointment.statusKey === statusFilter;

    return matchesQuery && matchesLocation && matchesStatus;
  });
  const railAppointments = selectedDateKey
    ? filteredAppointments.filter((appointment) => getAppointmentDateKey(appointment) === selectedDateKey)
    : filteredAppointments;
  const editingAppointment = editingAppointmentId
    ? appointments.find((appointment) => appointment.id === editingAppointmentId) ?? null
    : null;
  const railSubtitle = selectedDateKey
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(new Date(`${selectedDateKey}T12:00:00`))
    : "Appointments";
  const locationSelectionChips = (
    <>
      <SelectionChip
        selected={allLocationsActive}
        onClick={() => setActiveLocations(allLocationsActive ? [] : pickupLocations)}
        leading={allLocationsActive ? <CheckSquare2 className="h-4 w-4" /> : <Square className="h-4 w-4" />}
        size="sm"
        className="shrink-0"
      >
        All
      </SelectionChip>
      {pickupLocations.map((location) => {
        const isActive = activeLocations.includes(location);

        return (
          <SelectionChip
            key={location}
            selected={isActive}
            onClick={() => {
              setActiveLocations((current) => {
                if (current.includes(location)) {
                  return current.filter((value) => value !== location);
                }

                return [...current, location];
              });
            }}
            leading={isActive ? <CheckSquare2 className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            size="sm"
            className="shrink-0"
          >
            {location}
          </SelectionChip>
        );
      })}
    </>
  );

  return (
    <div className="space-y-3.5 app-appointments-screen">
      <SectionHeader
        icon={CalendarDays}
        title="Appointments"
        action={
          <ActionButton
            tone="primary"
            className="h-10 px-4 py-0 text-sm"
            onClick={() => {
              setEditingAppointmentId(null);
              setComposerQuery("");
              setComposerState(createEmptyAppointmentComposerState(pickupLocations));
              setComposerOpen(true);
            }}
          >
            New appointment
          </ActionButton>
        }
      />

      <div className="hidden app-control-deck app-console-deck app-appointments-screen__controls px-4 py-3 min-[1000px]:px-3.5 min-[1000px]:py-2.5 md:block">
        <div className="flex flex-wrap items-center gap-3">
          <div className="app-console-intro app-appointments-screen__controls-intro">
            <div className="app-text-overline">Scheduling board</div>
            <div className="app-text-strong mt-1">Switch between calendar planning and active visit follow-through.</div>
          </div>

          <div className="h-6 w-px bg-[var(--app-border)]/35" />

          <div className="flex flex-wrap items-center gap-2">
            <SelectionChip
              selected={viewMode === "calendar"}
              onClick={() => setViewMode("calendar")}
              leading={<CalendarDays className="h-4 w-4" />}
            >
              Calendar
            </SelectionChip>
            <SelectionChip
              selected={viewMode === "list"}
              onClick={() => setViewMode("list")}
              leading={<List className="h-4 w-4" />}
            >
              Appointments list
            </SelectionChip>
          </div>

          <div className="h-6 w-px bg-[var(--app-border)]/35" />

          <div className="shrink-0">
            <div className="app-text-overline">View locations</div>
          </div>
          <div className="flex min-w-0 basis-auto flex-1 flex-wrap gap-1.5">
            {locationSelectionChips}
          </div>
        </div>
      </div>

      <div className="app-control-deck app-console-deck app-appointments-screen__mobile-controls px-4 py-3 md:hidden">
        <div className="space-y-2.5">
          <div className="app-text-overline px-0.5 text-[var(--app-text-soft)]/62">Filter locations</div>
          <div className="-mx-1 overflow-x-auto px-1 py-1 app-no-scrollbar">
            <div className="flex gap-2.5">{locationSelectionChips}</div>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="hidden app-control-deck app-console-deck app-appointments-screen__filters px-4 py-3 min-[1000px]:px-3.5 min-[1000px]:py-2.5 md:block">
          <div className="pt-1">
            <div className="flex flex-wrap items-end gap-3">
              <SearchField
                label="Search appointments"
                value={query}
                onChange={setQuery}
                placeholder="Search by customer, visit, or location"
                icon={Search}
                className="min-w-0 basis-full md:min-w-[240px] md:flex-1"
              />

              <SelectField
                label="Status"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as AppointmentStatusFilter)}
                className="min-w-0 basis-full md:min-w-[160px]"
              >
                <option value="active">Active</option>
                <option value="all">All statuses</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
              </SelectField>

            </div>

            <div className="app-text-caption mt-3 border-t border-[var(--app-border)]/35 pt-3">
              {listAppointments.length} {listAppointments.length === 1 ? "result" : "results"}
            </div>
          </div>
        </div>
      ) : null}

      <AppointmentsMobileAgenda
        anchorDate={anchorDate}
        monthLabel={monthLabel}
        selectedDateKey={selectedDateKey}
        railSubtitle={railSubtitle}
        todayKey={todayKey}
        appointments={filteredAppointments}
        railAppointments={railAppointments}
        onSelectDate={setSelectedDateKey}
        onPreviousMonth={() => {
          const nextDate = new Date(anchorDate);
          nextDate.setMonth(nextDate.getMonth() - 1);
          setAnchorDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
        }}
        onToday={() => {
          setAnchorDate(new Date(today.getFullYear(), today.getMonth(), 1));
          setSelectedDateKey(todayKey);
        }}
        onNextMonth={() => {
          const nextDate = new Date(anchorDate);
          nextDate.setMonth(nextDate.getMonth() + 1);
          setAnchorDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
        }}
        onOpenReschedule={(appointment) => {
          setEditingAppointmentId(appointment.id);
          setComposerQuery("");
          setComposerState(getComposerStateForAppointment(appointment));
          setComposerOpen(true);
        }}
      />

      {viewMode === "calendar" ? (
        <div className="hidden md:block">
          <div className="app-page-with-support-rail app-appointments-calendar-layout">
            <AppointmentsCalendar
              anchorDate={anchorDate}
              monthLabel={monthLabel}
              selectedDateKey={selectedDateKey}
              todayKey={todayKey}
              appointments={filteredAppointments}
              onSelectDate={setSelectedDateKey}
              onPreviousMonth={() => {
                const nextDate = new Date(anchorDate);
                nextDate.setMonth(nextDate.getMonth() - 1);
                setAnchorDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
              }}
              onToday={() => {
                setAnchorDate(new Date(today.getFullYear(), today.getMonth(), 1));
                setSelectedDateKey(todayKey);
              }}
              onNextMonth={() => {
                const nextDate = new Date(anchorDate);
                nextDate.setMonth(nextDate.getMonth() + 1);
                setAnchorDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
              }}
            />

            <AppointmentsScheduleList
              railAppointments={railAppointments}
              selectedDateKey={selectedDateKey}
              railSubtitle={railSubtitle}
              onShowAll={() => setSelectedDateKey(null)}
              onOpenReschedule={(appointment) => {
                setEditingAppointmentId(appointment.id);
                setComposerQuery("");
                setComposerState(getComposerStateForAppointment(appointment));
                setComposerOpen(true);
              }}
            />
          </div>
        </div>
      ) : (
        <div className="hidden md:block">
          <AppointmentsRegistry
            appointments={listAppointments}
            customers={customers}
            onOpenReschedule={(appointment) => {
              setEditingAppointmentId(appointment.id);
              setComposerQuery("");
              setComposerState(getComposerStateForAppointment(appointment));
              setComposerOpen(true);
            }}
            onConfirmAppointment={onConfirmAppointment}
            onCancelAppointment={setCancelingAppointment}
          />
        </div>
      )}

      <AppointmentComposerModal
        customers={customers}
        pickupLocations={pickupLocations}
        composerOpen={composerOpen}
        editingAppointment={editingAppointment}
        composerQuery={composerQuery}
        composerState={composerState}
        onComposerQueryChange={setComposerQuery}
        onComposerStateChange={setComposerState}
        onClose={() => setComposerOpen(false)}
        onRequestCancel={(appointment) => {
          setComposerOpen(false);
          setCancelingAppointment(appointment);
        }}
        onSubmit={() => {
          if (editingAppointment) {
            onUpdateAppointment({
              appointmentId: editingAppointment.id,
              customerId: composerState.customerId,
              typeKey: composerState.typeKey,
              location: composerState.location,
              scheduledFor: composerState.scheduledFor,
              confirmationStatus: composerState.confirmationStatus,
            });
          } else {
            onCreateAppointment({
              customerId: composerState.customerId,
              typeKey: composerState.typeKey as ServiceAppointmentType,
              location: composerState.location,
              scheduledFor: composerState.scheduledFor,
            });
          }
          setComposerOpen(false);
        }}
      />

      {cancelingAppointment ? (
        <ConfirmAppointmentCancelModal
          appointment={cancelingAppointment}
          onClose={() => setCancelingAppointment(null)}
          onConfirm={() => {
            onCancelAppointment(cancelingAppointment.id);
            setCancelingAppointment(null);
          }}
        />
      ) : null}
    </div>
  );
}
