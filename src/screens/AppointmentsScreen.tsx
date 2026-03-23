import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { Appointment, Customer, PickupLocation, ServiceAppointmentType } from "../types";
import { ActionButton, SectionHeader } from "../components/ui/primitives";
import {
  AppointmentComposerModal,
  createEmptyAppointmentComposerState,
  getComposerStateForAppointment,
  type AppointmentComposerState,
} from "../features/appointments/components/AppointmentComposerModal";
import { AppointmentsCalendar } from "../features/appointments/components/AppointmentsCalendar";
import { ConfirmAppointmentCancelModal } from "../features/appointments/components/ConfirmAppointmentCancelModal";
import { AppointmentsScheduleRail } from "../features/appointments/components/AppointmentsScheduleRail";
import { compareAppointments, getAppointmentDateKey } from "../features/appointments/selectors";

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
  onRescheduleAppointment,
  onCompleteAppointment,
  onCancelAppointment,
}: AppointmentsScreenProps) {
  const today = new Date();
  const [anchorDate, setAnchorDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(toDateKey(today));
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
            setComposerQuery(appointment.customer);
            setComposerState(getComposerStateForAppointment(appointment));
            setComposerOpen(true);
          }}
          onCompleteAppointment={onCompleteAppointment}
          onCancelAppointment={setCancelingAppointment}
        />
      </div>

      <AppointmentComposerModal
        customers={customers}
        pickupLocations={pickupLocations}
        composerOpen={composerOpen}
        editingAppointmentId={editingAppointmentId}
        composerQuery={composerQuery}
        composerState={composerState}
        onComposerQueryChange={setComposerQuery}
        onComposerStateChange={setComposerState}
        onClose={() => setComposerOpen(false)}
        onSubmit={() => {
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
