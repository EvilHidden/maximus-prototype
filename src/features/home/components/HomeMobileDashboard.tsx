import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, CheckSquare2, MapPin, Package, Square } from "lucide-react";
import type { Appointment, PickupLocation } from "../../../types";
import {
  ActionButton,
  QuickActionTile,
  SelectionChip,
  Surface,
  SurfaceHeader,
} from "../../../components/ui/primitives";
import { AppointmentIssuePill, CountPill } from "../../../components/ui/pills";
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
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "info" | "success";
}) {
  return (
    <div className="min-w-0 rounded-[var(--app-radius-md)] border border-[var(--app-border)]/65 bg-[var(--app-surface-muted)]/55 px-3 py-2.5">
      <div className="app-text-overline text-[var(--app-text-soft)]">{label}</div>
      <div className="app-text-value mt-1 truncate text-[1rem]">{value}</div>
    </div>
  );
}

function MobileSection({
  title,
  subtitle,
  count,
  countLabel,
  icon,
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
    <Surface tone="work" className="px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <SurfaceHeader
          icon={icon}
          title={title}
          subtitle={subtitle}
          titleClassName="app-text-value"
          subtitleClassName="app-text-caption"
        />
        <div className="shrink-0 pt-0.5">
          <CountPill count={count} label={countLabel} icon={icon} tone={tone} className="px-2.5 py-1" />
        </div>
      </div>
      <div className="mt-3 space-y-2.5">{children}</div>
      {action ? <div className="mt-3">{action}</div> : null}
    </Surface>
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
    <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 bg-[var(--app-surface)] px-3.5 py-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-[var(--app-radius-sm)] border border-[var(--app-border)]/65 bg-[var(--app-surface-muted)]/5 px-2.5 py-2 text-center">
          <div className="app-text-overline text-[var(--app-text-soft)]">Time</div>
          <div className="app-text-value mt-1 whitespace-nowrap text-[0.92rem] leading-none">{getAppointmentTimeLabel(appointment)}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="app-text-strong truncate">{appointment.customer}</div>
              <div className="app-text-body mt-1 leading-tight">{appointment.type}</div>
            </div>
            <AppointmentIssuePill
              tone={appointment.contextFlags.includes("unconfirmed") ? "warn" : "success"}
              label={getAppointmentAttentionLabel(appointment)}
            />
          </div>
          <div className="app-text-caption mt-2 inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{appointment.location}</span>
          </div>
          <div className="mt-3">
            <ActionButton tone="primary" className="min-h-10 w-full px-3.5 py-2 text-sm" onClick={() => onCreateOrder(appointment)}>
              Start order
            </ActionButton>
          </div>
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

  return (
    <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 bg-[var(--app-surface)] px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <div className="app-text-strong">{pickup.payerName}</div>
            <div className="app-text-caption">Order {pickup.openOrderId}</div>
          </div>
          <div className="app-text-body mt-1 leading-tight">{summary || pickup.pickupSchedule.label}</div>
          <div className="app-text-caption mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{pickup.pickupSchedule.pickupLocation || "Location pending"}</span>
            </span>
            <span>{needsPayment ? `Balance ${formatCurrency(pickup.pickupBalanceDue)}` : "Prepaid"}</span>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <ActionButton
          tone="primary"
          className="min-h-10 w-full px-3.5 py-2 text-sm"
          onClick={() => (needsPayment ? onCheckoutPickup(pickup.openOrderId) : onCompletePickup(pickup.openOrderId))}
        >
          {needsPayment ? "Take payment" : "Complete pickup"}
        </ActionButton>
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
    <div className="space-y-4 md:hidden">
      <Surface tone="work" className="px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="app-text-overline text-[var(--app-text-soft)]">Today at a glance</div>
            <div className="app-text-value mt-1 text-[1.2rem]">Home</div>
            <div className="app-text-caption mt-1">Run the day from one operator feed.</div>
          </div>
          <CountPill count={visibleAppointmentCount + visiblePickupCount} label="items" icon={CalendarDays} tone="info" className="px-2.5 py-1" />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <MobileMetric label="Today" value={String(todayAppointments.length)} tone="info" />
          <MobileMetric label="Tomorrow" value={String(tomorrowAppointments.length)} tone="default" />
          <MobileMetric label="Ready" value={String(readyPickups.length)} tone="success" />
        </div>
      </Surface>

      <div className="grid grid-cols-2 gap-2.5">
        {mobileQuickActions.map((action) => (
          <QuickActionTile
            key={action.label}
            title={action.label}
            subtitle={action.subtitle}
            icon={action.icon}
            iconStyle={action.iconStyle}
            onClick={action.onClick}
            size="compact"
            className="min-h-[88px] min-w-0 px-3 py-3"
          />
        ))}
      </div>

      <div className="space-y-2">
        <div className="app-text-overline px-1 text-[var(--app-text-soft)]">Locations</div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 app-no-scrollbar">
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
        <>
          <MobileSection
            title="Today"
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
              <div className="app-text-caption rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 px-3.5 py-3 text-[var(--app-text-soft)]">
                No appointments booked for today.
              </div>
            )}
          </MobileSection>

          <MobileSection
            title="Tomorrow"
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
              <div className="app-text-caption rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 px-3.5 py-3 text-[var(--app-text-soft)]">
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
              <div className="app-text-caption rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 px-3.5 py-3 text-[var(--app-text-soft)]">
                Nothing ready for pickup right now.
              </div>
            )}
          </MobileSection>
        </>
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
          detail="Use the shortcuts below to start a new job or pull up a customer."
          primaryAction={{ label: "Open customers", onClick: () => onScreenChange("customer") }}
          secondaryAction={{ label: "Start alteration order", onClick: () => onStartWorkflow("alteration") }}
        />
      )}
    </div>
  );
}
