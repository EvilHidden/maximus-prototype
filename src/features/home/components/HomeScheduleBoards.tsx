import { BadgeDollarSign, CalendarClock, CalendarDays, ChevronDown, Mail, MapPin, Megaphone, Package, Phone, Ruler, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { Appointment } from "../../../types";
import {
  ActionButton,
  cx,
  EmptyState,
  Surface,
  SurfaceHeader,
} from "../../../components/ui/primitives";
import { AppointmentIssuePill, CountPill } from "../../../components/ui/pills";
import {
  getAppointmentContextFlagLabel,
  getAppointmentPrepFlagLabel,
  getAppointmentProfileFlagLabel,
  getAppointmentTimeLabel,
} from "../../appointments/selectors";
import type { ReadyPickupQueueItem } from "../selectors";
import { getOpenOrderTypeLabel } from "../../order/selectors";
import { formatDateLabel } from "../../order/orderDateUtils";
import { HomeLaneEmptyState } from "./HomeLaneEmptyState";

function getAppointmentConfirmationPills(appointment: Appointment) {
  return appointment.contextFlags
    .filter((flag) => flag === "confirmed" || flag === "unconfirmed")
    .map((flag) => ({
      label: getAppointmentContextFlagLabel(flag),
      tone: flag === "unconfirmed" ? ("warn" as const) : ("success" as const),
    }));
}

function getAppointmentAlertIcons(appointment: Appointment) {
  const icons: Array<{
    key: string;
    label: string;
    Icon: LucideIcon;
    tone?: "info" | "muted" | "danger";
  }> = [];

  icons.push(
    ...appointment.prepFlags.map((flag) => ({
      key: flag,
      label: getAppointmentPrepFlagLabel(flag),
      Icon: Ruler,
      tone: "info" as const,
    })),
  );

  icons.push(
    ...appointment.profileFlags.map((flag) => {
    if (flag === "missing_email") {
      return {
        key: flag,
        label: getAppointmentProfileFlagLabel(flag),
        Icon: Mail,
        tone: "muted" as const,
      };
    }

    if (flag === "missing_phone") {
      return {
        key: flag,
        label: getAppointmentProfileFlagLabel(flag),
        Icon: Phone,
        tone: "muted" as const,
      };
    }

    if (flag === "missing_address") {
      return {
        key: flag,
        label: getAppointmentProfileFlagLabel(flag),
        Icon: MapPin,
        tone: "muted" as const,
      };
    }

    return {
      key: flag,
      label: getAppointmentProfileFlagLabel(flag),
      Icon: Megaphone,
      tone: "muted" as const,
    };
    }),
  );

  return icons;
}

function AppointmentAlertIconButton({
  label,
  Icon,
  tone,
  isOpen,
  onToggle,
}: {
  label: string;
  Icon: LucideIcon;
  tone?: "info" | "muted" | "danger";
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={[
        "relative inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-[var(--app-shadow-sm)] transition-colors",
        tone === "danger"
          ? "border-[var(--app-danger-border)] bg-[var(--app-danger-bg)] text-[var(--app-danger-text)]"
          : tone === "info"
            ? "border-[var(--app-info-border)] bg-[var(--app-info-bg)] text-[var(--app-info-text)]"
            : "border-[var(--app-border)]/74 bg-[var(--app-surface)] text-[var(--app-text-muted)]",
      ].join(" ")}
      aria-label={label}
      aria-expanded={isOpen}
      onClick={onToggle}
    >
      <Icon className="h-4 w-4" />
      {isOpen ? (
        <span className="pointer-events-none absolute left-1/2 top-[calc(100%+0.4rem)] z-20 w-max max-w-[12rem] -translate-x-1/2 rounded-[var(--app-radius-sm)] border border-[var(--app-border)]/82 bg-[var(--app-surface)] px-2.5 py-2 text-center text-[0.7rem] font-medium leading-tight text-[var(--app-text)] shadow-lg">
          {label}
        </span>
      ) : null}
    </button>
  );
}

export function HomeEmptyState({
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
            borderColor: "var(--app-info-border)",
            backgroundColor: "var(--app-info-bg)",
            color: "var(--app-info-text)",
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
  const confirmationPills = getAppointmentConfirmationPills(appointment);
  const alertIcons = getAppointmentAlertIcons(appointment);
  const [activeAlertIcon, setActiveAlertIcon] = useState<string | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeAlertIcon) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rowRef.current?.contains(event.target as Node)) {
        setActiveAlertIcon(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [activeAlertIcon]);

  return (
    <div ref={rowRef} className="app-home-schedule-row">
      <div className="app-home-schedule-row__time">
        <div className="app-text-value whitespace-nowrap text-[0.95rem] leading-tight">{getAppointmentTimeLabel(appointment)}</div>
      </div>

      <div className="app-home-schedule-row__details">
        <div className="app-text-value leading-tight">{appointment.customer}</div>
        <div className="space-y-1">
          <div className="app-text-body font-medium leading-tight">{appointment.type}</div>
          <div className="app-text-caption flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{appointment.location}</span>
          </div>
          {alertIcons.length ? (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {alertIcons.map(({ key, label, Icon, tone }) => (
                <AppointmentAlertIconButton
                  key={key}
                  label={label}
                  Icon={Icon}
                  tone={tone}
                  isOpen={activeAlertIcon === key}
                  onToggle={() => setActiveAlertIcon((current) => (current === key ? null : key))}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="app-home-schedule-row__status">
        {confirmationPills.map((callout) => (
          <AppointmentIssuePill
            key={callout.label}
            tone={callout.tone}
            label={callout.label}
          />
        ))}
      </div>

      <div className="app-home-schedule-row__actions">
        <ActionButton tone="primary" className="app-home-schedule-row__action-button" onClick={() => onCreateOrder(appointment)}>
          Start order
        </ActionButton>
        <ActionButton tone="quiet" className="app-home-schedule-row__action-button" onClick={() => onCancelAppointment(appointment)}>
          Cancel appointment
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
          meta={<CountPill count={appointments.length} label="booked" icon={CalendarDays} />}
          titleClassName="app-text-value"
          subtitleClassName="app-text-caption"
        />
      </div>
      <ScrollableLaneBody
        itemCount={appointments.length}
        scrollClassName="app-home-lane-scroll max-h-[calc(24rem+4px)] overflow-y-auto pb-16 pr-1 app-no-scrollbar"
        emptyState={
          <HomeLaneEmptyState
            kind="appointment"
            dayLabel={title}
            dateLabel={dateLabel}
            activeLocationLabel={activeLocationLabel}
          />
        }
        renderRows={(hasOverflowRows) =>
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className={[
                "app-table-row border-t border-[var(--app-border)]/55 px-3 py-2.5 sm:px-4 sm:py-3",
                hasOverflowRows ? "min-h-[7.6rem] xl:min-h-[8.8rem]" : "",
              ].join(" ")}
            >
              <ScheduleRow
                appointment={appointment}
                onCreateOrder={onCreateOrder}
                onCancelAppointment={onCancelAppointment}
              />
            </div>
          ))
        }
      />
    </div>
  );
}

function ScrollableLaneBody({
  itemCount,
  emptyState,
  renderRows,
  scrollClassName,
}: {
  itemCount: number;
  emptyState: ReactNode;
  renderRows: (hasOverflowRows: boolean) => ReactNode;
  scrollClassName?: string;
}) {
  const hasOverflowRows = itemCount > 3;
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(hasOverflowRows);

  useEffect(() => {
    if (!hasOverflowRows) {
      setShowScrollHint(false);
      return;
    }

    const scrollBody = scrollBodyRef.current;
    if (!scrollBody) {
      return;
    }

    const syncScrollHint = () => {
      setShowScrollHint(scrollBody.scrollTop + scrollBody.clientHeight < scrollBody.scrollHeight - 8);
    };

    syncScrollHint();
    scrollBody.addEventListener("scroll", syncScrollHint, { passive: true });
    window.addEventListener("resize", syncScrollHint);

    return () => {
      scrollBody.removeEventListener("scroll", syncScrollHint);
      window.removeEventListener("resize", syncScrollHint);
    };
  }, [hasOverflowRows, itemCount]);

  return (
    <div className="relative">
      {itemCount ? (
        <>
          <div
            ref={scrollBodyRef}
            className={
              hasOverflowRows
                ? scrollClassName ?? "max-h-[calc(29.25rem+4px)] overflow-y-auto pb-16 pr-1 app-no-scrollbar md:max-h-[calc(31.5rem+4px)]"
                : ""
            }
          >
            {renderRows(hasOverflowRows)}
          </div>
          {hasOverflowRows && showScrollHint ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-20 items-end justify-center bg-gradient-to-t from-[var(--app-surface)] via-[var(--app-surface)]/92 to-transparent pb-3 sm:flex">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--app-border)]/75 bg-[var(--app-surface)]/96 px-3 py-1.5 shadow-[0_-8px_20px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                <span className="app-text-overline text-[var(--app-text-soft)]">More below</span>
                <ChevronDown className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
              </div>
            </div>
          ) : null}
        </>
      ) : (
        emptyState
      )}
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getReadySinceLabel(readyAt: string | null, now = new Date()) {
  if (!readyAt) {
    return "Ready now";
  }

  const readyDate = new Date(readyAt);
  if (Number.isNaN(readyDate.getTime())) {
    return "Ready now";
  }

  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  const target = new Date(readyDate);
  target.setHours(12, 0, 0, 0);
  const daysSinceReady = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (daysSinceReady <= 0) {
    return "Ready today";
  }

  if (daysSinceReady === 1) {
    return "Ready since yesterday";
  }

  if (daysSinceReady < 14) {
    return `Ready since ${daysSinceReady} days ago`;
  }

  const weeksSinceReady = Math.round(daysSinceReady / 7);
  return `Ready since ${weeksSinceReady} ${weeksSinceReady === 1 ? "week" : "weeks"} ago`;
}

function getScheduledPickupLabel(pickup: ReadyPickupQueueItem["pickupSchedule"]) {
  if (!pickup.pickupDate && !pickup.pickupTime) {
    return "Pickup pending";
  }

  if (!pickup.pickupDate) {
    return pickup.pickupTime || "Pickup pending";
  }

  const parsed = new Date(`${pickup.pickupDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    const fallbackDateLabel = formatDateLabel(pickup.pickupDate);
    return pickup.pickupTime ? `${fallbackDateLabel} · ${pickup.pickupTime}` : fallbackDateLabel;
  }

  const scheduledDateLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsed);

  return pickup.pickupTime ? `${scheduledDateLabel} · ${pickup.pickupTime}` : scheduledDateLabel;
}

function getReadyStatusScopeLabel(scope: ReadyPickupQueueItem["pickupSchedule"]["scope"] | ReadyPickupQueueItem["orderType"]) {
  if (scope === "custom") {
    return "Custom garment";
  }

  if (scope === "alteration") {
    return "Alterations";
  }

  return getOpenOrderTypeLabel(scope);
}

function getHomeReadyStatusLines(pickup: ReadyPickupQueueItem) {
  const readySinceLabel = getReadySinceLabel(pickup.pickupSchedule.readyAt);
  const alterationPickup = pickup.openOrder.pickupSchedules.find((entry) => entry.scope === "alteration");
  const customPickup = pickup.openOrder.pickupSchedules.find((entry) => entry.scope === "custom");

  const getScopeStatus = (scopePickup: typeof alterationPickup | typeof customPickup) => {
    if (!scopePickup) {
      return {
        value: "In progress",
        color: "var(--app-text-soft)",
      };
    }

    if (scopePickup.pickedUp) {
      return {
        value: "Picked up",
        color: "var(--app-text-soft)",
      };
    }

    if (scopePickup.readyForPickup) {
      return {
        value: scopePickup.scope === pickup.pickupSchedule.scope ? readySinceLabel : "Ready",
        color: "var(--app-success-text)",
      };
    }

    return {
      value: "In progress",
      color: "var(--app-text-soft)",
    };
  };

  if (pickup.orderType !== "mixed") {
    return [
      {
        label: getReadyStatusScopeLabel(pickup.orderType),
        value: readySinceLabel,
        color: "var(--app-success-text)",
      },
    ];
  }

  return [
    {
      label: "Alterations",
      ...getScopeStatus(alterationPickup),
    },
    {
      label: "Custom garment",
      ...getScopeStatus(customPickup),
    },
  ];
}

function ReadyPickupRow({
  pickup,
  onCheckout,
  onCompletePickup,
}: {
  pickup: ReadyPickupQueueItem;
  onCheckout: () => void;
  onCompletePickup: () => void;
}) {
  const { pickupSchedule } = pickup;
  const itemSummary = pickup.itemSummary.filter(Boolean).join(" · ");
  const readyStatusLines = getHomeReadyStatusLines(pickup);
  const balanceLabel = pickup.pickupBalanceDue > 0 ? `Balance due ${formatCurrency(pickup.pickupBalanceDue)}` : "Prepaid";
  const pickupLocationLabel = pickupSchedule.pickupLocation || "Location pending";
  const needsPayment = pickup.pickupBalanceDue > 0;

  return (
    <div className="app-home-pickup-row">
      <div className="min-w-0 pr-2">
        <div className="space-y-2">
          {readyStatusLines.map((line, index) => (
            <div
              key={`${pickup.key}-${line.label}`}
              className={cx(
                "min-w-0",
                index > 0 ? "border-t border-[var(--app-border)]/45 pt-2" : "",
              )}
            >
              <div className="app-text-overline whitespace-nowrap text-[var(--app-text-soft)]">{line.label}</div>
              <div
                className="app-text-strong mt-1 text-[0.9rem] leading-tight"
                style={{ color: line.color }}
              >
                {line.value}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="min-w-0 space-y-2 pl-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <div className="app-text-strong">{pickup.payerName}</div>
          <div className="app-text-caption">Order {pickup.openOrderId}</div>
        </div>
        <div className="app-text-body leading-tight">{itemSummary || pickupSchedule.label}</div>
        <div className="app-text-caption flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            <span>{getScheduledPickupLabel(pickupSchedule)}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{pickupLocationLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BadgeDollarSign className="h-3.5 w-3.5 shrink-0" />
            <span>{balanceLabel}</span>
          </span>
        </div>
      </div>
      <div className="flex items-center md:justify-start lg:pt-0.5">
        <ActionButton
          tone="primary"
          className="min-h-10 px-3.5 py-2 text-sm"
          onClick={needsPayment ? onCheckout : onCompletePickup}
        >
          {needsPayment ? "Take payment" : "Complete pickup"}
        </ActionButton>
      </div>
    </div>
  );
}

type HomeWorkboardsProps = {
  visibleAppointmentCount: number;
  visiblePickupCount: number;
  todayLabel: string;
  tomorrowLabel: string;
  todayAppointments: Appointment[];
  tomorrowAppointments: Appointment[];
  readyPickups: ReadyPickupQueueItem[];
  singleActiveLocationLabel?: string;
  onCreateOrder: (appointment: Appointment) => void;
  onCancelAppointment: (appointment: Appointment) => void;
  onCheckoutPickup: (openOrderId: number) => void;
  onCompletePickup: (openOrderId: number) => void;
};

function WorkSurfaceHeader({
  icon,
  title,
  subtitle,
  count,
  countLabel,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  count: number;
  countLabel: string;
  tone: "info" | "success";
}) {
  const iconStyle =
    tone === "info"
      ? {
          borderColor: "var(--app-info-border)",
          backgroundColor: "var(--app-info-bg)",
          color: "var(--app-info-text)",
        }
      : {
          borderColor: "var(--app-success-border)",
          backgroundColor: "var(--app-success-bg)",
          color: "var(--app-success-text)",
        };

  return (
    <SurfaceHeader
      icon={icon}
      iconStyle={iconStyle}
      title={title}
      subtitle={subtitle}
      meta={<CountPill count={count} label={countLabel} icon={icon} tone={tone} />}
    />
  );
}

export function HomeWorkboards({
  visibleAppointmentCount,
  visiblePickupCount,
  todayLabel,
  tomorrowLabel,
  todayAppointments,
  tomorrowAppointments,
  readyPickups,
  singleActiveLocationLabel,
  onCreateOrder,
  onCancelAppointment,
  onCheckoutPickup,
  onCompletePickup,
}: HomeWorkboardsProps) {
  return (
    <div className="app-home-workboards">
      <Surface tone="work" className="app-home-workboard app-home-workboard--appointments p-4">
        <WorkSurfaceHeader
          icon={CalendarDays}
          title="Appointments"
          subtitle="Today and tomorrow"
          count={visibleAppointmentCount}
          countLabel="appointments"
          tone="info"
        />

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <AppointmentLane
            title="Today"
            dateLabel={todayLabel}
            appointments={todayAppointments}
            activeLocationLabel={singleActiveLocationLabel}
            onCreateOrder={onCreateOrder}
            onCancelAppointment={onCancelAppointment}
          />
          <AppointmentLane
            title="Tomorrow"
            dateLabel={tomorrowLabel}
            appointments={tomorrowAppointments}
            activeLocationLabel={singleActiveLocationLabel}
            onCreateOrder={onCreateOrder}
            onCancelAppointment={onCancelAppointment}
          />
        </div>
      </Surface>

      <Surface tone="work" className="app-home-workboard app-home-workboard--pickups p-4">
        <WorkSurfaceHeader
          icon={Package}
          title="Ready for pickup"
          subtitle="Anything ready and still waiting to be collected"
          count={visiblePickupCount}
          countLabel="pickups"
          tone="success"
        />

        <div className="app-home-pickup-list mt-4">
          <ScrollableLaneBody
            itemCount={readyPickups.length}
            emptyState={
              <HomeLaneEmptyState
                kind="pickup"
                dayLabel="Ready now"
                activeLocationLabel={singleActiveLocationLabel}
              />
            }
            renderRows={(hasOverflowRows) =>
              readyPickups.map((pickup) => (
                <div
                  key={pickup.key}
                  className={[
                    "app-table-row border-t border-[var(--app-border)]/55 px-4 py-3.5 first:border-t-0",
                    hasOverflowRows ? "min-h-[7.8rem]" : "",
                  ].join(" ")}
                >
                  <ReadyPickupRow
                    pickup={pickup}
                    onCheckout={() => onCheckoutPickup(pickup.openOrderId)}
                    onCompletePickup={() => onCompletePickup(pickup.openOrderId)}
                  />
                </div>
              ))
            }
          />
        </div>
      </Surface>
    </div>
  );
}
