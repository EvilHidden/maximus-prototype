import {
  CalendarDays,
  Clock3,
  Package,
  Receipt,
  Ruler,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { appointments } from "../data";
import type { Appointment, Screen, WorkflowMode } from "../types";
import { ActionButton, Card, StatusPill, cx } from "../components/ui/primitives";
import { getPickupAppointments, getTodayAppointments, getTomorrowAppointments } from "../features/home/selectors";

type HomeScreenProps = {
  onScreenChange: (screen: Screen) => void;
  onStartWorkflow: (workflow: WorkflowMode) => void;
  onOpenAppointment: (appointment: Appointment) => void;
};

type FrontDeskAction = {
  label: string;
  subtitle: string;
  icon: typeof UserPlus;
  iconStyle: {
    borderColor: string;
    backgroundColor: string;
    color: string;
  };
  onClick: () => void;
};

function getAppointmentCallouts(appointment: Appointment) {
  const callouts: Array<{ label: string; tone?: "default" | "warn" }> = [];

  if (appointment.missing !== "Complete") {
    callouts.push({ label: appointment.missing, tone: "warn" });
  }

  return callouts;
}

function FrontDeskActionTile({
  label,
  subtitle,
  icon: Icon,
  iconStyle,
  onClick,
}: FrontDeskAction) {
  return (
    <button
      onClick={onClick}
      className="group flex min-h-[112px] flex-col justify-between rounded-[var(--app-radius-md)] border border-[var(--app-border)]/55 bg-[var(--app-surface)]/18 px-4 py-4 text-left transition hover:bg-[var(--app-surface)]/34"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="app-icon-chip transition group-hover:border-[var(--app-border-strong)]" style={iconStyle}>
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
  onCreateOrder,
  onCancelAppointment,
}: {
  appointment: Appointment;
  onCreateOrder: (appointment: Appointment) => void;
  onCancelAppointment: (appointment: Appointment) => void;
}) {
  return (
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
        <div className="flex shrink-0 items-center gap-2 pl-3">
          <ActionButton tone="secondary" className="min-h-12 px-4 py-2.5 text-sm" onClick={() => onCancelAppointment(appointment)}>
            Cancel Appointment
          </ActionButton>
          <ActionButton tone="primary" className="min-h-12 px-4 py-2.5 text-sm" onClick={() => onCreateOrder(appointment)}>
            Create Order
          </ActionButton>
        </div>
      </div>
  );
}

function AppointmentLane({
  title,
  dateLabel,
  appointments,
  onCreateOrder,
  onCancelAppointment,
}: {
  title: string;
  dateLabel: string;
  appointments: Appointment[];
  onCreateOrder: (appointment: Appointment) => void;
  onCancelAppointment: (appointment: Appointment) => void;
}) {
  return (
    <div className="rounded-[var(--app-radius-md)] bg-[var(--app-surface)]/18 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="app-text-value">{title}</div>
            <div className="app-text-caption">{dateLabel}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[var(--app-border)]/55 bg-[var(--app-surface)]/26 px-3 py-1.5">
          <Clock3 className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
          <span className="app-text-overline text-[var(--app-text-muted)]">{appointments.length} scheduled</span>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/34 px-4 py-4"
          >
            <ScheduleRow
              appointment={appointment}
              onCreateOrder={onCreateOrder}
              onCancelAppointment={onCancelAppointment}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PickupRow({
  appointment,
  onCheckout,
  onEditPickup,
}: {
  appointment: Appointment;
  onCheckout: () => void;
  onEditPickup: () => void;
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
      </div>
      <div className="flex items-center gap-2">
        <ActionButton tone="secondary" className="min-h-12 px-4 py-2.5 text-sm" onClick={onEditPickup}>
          Edit pickup
        </ActionButton>
        <ActionButton tone="primary" className="min-h-12 px-4 py-2.5 text-sm" onClick={onCheckout}>
          Checkout
        </ActionButton>
      </div>
    </div>
  );
}

function PickupLane({
  title,
  dateLabel,
  appointments,
  onCheckout,
  onEditPickup,
}: {
  title: string;
  dateLabel: string;
  appointments: Appointment[];
  onCheckout: (appointment: Appointment) => void;
  onEditPickup: (appointment: Appointment) => void;
}) {
  return (
    <div className="rounded-[var(--app-radius-md)] bg-[var(--app-surface)]/18 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="app-text-value">{title}</div>
          <div className="app-text-caption">{dateLabel}</div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[var(--app-border)]/55 bg-[var(--app-surface)]/26 px-3 py-1.5">
          <Clock3 className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
          <span className="app-text-overline text-[var(--app-text-muted)]">{appointments.length} scheduled</span>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {appointments.map((appointment) => (
          <PickupRow
            key={appointment.id}
            appointment={appointment}
            onCheckout={() => onCheckout(appointment)}
            onEditPickup={() => onEditPickup(appointment)}
          />
        ))}
      </div>
    </div>
  );
}

export function HomeScreen({ onScreenChange, onStartWorkflow, onOpenAppointment }: HomeScreenProps) {
  const [actionToast, setActionToast] = useState<string | null>(null);
  const todayAppointments = getTodayAppointments(appointments);
  const tomorrowAppointments = getTomorrowAppointments(appointments);
  const pickups = getPickupAppointments(appointments);
  const todayPickups = pickups.filter((appointment) => appointment.day === "today");
  const tomorrowPickups = pickups.filter((appointment) => appointment.day === "tomorrow");
  const now = new Date();
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const todayLabel = dateFormatter.format(now);
  const tomorrowLabel = dateFormatter.format(tomorrowDate);

  useEffect(() => {
    if (!actionToast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setActionToast(null), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [actionToast]);

  const actions: FrontDeskAction[] = [
    {
      label: "Customers",
      subtitle: "Search profiles and start front-desk work",
      icon: UserPlus,
      iconStyle: {
        borderColor: "#d8b4fe",
        backgroundColor: "#faf5ff",
        color: "#7e22ce",
      },
      onClick: () => onScreenChange("customer"),
    },
    {
      label: "Alteration order",
      subtitle: "Start intake and capture services",
      icon: Receipt,
      iconStyle: {
        borderColor: "#fdba74",
        backgroundColor: "#fff7ed",
        color: "#c2410c",
      },
      onClick: () => onStartWorkflow("alteration"),
    },
    {
      label: "Custom garment",
      subtitle: "Open measurements and build flow",
      icon: Ruler,
      iconStyle: {
        borderColor: "#93c5fd",
        backgroundColor: "#eff6ff",
        color: "#1d4ed8",
      },
      onClick: () => onStartWorkflow("custom"),
    },
    {
      label: "Order pickup",
      subtitle: "Prepare checkout and release orders",
      icon: Package,
      iconStyle: {
        borderColor: "#86efac",
        backgroundColor: "#f0fdf4",
        color: "#15803d",
      },
      onClick: () => onScreenChange("openOrders"),
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0">
        <div className="bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] px-4 py-4">
          <div className="mb-4">
            <div className="app-section-title">Maximus Custom Clothing</div>
            <div className="app-section-copy">Front-of-house actions</div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {actions.map((action) => (
              <FrontDeskActionTile key={action.label} {...action} />
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="app-icon-chip"
              style={{
                borderColor: "#bae6fd",
                backgroundColor: "#f0f9ff",
                color: "#0369a1",
              }}
            >
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <div className="app-section-title">Appointments</div>
              <div className="app-section-copy">Today and tomorrow</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sky-700">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-sky-700">
              {todayAppointments.length + tomorrowAppointments.length} appointments
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <AppointmentLane
            title="Today"
            dateLabel={todayLabel}
            appointments={todayAppointments}
            onCreateOrder={onOpenAppointment}
            onCancelAppointment={(appointment) => setActionToast(`Cancellation queued for ${appointment.customer}.`)}
          />
          <AppointmentLane
            title="Tomorrow"
            dateLabel={tomorrowLabel}
            appointments={tomorrowAppointments}
            onCreateOrder={onOpenAppointment}
            onCancelAppointment={(appointment) => setActionToast(`Cancellation queued for ${appointment.customer}.`)}
          />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="app-icon-chip"
              style={{
                borderColor: "#a7f3d0",
                backgroundColor: "#ecfdf5",
                color: "#047857",
              }}
            >
              <Package className="h-4 w-4" />
            </div>
            <div>
              <div className="app-section-title">Pickups</div>
              <div className="app-section-copy">Today and tomorrow</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
            <Package className="h-3.5 w-3.5" />
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-emerald-700">
              {pickups.length} pickups
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <PickupLane
            title="Today"
            dateLabel={todayLabel}
            appointments={todayPickups}
            onCheckout={() => onScreenChange("checkout")}
            onEditPickup={() => onScreenChange("openOrders")}
          />
          <PickupLane
            title="Tomorrow"
            dateLabel={tomorrowLabel}
            appointments={tomorrowPickups}
            onCheckout={() => onScreenChange("checkout")}
            onEditPickup={() => onScreenChange("openOrders")}
          />
        </div>
      </Card>

      {actionToast ? (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-40 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2">
          <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border-strong)] bg-[var(--app-accent)] px-4 py-3 text-sm font-medium text-[var(--app-accent-contrast)] shadow-[var(--app-shadow-lg)]">
            {actionToast}
          </div>
        </div>
      ) : null}
    </div>
  );
}
