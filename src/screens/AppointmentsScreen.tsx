import { CalendarDays, ChevronLeft, ChevronRight, List, Search } from "lucide-react";
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
import { ConfirmAppointmentCancelModal } from "../features/appointments/components/ConfirmAppointmentCancelModal";
import { AppointmentsRegistry } from "../features/appointments/components/AppointmentsRegistry";
import { AppointmentsScheduleRail } from "../features/appointments/components/AppointmentsScheduleRail";
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
  const [locationFilter, setLocationFilter] = useState<PickupLocation | "all">("all");
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
  const listAppointments = sortedAppointments.filter((appointment) => {
    const matchesQuery = query.trim().length === 0 || getAppointmentSearchText(appointment).includes(query.trim().toLowerCase());
    const matchesLocation = locationFilter === "all" || appointment.location === locationFilter;
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
          ? isActiveAppointment(appointment)
          : appointment.statusKey === statusFilter;

    return matchesQuery && matchesLocation && matchesStatus;
  });
  const railAppointments = selectedDateKey
    ? sortedAppointments.filter((appointment) => getAppointmentDateKey(appointment) === selectedDateKey)
    : sortedAppointments;
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

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={CalendarDays}
        title="Appointments"
        subtitle={viewMode === "calendar" ? monthLabel : "Search appointments"}
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
            {viewMode === "calendar" ? (
              <>
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
              </>
            ) : null}
          </div>
        }
      />

      <div className="app-control-deck px-4 py-4">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
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

          {viewMode === "list" ? (
            <div className="border-t border-[var(--app-border)]/35 pt-4">
              <div className="flex flex-wrap items-end gap-3">
                <SearchField
                  label="Search appointments"
                  value={query}
                  onChange={setQuery}
                  placeholder="Search by customer, visit, or location"
                  icon={Search}
                  className="min-w-[280px] flex-1"
                />

                <SelectField
                  label="Status"
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value as AppointmentStatusFilter)}
                  className="min-w-[180px]"
                >
                  <option value="active">Active</option>
                  <option value="all">All statuses</option>
                  <option value="completed">Completed</option>
                  <option value="canceled">Canceled</option>
                </SelectField>

                <SelectField
                  label="Location"
                  value={locationFilter}
                  onChange={(value) => setLocationFilter(value as PickupLocation | "all")}
                  className="min-w-[180px]"
                >
                  <option value="all">All locations</option>
                  {pickupLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </SelectField>
              </div>

              <div className="app-text-caption mt-3">{listAppointments.length} {listAppointments.length === 1 ? "result" : "results"}</div>
            </div>
          ) : null}
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <AppointmentsCalendar
            anchorDate={anchorDate}
            selectedDateKey={selectedDateKey}
            todayKey={todayKey}
            appointments={appointments}
            onSelectDate={setSelectedDateKey}
          />

          <AppointmentsScheduleRail
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
      ) : (
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
