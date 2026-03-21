import {
  CalendarDays,
  Clock3,
  Package,
  PanelLeft,
  Receipt,
  Ruler,
  UserPlus,
} from "lucide-react";
import { appointments } from "../data";
import type { Appointment, Screen, WorkflowMode } from "../types";
import { ActionButton, Card, SectionHeader, StatusPill, cx } from "../components/ui/primitives";
import { getPickupAppointments, getTodayAppointments, getTomorrowAppointments } from "../features/home/selectors";

type HomeScreenProps = {
  onScreenChange: (screen: Screen) => void;
  onStartWorkflow: (workflow: WorkflowMode) => void;
};

type FrontDeskAction = {
  label: string;
  subtitle: string;
  icon: typeof UserPlus;
  onClick: () => void;
};

function FrontDeskActionTile({
  label,
  subtitle,
  icon: Icon,
  onClick,
}: FrontDeskAction) {
  return (
    <button
      onClick={onClick}
      className="group flex min-h-[112px] flex-col justify-between rounded-[var(--app-radius-md)] border border-[var(--app-border)]/55 bg-[var(--app-surface)]/18 px-4 py-4 text-left transition hover:bg-[var(--app-surface)]/34"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="app-icon-chip transition group-hover:border-[var(--app-border-strong)]">
          <Icon className="h-4 w-4" />
        </div>
        <span className="app-text-overline">Open</span>
      </div>
      <div>
        <div className="app-text-value">{label}</div>
        <div className="app-text-caption mt-1">{subtitle}</div>
      </div>
    </button>
  );
}

function ScheduleRow({
  appointment,
  actionLabel,
  onAction,
}: {
  appointment: Appointment;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/34 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="grid gap-3 md:grid-cols-[88px_minmax(0,1fr)] md:items-start">
            <div className="app-text-value text-[0.95rem]">{appointment.time}</div>
            <div className="min-w-0">
              <div className="app-text-value">{appointment.customer}</div>
              <div className="app-text-caption mt-1">{appointment.type}</div>
            </div>
          </div>
        </div>
        <ActionButton tone="secondary" className="min-h-12 shrink-0 px-4 py-2.5 text-sm" onClick={onAction}>
          {actionLabel}
        </ActionButton>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {appointment.missing !== "Complete" ? <StatusPill tone="warn">{appointment.missing}</StatusPill> : null}
        <StatusPill>{appointment.status}</StatusPill>
      </div>
    </div>
  );
}

function AppointmentLane({
  title,
  subtitle,
  appointments,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  appointments: Appointment[];
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-[var(--app-radius-md)] bg-[var(--app-surface)]/18 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="app-text-value">{title}</div>
          <div className="app-text-caption mt-1">{subtitle}</div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[var(--app-border)]/55 bg-[var(--app-surface)]/26 px-3 py-1.5">
          <Clock3 className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
          <span className="app-text-overline text-[var(--app-text-muted)]">{appointments.length} scheduled</span>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {appointments.map((appointment) => (
          <ScheduleRow key={appointment.id} appointment={appointment} actionLabel={actionLabel} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}

function PickupRow({
  appointment,
  onOpen,
}: {
  appointment: Appointment;
  onOpen: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/34 px-4 py-4 lg:grid-cols-[96px_minmax(0,1fr)_auto] lg:items-center">
      <div>
        <div className="app-text-value text-[0.95rem]">{appointment.time}</div>
        <div className="app-text-caption mt-1">{appointment.day === "today" ? "Today" : "Tomorrow"}</div>
      </div>
      <div className="min-w-0">
        <div className="app-text-value">{appointment.customer}</div>
        <div className="app-text-caption mt-1">{appointment.type}</div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {appointment.missing !== "Complete" ? <StatusPill tone="warn">{appointment.missing}</StatusPill> : null}
          <StatusPill>{appointment.status}</StatusPill>
        </div>
      </div>
      <ActionButton tone="secondary" className="min-h-12 px-4 py-2.5 text-sm" onClick={onOpen}>
        Open
      </ActionButton>
    </div>
  );
}

export function HomeScreen({ onScreenChange, onStartWorkflow }: HomeScreenProps) {
  const todayAppointments = getTodayAppointments(appointments);
  const tomorrowAppointments = getTomorrowAppointments(appointments);
  const pickups = getPickupAppointments(appointments);

  const actions: FrontDeskAction[] = [
    {
      label: "Customers",
      subtitle: "Search profiles and start front-desk work",
      icon: UserPlus,
      onClick: () => onScreenChange("customer"),
    },
    {
      label: "Alteration order",
      subtitle: "Start intake and capture services",
      icon: Receipt,
      onClick: () => onStartWorkflow("alteration"),
    },
    {
      label: "Custom garment",
      subtitle: "Open measurements and build flow",
      icon: Ruler,
      onClick: () => onStartWorkflow("custom"),
    },
    {
      label: "Order pickup",
      subtitle: "Prepare checkout and release orders",
      icon: Package,
      onClick: () => onScreenChange("openOrders"),
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-[var(--app-border)]/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] px-4 py-4">
          <SectionHeader icon={PanelLeft} title="Front desk" subtitle="Core actions" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {actions.map((action) => (
              <FrontDeskActionTile key={action.label} {...action} />
            ))}
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="app-text-value">Appointments board</div>
              <div className="app-text-caption mt-1">Today and tomorrow at the front desk.</div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[var(--app-border)]/55 bg-[var(--app-surface)]/28 px-3 py-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
              <span className="app-text-overline">{todayAppointments.length + tomorrowAppointments.length} appointments</span>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <AppointmentLane
              title="Today"
              subtitle="Appointments on deck"
              appointments={todayAppointments}
              actionLabel="Open"
              onAction={() => onScreenChange("customer")}
            />
            <AppointmentLane
              title="Tomorrow"
              subtitle="Prep work and consults"
              appointments={tomorrowAppointments}
              actionLabel="Prep"
              onAction={() => onScreenChange("customer")}
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="app-icon-chip">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <div className="app-section-title">Order pickups</div>
              <div className="app-section-copy">Today and tomorrow</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--app-border)]/55 bg-[var(--app-surface)]/28 px-3 py-1.5">
            <Package className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
            <span className="app-text-overline">{pickups.length} pickups</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {pickups.map((appointment, index) => (
            <div key={appointment.id}>
              <PickupRow appointment={appointment} onOpen={() => onScreenChange("openOrders")} />
              {index < pickups.length - 1 ? <div className="mx-1 mt-3 border-t border-[var(--app-border)]/45" /> : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
