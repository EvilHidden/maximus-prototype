import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, CheckSquare2, MapPin, Package, Square } from "lucide-react";
import type { Appointment, PickupLocation } from "../../../types";
import {
  ActionButton,
  SelectionChip,
} from "../../../components/ui/primitives";
import { AppointmentIssuePill } from "../../../components/ui/pills";
import {
  getAppointmentAttentionLabel,
  getAppointmentTimeLabel,
} from "../../appointments/selectors";
import type { ReadyPickupQueueItem } from "../selectors";
import { HomeEmptyState } from "./HomeScheduleBoards";

type HomeMobileAction = {
  label: string;
  subtitle: string;
  icon: LucideIcon;
  iconStyle: CSSProperties;
  onClick: () => void;
};

type HomeMobileDashboardProps = {
  actions: HomeMobileAction[];
  pickupLocations: PickupLocation[];
  activeLocations: PickupLocation[];
  setActiveLocations: Dispatch<SetStateAction<PickupLocation[]>>;
  allLocationsActive: boolean;
  todayAppointments: Appointment[];
  tomorrowAppointments: Appointment[];
  readyPickups: ReadyPickupQueueItem[];
  todayLabel: string;
  tomorrowLabel: string;
  visibleAppointmentCount: number;
  visiblePickupCount: number;
  hasVisibleHomeWork: boolean;
  hasAnyLocationSelected: boolean;
  hasFilteredLaterWork: boolean;
  onScreenChange: (screen: "customer" | "openOrders" | "appointments") => void;
  onStartWorkflow: (workflow: "alteration" | "custom") => void;
  onCreateOrder: (appointment: Appointment) => void;
  onCheckoutPickup: (openOrderId: number) => void;
  onCompletePickup: (openOrderId: number) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function MobileMetric({
  label,
  detail,
  value,
  tone = "default",
}: {
  label: string;
  detail: string;
  value: string;
  tone?: "default" | "info" | "success";
}) {
  const valueToneClassName =
    tone === "success"
      ? "text-[var(--app-success-text)]"
      : tone === "info"
        ? "text-[var(--app-text)]"
        : "text-[var(--app-text)]";

  return (
    <div className="min-w-0 px-1 text-center">
      <div className="app-text-overline text-[var(--app-text-soft)]/88">{label}</div>
      <div className={`app-text-value mt-1 text-[0.98rem] ${valueToneClassName}`}>{value}</div>
      <div className="app-text-caption mt-1 text-[var(--app-text-soft)]/76">{detail}</div>
    </div>
  );
}

function MobileShortcutButton({
  title,
  icon: Icon,
  iconStyle,
  onClick,
}: {
  title: string;
  icon: LucideIcon;
  iconStyle?: CSSProperties;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[var(--app-radius-md)] border border-[var(--app-border)]/32 bg-transparent px-3 text-left transition hover:border-[var(--app-border-strong)]/55 hover:bg-[var(--app-surface-muted)]/12"
    >
      <span
        className="app-icon-chip h-6.5 w-6.5 shrink-0 border-[var(--app-border)]/40 bg-[var(--app-surface-muted)]/8 [&_svg]:h-3.5 [&_svg]:w-3.5"
        style={iconStyle}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="app-text-body text-[0.76rem] font-medium text-[var(--app-text)]">{title}</span>
    </button>
  );
}

function MobileSection({
  title,
  subtitle,
  count,
  countLabel,
  icon: Icon,
  tone,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  count: number;
  countLabel: string;
  icon: LucideIcon;
  tone: "info" | "success";
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-[var(--app-border)]/34 pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--app-text-soft)]" />
          <div>
            <div className="app-text-value">{title}</div>
            <div className="mt-1 app-text-caption">{subtitle}</div>
          </div>
        </div>
        <div className="app-text-overline shrink-0 pt-1 text-[var(--app-text-soft)]">
          {count} {countLabel}
        </div>
      </div>
      <div className="mt-5 space-y-0">{children}</div>
      {action ? <div className="mt-5.5">{action}</div> : null}
    </section>
  );
}

function MobileAppointmentRow({
  appointment,
  onCreateOrder,
}: {
  appointment: Appointment;
  onCreateOrder: (appointment: Appointment) => void;
}) {
  return (
    <div className="border-b border-[var(--app-border)]/24 py-5 last:border-b-0 last:pb-0 first:pt-0">
      <div className="grid grid-cols-[68px_minmax(0,1fr)_auto] gap-x-5 gap-y-3">
        <div className="app-text-value whitespace-nowrap pt-0.5 text-[0.79rem] leading-none text-[var(--app-text-muted)]">{getAppointmentTimeLabel(appointment)}</div>
        <div className="min-w-0">
          <div className="min-w-0 space-y-1">
            <div className="app-text-strong truncate">{appointment.customer}</div>
            <div className="app-text-body text-[0.8rem] leading-tight text-[var(--app-text-muted)]">{appointment.type}</div>
          </div>
          <div className="app-text-caption mt-3 inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{appointment.location}</span>
          </div>
        </div>
        <div className="flex min-w-[84px] flex-col items-end gap-3.5 pt-0.5">
          <AppointmentIssuePill
            tone={appointment.contextFlags.includes("unconfirmed") ? "warn" : "success"}
            label={getAppointmentAttentionLabel(appointment)}
          />
          <ActionButton
            tone="quiet"
            className="min-h-0 rounded-[10px] border-[var(--app-border)]/24 px-2.25 py-1 text-[0.66rem] font-medium text-[var(--app-text-soft)] hover:text-[var(--app-text)]"
            onClick={() => onCreateOrder(appointment)}
          >
            Start order
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function MobilePickupRow({
  pickup,
  onCheckoutPickup,
  onCompletePickup,
}: {
  pickup: ReadyPickupQueueItem;
  onCheckoutPickup: (openOrderId: number) => void;
  onCompletePickup: (openOrderId: number) => void;
}) {
  const needsPayment = pickup.pickupBalanceDue > 0;
  const summary = pickup.itemSummary.filter(Boolean).join(" · ");
  const pickupLocation = pickup.pickupSchedule.pickupLocation || "Location pending";
  const secondaryMeta = needsPayment ? `Balance ${formatCurrency(pickup.pickupBalanceDue)}` : pickupLocation;

  return (
    <div className="border-b border-[var(--app-border)]/24 py-4.5 last:border-b-0 last:pb-0 first:pt-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3.5">
        <div className="min-w-0 flex-1">
          <div className="app-text-strong truncate">{pickup.payerName}</div>
          <div className="app-text-body mt-1 truncate text-[0.8rem] leading-tight text-[var(--app-text-muted)]">
            {summary || pickup.pickupSchedule.label}
          </div>
          <div className="app-text-caption mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {!needsPayment ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{pickupLocation}</span>
              </span>
            ) : null}
            <span>{secondaryMeta}</span>
          </div>
        </div>
        <div className="pt-0.5">
          <ActionButton
            tone="secondary"
            className="min-h-7 rounded-[10px] px-2.5 py-1 text-[0.7rem]"
            onClick={() => (needsPayment ? onCheckoutPickup(pickup.openOrderId) : onCompletePickup(pickup.openOrderId))}
          >
            {needsPayment ? "Take payment" : "Complete"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

export function HomeMobileDashboard({
  actions,
  pickupLocations,
  activeLocations,
  setActiveLocations,
  allLocationsActive,
  todayAppointments,
  tomorrowAppointments,
  readyPickups,
  todayLabel,
  tomorrowLabel,
  visibleAppointmentCount,
  visiblePickupCount,
  hasVisibleHomeWork,
  hasAnyLocationSelected,
  hasFilteredLaterWork,
  onScreenChange,
  onStartWorkflow,
  onCreateOrder,
  onCheckoutPickup,
  onCompletePickup,
}: HomeMobileDashboardProps) {
  const mobileQuickActions = actions.slice(0, 4);
  const mobileTodayAppointments = todayAppointments.slice(0, 3);
  const mobileTomorrowAppointments = tomorrowAppointments.slice(0, 2);
  const mobilePickups = readyPickups.slice(0, 2);
  return (
    <div className="space-y-6.5 md:hidden">
      <div className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="app-text-overline text-[var(--app-text-soft)]/58">Today overview</div>
            <div className="app-text-strong mt-1 text-[1rem]">Home</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-0 rounded-[var(--app-radius-md)] border border-[var(--app-border)]/24 bg-[var(--app-surface-muted)]/8 py-3">
          <div className="border-r border-[var(--app-border)]/24">
            <MobileMetric label="Today" detail="appointments" value={String(todayAppointments.length)} tone="info" />
          </div>
          <div className="border-r border-[var(--app-border)]/24">
            <MobileMetric label="Tomorrow" detail="appointments" value={String(tomorrowAppointments.length)} tone="default" />
          </div>
          <MobileMetric label="Ready" detail="pickups" value={String(readyPickups.length)} tone="success" />
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="app-text-overline px-1 text-[var(--app-text-soft)]/62">Filter locations</div>
        <div className="flex gap-2.5 overflow-x-auto pb-1 app-no-scrollbar">
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
        </div>
      </div>

      {hasVisibleHomeWork ? (
        <div className="space-y-6">
          <MobileSection
            title="Today’s appointments"
            subtitle={todayLabel}
            count={todayAppointments.length}
            countLabel="booked"
            icon={CalendarDays}
            tone="info"
            action={todayAppointments.length > mobileTodayAppointments.length ? (
              <ActionButton tone="quiet" className="min-h-10 w-full px-3.5 py-2 text-sm" onClick={() => onScreenChange("appointments")}>
                Open full calendar
              </ActionButton>
            ) : undefined}
          >
            {mobileTodayAppointments.length ? (
              mobileTodayAppointments.map((appointment) => (
                <MobileAppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  onCreateOrder={onCreateOrder}
                />
              ))
            ) : (
              <div className="app-text-caption border-b border-[var(--app-border)]/45 py-3 text-[var(--app-text-soft)]">
                No appointments booked for today.
              </div>
            )}
          </MobileSection>

          <MobileSection
            title="Tomorrow’s appointments"
            subtitle={tomorrowLabel}
            count={tomorrowAppointments.length}
            countLabel="booked"
            icon={CalendarDays}
            tone="info"
            action={tomorrowAppointments.length > mobileTomorrowAppointments.length ? (
              <ActionButton tone="quiet" className="min-h-10 w-full px-3.5 py-2 text-sm" onClick={() => onScreenChange("appointments")}>
                See all tomorrow
              </ActionButton>
            ) : undefined}
          >
            {mobileTomorrowAppointments.length ? (
              mobileTomorrowAppointments.map((appointment) => (
                <MobileAppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  onCreateOrder={onCreateOrder}
                />
              ))
            ) : (
              <div className="app-text-caption border-b border-[var(--app-border)]/45 py-3 text-[var(--app-text-soft)]">
                Nothing queued for tomorrow.
              </div>
            )}
          </MobileSection>

          <MobileSection
            title="Ready for pickup"
            subtitle="Orders ready to hand off now"
            count={visiblePickupCount}
            countLabel="pickups"
            icon={Package}
            tone="success"
            action={readyPickups.length > mobilePickups.length ? (
              <ActionButton tone="quiet" className="min-h-10 w-full px-3.5 py-2 text-sm" onClick={() => onScreenChange("openOrders")}>
                Open active orders
              </ActionButton>
            ) : undefined}
          >
            {mobilePickups.length ? (
              mobilePickups.map((pickup) => (
                <MobilePickupRow
                  key={pickup.key}
                  pickup={pickup}
                  onCheckoutPickup={onCheckoutPickup}
                  onCompletePickup={onCompletePickup}
                />
              ))
            ) : (
              <div className="app-text-caption border-b border-[var(--app-border)]/45 py-3 text-[var(--app-text-soft)]">
                Nothing ready for pickup right now.
              </div>
            )}
          </MobileSection>
        </div>
      ) : !hasAnyLocationSelected ? (
        <HomeEmptyState
          title="No locations selected"
          detail="Choose at least one location to bring appointments and pickups back into view."
          primaryAction={{ label: "Show all locations", onClick: () => setActiveLocations(pickupLocations) }}
        />
      ) : hasFilteredLaterWork ? (
        <HomeEmptyState
          title="Nothing scheduled right now"
          detail="Later appointments are still on the books. Open the calendar or active orders to work ahead."
          primaryAction={{ label: "Open appointments", onClick: () => onScreenChange("appointments") }}
          secondaryAction={{ label: "Open all active orders", onClick: () => onScreenChange("openOrders") }}
        />
      ) : (
        <HomeEmptyState
          title="Nothing needs attention"
          detail="Use the quick starts below to begin a job or pull up a customer."
          primaryAction={{ label: "Open customers", onClick: () => onScreenChange("customer") }}
          secondaryAction={{ label: "Start alteration order", onClick: () => onStartWorkflow("alteration") }}
        />
      )}

      <div className="space-y-2.5 border-t border-[var(--app-border)]/22 pt-5">
        <div className="app-text-overline px-1 text-[var(--app-text-soft)]/58">Quick starts</div>
        <div className="flex gap-3 overflow-x-auto pb-1.5 app-no-scrollbar">
          {mobileQuickActions.map((action) => (
            <MobileShortcutButton
              key={action.label}
              title={action.label}
              icon={action.icon}
              iconStyle={action.iconStyle}
              onClick={action.onClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
