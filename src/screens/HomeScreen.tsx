import {
  CalendarDays,
  CheckSquare2,
  Clock3,
  House,
  MapPin,
  Square,
  Package,
  Receipt,
  Ruler,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import type { Appointment, PickupLocation, Screen, WorkflowMode } from "../types";
import { ActionButton, EmptyState, QuickActionTile, SectionHeader, SelectionChip, Surface, SurfaceHeader } from "../components/ui/primitives";
import { AppointmentIssuePill, CountPill } from "../components/ui/pills";
import { useToast } from "../components/ui/toast";
import { getTodayAppointments, getTomorrowAppointments } from "../features/home/selectors";
import { HomeLaneEmptyState } from "../features/home/components/HomeLaneEmptyState";

type HomeScreenProps = {
  appointments: Appointment[];
  pickupAppointments: Appointment[];
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

const locationOptions: PickupLocation[] = ["Fifth Avenue", "Queens", "Long Island"];

function getAppointmentCallouts(appointment: Appointment) {
  const callouts: Array<{ label: string; tone?: "default" | "warn" }> = [];

  if (appointment.missing !== "Complete") {
    callouts.push({ label: appointment.missing, tone: "warn" });
  }

  return callouts;
}

function getRelativeDayLabel(dateValue: string) {
  const target = new Date(`${dateValue}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (target.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (target.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(target);
}

function HomeEmptyState({
  title,
  detail,
  primaryAction,
  secondaryAction,
}: {
  title: string;
  detail: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}) {
  return (
    <Surface tone="work" className="p-4">
      <EmptyState className="space-y-4 border-dashed border-[var(--app-border-strong)]/80 bg-[var(--app-surface-muted)]/85 px-5 py-5">
        <SurfaceHeader
          icon={CalendarDays}
          iconStyle={{
            borderColor: "#bfdbfe",
            backgroundColor: "#eff6ff",
            color: "#1d4ed8",
          }}
          title={title}
          subtitle={detail}
          titleClassName="app-text-value"
          subtitleClassName="app-text-caption"
        />
        {primaryAction || secondaryAction ? (
          <div className="flex flex-wrap gap-2">
            {primaryAction ? (
              <ActionButton tone="primary" className="min-h-11 px-4 py-2 text-sm" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </ActionButton>
            ) : null}
            {secondaryAction ? (
              <ActionButton tone="secondary" className="min-h-11 px-4 py-2 text-sm" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </ActionButton>
            ) : null}
          </div>
        ) : null}
      </EmptyState>
    </Surface>
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
  const callouts = getAppointmentCallouts(appointment);

  return (
    <div className="grid gap-4 md:grid-cols-[88px_minmax(0,1fr)_176px] md:items-start">
      <div>
        <div className="app-text-value text-[0.95rem]">{appointment.time}</div>
      </div>

      <div className="min-w-0 space-y-2">
        <div className="app-text-value leading-tight">{appointment.customer}</div>
        <div className="space-y-1">
          <div className="app-text-body font-medium leading-tight">{appointment.type}</div>
          <div className="app-text-caption flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{appointment.location}</span>
          </div>
        </div>
        {callouts.length ? (
          <div className="flex flex-wrap items-center gap-2">
            {callouts.map((callout) => (
              <AppointmentIssuePill
                key={callout.label}
                tone={callout.tone === "warn" ? "warn" : "default"}
                label={callout.label}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-2 md:justify-items-stretch">
        <ActionButton tone="primary" className="min-h-11 px-4 py-2 text-sm" onClick={() => onCreateOrder(appointment)}>
          Create order
        </ActionButton>
        <ActionButton tone="secondary" className="min-h-11 px-4 py-2 text-sm" onClick={() => onCancelAppointment(appointment)}>
          Cancel
        </ActionButton>
      </div>
    </div>
  );
}

function AppointmentLane({
  title,
  dateLabel,
  appointments,
  activeLocationLabel,
  onCreateOrder,
  onCancelAppointment,
}: {
  title: string;
  dateLabel: string;
  appointments: Appointment[];
  activeLocationLabel?: string;
  onCreateOrder: (appointment: Appointment) => void;
  onCancelAppointment: (appointment: Appointment) => void;
}) {
  return (
    <div className="app-table-shell">
      <div className="app-table-head px-4 py-3.5">
        <SurfaceHeader
          title={title}
          subtitle={dateLabel}
          meta={<CountPill count={appointments.length} label="scheduled" icon={Clock3} />}
          titleClassName="app-text-value"
          subtitleClassName="app-text-caption"
        />
      </div>
      <div>
        {appointments.length ? (
          appointments.map((appointment) => (
            <div key={appointment.id} className="app-table-row border-t border-[var(--app-border)]/55 px-4 py-4">
              <ScheduleRow
                appointment={appointment}
                onCreateOrder={onCreateOrder}
                onCancelAppointment={onCancelAppointment}
              />
            </div>
          ))
        ) : (
          <HomeLaneEmptyState
            kind="appointment"
            dayLabel={title}
            dateLabel={dateLabel}
            activeLocationLabel={activeLocationLabel}
          />
        )}
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
        <div className="app-text-caption mt-1">{getRelativeDayLabel(appointment.date)}</div>
      </div>
      <div className="min-w-0">
        <div className="app-text-value">{appointment.customer}</div>
        <div className="app-text-caption mt-1">
          {appointment.pickupSummary ?? appointment.type}
          {" • "}
          {appointment.location}
        </div>
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
  activeLocationLabel,
  onCheckout,
  onEditPickup,
}: {
  title: string;
  dateLabel: string;
  appointments: Appointment[];
  activeLocationLabel?: string;
  onCheckout: (appointment: Appointment) => void;
  onEditPickup: (appointment: Appointment) => void;
}) {
  return (
    <div className="app-table-shell">
      <div className="app-table-head px-4 py-3.5">
        <SurfaceHeader
          title={title}
          subtitle={dateLabel}
          meta={<CountPill count={appointments.length} label="scheduled" icon={Clock3} />}
          titleClassName="app-text-value"
          subtitleClassName="app-text-caption"
        />
      </div>
      <div>
        {appointments.length ? (
          appointments.map((appointment) => (
            <div key={appointment.id} className="app-table-row border-t border-[var(--app-border)]/55 px-4 py-4">
              <PickupRow
                appointment={appointment}
                onCheckout={() => onCheckout(appointment)}
                onEditPickup={() => onEditPickup(appointment)}
              />
            </div>
          ))
        ) : (
          <HomeLaneEmptyState
            kind="pickup"
            dayLabel={title}
            dateLabel={dateLabel}
            activeLocationLabel={activeLocationLabel}
          />
        )}
      </div>
    </div>
  );
}

export function HomeScreen({ appointments, pickupAppointments, onScreenChange, onStartWorkflow, onOpenAppointment }: HomeScreenProps) {
  const { showToast } = useToast();
  const [activeLocations, setActiveLocations] = useState<PickupLocation[]>(locationOptions);
  const filteredAppointments = appointments.filter((appointment) => activeLocations.includes(appointment.location));
  const todayAppointments = getTodayAppointments(filteredAppointments);
  const tomorrowAppointments = getTomorrowAppointments(filteredAppointments);
  const pickups = pickupAppointments.filter((appointment) => activeLocations.includes(appointment.location));
  const now = new Date();
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const todayLabel = dateFormatter.format(now);
  const tomorrowLabel = dateFormatter.format(tomorrowDate);
  const todayKey = now.toISOString().slice(0, 10);
  const tomorrowKey = tomorrowDate.toISOString().slice(0, 10);
  const todayPickups = pickups.filter((appointment) => appointment.date === todayKey);
  const tomorrowPickups = pickups.filter((appointment) => appointment.date === tomorrowKey);
  const allLocationsActive = activeLocations.length === locationOptions.length;
  const visibleAppointmentCount = todayAppointments.length + tomorrowAppointments.length;
  const visiblePickupCount = todayPickups.length + tomorrowPickups.length;
  const hasVisibleHomeWork = visibleAppointmentCount > 0 || visiblePickupCount > 0;
  const hasAnyLocationSelected = activeLocations.length > 0;
  const hasFilteredLaterWork = filteredAppointments.length > visibleAppointmentCount || pickups.length > visiblePickupCount;
  const singleActiveLocationLabel = activeLocations.length === 1 ? activeLocations[0] : undefined;

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
      <SectionHeader icon={House} title="Home" subtitle="Front-of-house operations" />

      <Surface tone="control" className="px-4 py-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {actions.map((action) => (
            <QuickActionTile
              key={action.label}
              title={action.label}
              subtitle={action.subtitle}
              icon={action.icon}
              iconStyle={action.iconStyle}
              onClick={action.onClick}
            />
          ))}
        </div>
      </Surface>

      <div className="px-1 py-1">
        <div className="flex flex-wrap items-center gap-4">
          <div className="shrink-0 pt-0.5">
            <div className="app-text-overline">View locations</div>
            <div className="app-text-caption mt-1">Filter appointments and pickups.</div>
          </div>
          <div className="flex min-w-[15rem] flex-1 flex-wrap gap-1.5">
            <SelectionChip
              selected={allLocationsActive}
              onClick={() => setActiveLocations(allLocationsActive ? [] : locationOptions)}
              leading={allLocationsActive ? <CheckSquare2 className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              size="sm"
            >
              All locations
            </SelectionChip>
            {locationOptions.map((location) => {
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
                >
                  {location}
                </SelectionChip>
              );
            })}
          </div>
        </div>
      </div>

      {hasVisibleHomeWork ? (
        <>
          <Surface tone="work" className="p-4">
            <SurfaceHeader
              icon={CalendarDays}
              iconStyle={{
                borderColor: "#bae6fd",
                backgroundColor: "#f0f9ff",
                color: "#0369a1",
              }}
              title="Appointments"
              subtitle="Today and tomorrow"
              meta={<CountPill count={visibleAppointmentCount} label="appointments" icon={CalendarDays} tone="info" />}
            />

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <AppointmentLane
                title="Today"
                dateLabel={todayLabel}
                appointments={todayAppointments}
                activeLocationLabel={singleActiveLocationLabel}
                onCreateOrder={onOpenAppointment}
                onCancelAppointment={(appointment) => showToast(`Cancellation queued for ${appointment.customer}.`)}
              />
              <AppointmentLane
                title="Tomorrow"
                dateLabel={tomorrowLabel}
                appointments={tomorrowAppointments}
                activeLocationLabel={singleActiveLocationLabel}
                onCreateOrder={onOpenAppointment}
                onCancelAppointment={(appointment) => showToast(`Cancellation queued for ${appointment.customer}.`)}
              />
            </div>
          </Surface>

          <Surface tone="work" className="p-4">
            <SurfaceHeader
              icon={Package}
              iconStyle={{
                borderColor: "#a7f3d0",
                backgroundColor: "#ecfdf5",
                color: "#047857",
              }}
              title="Pickups"
              subtitle="Today and tomorrow"
              meta={<CountPill count={visiblePickupCount} label="pickups" icon={Package} tone="success" />}
            />

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <PickupLane
                title="Today"
                dateLabel={todayLabel}
                appointments={todayPickups}
                activeLocationLabel={singleActiveLocationLabel}
                onCheckout={() => onScreenChange("checkout")}
                onEditPickup={() => onScreenChange("openOrders")}
              />
              <PickupLane
                title="Tomorrow"
                dateLabel={tomorrowLabel}
                appointments={tomorrowPickups}
                activeLocationLabel={singleActiveLocationLabel}
                onCheckout={() => onScreenChange("checkout")}
                onEditPickup={() => onScreenChange("openOrders")}
              />
            </div>
          </Surface>
        </>
      ) : !hasAnyLocationSelected ? (
        <HomeEmptyState
          title="No locations selected"
          detail="Choose at least one location to bring appointments and pickups back into view."
          primaryAction={{ label: "Show all locations", onClick: () => setActiveLocations(locationOptions) }}
        />
      ) : hasFilteredLaterWork ? (
        <HomeEmptyState
          title="Nothing scheduled for today or tomorrow"
          detail="Later appointments and pickups are still in the system. Open the full schedule or order registry to work ahead."
          primaryAction={{ label: "Open appointments", onClick: () => onScreenChange("appointments") }}
          secondaryAction={{ label: "Open order registry", onClick: () => onScreenChange("openOrders") }}
        />
      ) : (
        <HomeEmptyState
          title="No front-desk work is queued"
          detail="New fittings, consults, and pickups will appear here once they are scheduled."
          primaryAction={{ label: "Open customers", onClick: () => onScreenChange("customer") }}
          secondaryAction={{ label: "Start alteration order", onClick: () => onStartWorkflow("alteration") }}
        />
      )}
    </div>
  );
}
