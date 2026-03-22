import { useMemo, useState } from "react";
import { ClipboardList, Clock3, MapPin, PackageCheck, PackageSearch, Search, type LucideIcon } from "lucide-react";
import type { Appointment, ClosedOrderHistoryItem, OpenOrder, OrderType, PickupLocation } from "../types";
import { ActionButton, EmptyState, SectionHeader, StatusPill, cx } from "../components/ui/primitives";
import { CountPill, LocationPill, OrderStatusPill, PaymentStatusPill } from "../components/ui/pills";
import {
  filterClosedOrderHistory,
  filterOpenOrders,
  filterPickupAppointments,
  formatSummaryCurrency,
  getOpenOrderLocationSummary,
  getOpenOrderOperationalLane,
  getOpenOrderOperationalPhase,
  getOpenOrderTypeLabel,
  getOperationalPickupDateLabel,
  getOperationalPickupTimeLabel,
  getOrderQueueCounts,
  getPickupAlertState,
  getPickupAppointmentSummary,
  getPickupStatusSummary,
  getPickupTimingLabel,
  type OrdersQueueKey,
} from "../features/order/selectors";

type OpenOrdersScreenProps = {
  openOrders: OpenOrder[];
  closedOrderHistory: ClosedOrderHistoryItem[];
  pickupAppointments: Appointment[];
  onMarkOpenOrderPickupReady: (openOrderId: number, pickupId: string) => void;
  onStartNewOrder: () => void;
};

type OrdersView = "queues" | "all" | "history";

const queueMeta: Array<{
  key: OrdersQueueKey;
  label: string;
}> = [
  { key: "all", label: "All work" },
  { key: "due_today", label: "Due today" },
  { key: "due_tomorrow", label: "Due tomorrow" },
  { key: "ready_for_pickup", label: "Ready" },
  { key: "overdue", label: "Overdue" },
  { key: "in_house", label: "In-house" },
  { key: "factory", label: "Factory" },
  { key: "scheduled_pickups", label: "Scheduled pickups" },
];

const queueOverviewMeta: Array<{
  key: Exclude<OrdersQueueKey, "all">;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}> = [
  {
    key: "due_today",
    title: "Due today",
    subtitle: "Orders promised for today that still need operational movement.",
    icon: Clock3,
  },
  {
    key: "due_tomorrow",
    title: "Due tomorrow",
    subtitle: "Orders promised for tomorrow that should be staged now.",
    icon: Clock3,
  },
  {
    key: "ready_for_pickup",
    title: "Ready for pickup",
    subtitle: "Items that can move into customer handoff.",
    icon: PackageCheck,
  },
  {
    key: "overdue",
    title: "Overdue",
    subtitle: "Promised pickup timing has already slipped.",
    icon: PackageSearch,
  },
  {
    key: "in_house",
    title: "In-house work",
    subtitle: "Alterations and mixed work moving through internal production.",
    icon: PackageCheck,
  },
  {
    key: "factory",
    title: "Factory / custom work",
    subtitle: "Custom work that needs external production tracking.",
    icon: Clock3,
  },
  {
    key: "scheduled_pickups",
    title: "Scheduled pickups",
    subtitle: "Customer pickup appointments that are already booked on the calendar.",
    icon: Clock3,
  },
];

const pickupLocations: Array<PickupLocation | "all"> = ["all", "Fifth Avenue", "Queens", "Long Island"];

const selectedFilterClass =
  "border-[var(--app-accent)] bg-[var(--app-surface-elevated)] text-[var(--app-text)] shadow-[var(--app-shadow-sm)] shadow-[inset_0_0_0_1px_var(--app-accent)]";

const selectedFilterCountClass =
  "border-[var(--app-border-strong)] bg-[var(--app-accent)] text-[var(--app-accent-contrast)]";

const unselectedFilterClass =
  "border-[var(--app-border)] bg-[var(--app-surface-muted)]/30 text-[var(--app-text-muted)] hover:text-[var(--app-text)]";

const unselectedFilterCountClass =
  "border-transparent bg-[var(--app-surface)] text-[var(--app-text-soft)]";

function formatWorklistTotal(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getPhaseTone(phase: string) {
  if (phase === "In progress") {
    return "default" as const;
  }

  if (phase === "Ready for pickup") {
    return "success" as const;
  }

  if (phase === "Overdue") {
    return "danger" as const;
  }

  return "warn" as const;
}

function getWorklistPhaseLabel(phase: string) {
  if (phase === "In progress") {
    return "Pending";
  }

  if (phase === "Ready for pickup") {
    return "Ready";
  }

  return phase;
}

function getWorklistPhaseClass(phase: string) {
  if (phase === "Overdue") {
    return "text-[var(--app-danger)]";
  }

  if (phase === "Ready for pickup") {
    return "text-[var(--app-success)]";
  }

  return "text-[var(--app-text)]";
}

function OpenSectionHeader({
  icon: Icon,
  title,
  count,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  count: number;
  subtitle: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--app-border)]/45 pb-3">
      <div className="flex items-start gap-3">
        <div className="app-icon-chip">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="app-text-value">{title}</div>
          <div className="app-text-caption mt-1">{subtitle}</div>
        </div>
      </div>
      <CountPill count={count} />
    </div>
  );
}

function SearchFilterBar({
  query,
  onQueryChange,
  typeFilter,
  onTypeFilterChange,
  locationFilter,
  onLocationFilterChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  typeFilter: OrderType | "all";
  onTypeFilterChange: (value: OrderType | "all") => void;
  locationFilter: PickupLocation | "all";
  onLocationFilterChange: (value: PickupLocation | "all") => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="block min-w-[280px] flex-1">
        <div className="app-text-overline mb-2">Search work and orders</div>
        <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/55 bg-[var(--app-surface)] px-4 py-3.5 shadow-[var(--app-shadow-sm)]">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 shrink-0 text-[var(--app-text-soft)]" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search by customer, garment, order ID, or pickup details"
              className="min-w-0 flex-1 border-0 bg-transparent p-0 app-text-body outline-none placeholder:text-[var(--app-text-soft)]"
            />
          </div>
        </div>
      </label>

      <label className="block min-w-[180px]">
        <div className="app-text-overline mb-2">Type</div>
        <select
          value={typeFilter}
          onChange={(event) => onTypeFilterChange(event.target.value as OrderType | "all")}
          className="min-h-[3.625rem] w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)]/55 bg-[var(--app-surface)] px-4 py-3 app-text-body shadow-[var(--app-shadow-sm)] outline-none"
        >
          <option value="all">All order types</option>
          <option value="alteration">Alterations</option>
          <option value="custom">Custom Garment</option>
          <option value="mixed">Custom + Alterations</option>
        </select>
      </label>

      <label className="block min-w-[180px]">
        <div className="app-text-overline mb-2">Location</div>
        <select
          value={locationFilter}
          onChange={(event) => onLocationFilterChange(event.target.value as PickupLocation | "all")}
          className="min-h-[3.625rem] w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)]/55 bg-[var(--app-surface)] px-4 py-3 app-text-body shadow-[var(--app-shadow-sm)] outline-none"
        >
          {pickupLocations.map((location) => (
            <option key={location} value={location}>
              {location === "all" ? "All locations" : location}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function QueueStrip({
  activeQueue,
  onQueueChange,
  counts,
}: {
  activeQueue: OrdersQueueKey;
  onQueueChange: (queue: OrdersQueueKey) => void;
  counts: Record<OrdersQueueKey, number>;
}) {
  return (
    <div className="-mx-1 overflow-x-auto pb-1 app-no-scrollbar">
      <div className="flex min-w-max gap-2 px-1">
        {queueMeta.map((queue) => (
          <button
            key={queue.key}
            onClick={() => onQueueChange(queue.key)}
            className={cx(
              "inline-flex min-h-10 items-center gap-2 rounded-[var(--app-radius-md)] border px-3 py-2 transition",
              activeQueue === queue.key
                ? selectedFilterClass
                : unselectedFilterClass,
            )}
          >
            <span className="app-text-body font-medium">{queue.label}</span>
            <CountPill
              count={counts[queue.key]}
              icon={undefined}
              className={cx(
                "px-2 py-0.5 text-[11px]",
                activeQueue === queue.key
                  ? selectedFilterCountClass
                  : unselectedFilterCountClass,
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function WorkQueuePickupRow({ appointment }: { appointment: Appointment }) {
  return (
    <div className="grid gap-3 px-4 py-3.5 md:grid-cols-[minmax(0,1.1fr)_220px_180px] md:items-center">
      <div className="min-w-0">
        <div className="app-text-strong">{appointment.customer}</div>
        <div className="app-text-caption mt-1">Scheduled pickup appointment • {getPickupAppointmentSummary(appointment)}</div>
      </div>
      <div className="min-w-0">
        <div className="app-text-body font-medium">{`${getPickupTimingLabel(appointment.date)} • ${appointment.time}`}</div>
        <div className="app-text-caption mt-1">{appointment.missing === "Complete" ? "Ready for release" : appointment.missing}</div>
      </div>
      <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
        <LocationPill location={appointment.location} />
      </div>
    </div>
  );
}

function WorkQueueOrderRow({
  openOrder,
  onMarkOpenOrderPickupReady,
}: {
  openOrder: OpenOrder;
  onMarkOpenOrderPickupReady: (openOrderId: number, pickupId: string) => void;
}) {
  const phase = getOpenOrderOperationalPhase(openOrder);
  const pickupGroups = openOrder.pickupSchedules.reduce<Array<{
    key: string;
    summary: string;
    alertTone: ReturnType<typeof getPickupAlertState>["tone"];
    alertLabel: string;
    readyCount: number;
    pendingIds: string[];
    items: string[];
  }>>((groups, pickup) => {
    const pickupAlert = getPickupAlertState(pickup.pickupDate, pickup.pickupTime, pickup.readyForPickup);
    const pickupSummary = getPickupStatusSummary(pickup);
    const key = `${pickupSummary}__${pickupAlert.label}`;
    const existingGroup = groups.find((group) => group.key === key);

    if (existingGroup) {
      existingGroup.items.push(...pickup.itemSummary);
      if (pickup.readyForPickup) {
        existingGroup.readyCount += 1;
      } else {
        existingGroup.pendingIds.push(pickup.id);
      }
      return groups;
    }

    groups.push({
      key,
      summary: pickupSummary,
      alertTone: pickupAlert.tone,
      alertLabel: pickupAlert.label,
      readyCount: pickup.readyForPickup ? 1 : 0,
      pendingIds: pickup.readyForPickup ? [] : [pickup.id],
      items: [...pickup.itemSummary],
    });

    return groups;
  }, []);
  const pendingPickupIds = pickupGroups.flatMap((group) => group.pendingIds);

  const getGroupedItemSummary = (items: string[]) => {
    const uniqueItems = [...new Set(items)];
    if (uniqueItems.length <= 2) {
      return uniqueItems.join(", ");
    }

    return `${uniqueItems[0]}, ${uniqueItems[1]} +${uniqueItems.length - 2} more`;
  };

  return (
    <div className="px-4 py-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.15fr)_220px] lg:items-start">
        <div className="min-w-0">
          <div className="app-text-value">{openOrder.payerName}</div>
          <div className="app-text-caption mt-1">{getOpenOrderTypeLabel(openOrder.orderType)} • {openOrder.createdAtLabel}</div>
        </div>

        <div className="min-w-0 space-y-3">
          {pickupGroups.map((group) => {
            const uniqueItems = [...new Set(group.items)];
            const pendingCount = group.pendingIds.length;
            const isFullyReady = pendingCount === 0;
            const representativePickup = openOrder.pickupSchedules.find((pickup) => {
              const pickupAlert = getPickupAlertState(pickup.pickupDate, pickup.pickupTime, pickup.readyForPickup);
              const pickupSummary = getPickupStatusSummary(pickup);
              return `${pickupSummary}__${pickupAlert.label}` === group.key;
            });
            const dateLabel = representativePickup
              ? getOperationalPickupDateLabel(representativePickup.pickupDate, representativePickup.pickupTime)
              : null;
            const timeLabel = representativePickup
              ? getOperationalPickupTimeLabel(representativePickup.pickupDate, representativePickup.pickupTime)
              : null;
            const location = representativePickup?.pickupLocation ?? "";

            return (
              <div
                key={group.key}
                className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              >
                <div className="min-w-0">
                  <div className="app-text-overline">Promised ready by</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <div className="app-text-body font-medium">
                      {dateLabel ?? "Date pending"}{timeLabel ? ` · ${timeLabel}` : ""}
                    </div>
                    {location ? (
                      <div className="app-text-caption inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
                        <span>{location}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="app-text-caption mt-1">
                    {getGroupedItemSummary(uniqueItems)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  {isFullyReady ? null : (
                    <ActionButton
                      tone="secondary"
                      className="px-3 py-2 text-xs"
                      onClick={() => {
                        group.pendingIds.forEach((pickupId) => onMarkOpenOrderPickupReady(openOrder.id, pickupId));
                      }}
                    >
                      {pendingCount > 1 ? `Mark ${pendingCount} ready` : "Mark ready"}
                    </ActionButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3 lg:flex-col lg:items-end lg:text-right">
          <div>
            <StatusPill tone={getPhaseTone(phase)}>{getWorklistPhaseLabel(phase)}</StatusPill>
          </div>
          <div>
            <div className="text-[1.375rem] font-semibold leading-none tracking-[-0.01em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
              {formatWorklistTotal(openOrder.total)}
            </div>
            {openOrder.paymentStatus === "prepaid" ? (
              <div className="app-text-caption mt-1">Prepaid</div>
            ) : (
              <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-warn-text)]">
                Payment Due
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QueueSection({
  icon,
  title,
  subtitle,
  openOrders,
  pickupAppointments,
  onMarkOpenOrderPickupReady,
  emptyMessage,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  openOrders: OpenOrder[];
  pickupAppointments: Appointment[];
  onMarkOpenOrderPickupReady: (openOrderId: number, pickupId: string) => void;
  emptyMessage: string;
}) {
  const count = openOrders.length + pickupAppointments.length;

  if (!count) {
    return (
      <div className="space-y-3">
        <OpenSectionHeader icon={icon} title={title} count={0} subtitle={subtitle} />
        <EmptyState className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface-muted)]/15 shadow-none">
          <div className="app-text-body">{emptyMessage}</div>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <OpenSectionHeader icon={icon} title={title} count={count} subtitle={subtitle} />
      <div className="overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45">
        {pickupAppointments.length > 0 ? (
          <div>
            <div className="border-b border-[var(--app-border)]/35 bg-[var(--app-surface-muted)]/20 px-4 py-2">
              <div className="app-text-overline">Scheduled pickup appointments</div>
            </div>
            {pickupAppointments.map((appointment, index) => (
              <div
                key={appointment.id}
                className={cx(index > 0 && "border-t border-[var(--app-border)]/35")}
              >
                <WorkQueuePickupRow appointment={appointment} />
              </div>
            ))}
          </div>
        ) : null}
        {openOrders.length > 0 ? (
          <div className={cx(pickupAppointments.length > 0 && "border-t border-[var(--app-border)]/45")}>
            <div className="border-b border-[var(--app-border)]/35 bg-[var(--app-surface-muted)]/20 px-4 py-2">
              <div className="app-text-overline">Active orders</div>
            </div>
            {openOrders.map((openOrder, index) => (
              <div
                key={openOrder.id}
                className={cx(index > 0 && "border-t border-[var(--app-border)]/35")}
              >
                <WorkQueueOrderRow openOrder={openOrder} onMarkOpenOrderPickupReady={onMarkOpenOrderPickupReady} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AllOrdersRow({ openOrder }: { openOrder: OpenOrder }) {
  const phase = getOpenOrderOperationalPhase(openOrder);
  const lane = getOpenOrderOperationalLane(openOrder);
  const locations = getOpenOrderLocationSummary(openOrder);

  return (
    <div className="grid gap-3 px-4 py-3.5 lg:grid-cols-[minmax(0,1.2fr)_180px_160px_140px_auto] lg:items-center">
      <div className="min-w-0">
        <div className="app-text-strong">{openOrder.payerName}</div>
        <div className="app-text-caption mt-1">{getOpenOrderTypeLabel(openOrder.orderType)} • {openOrder.itemSummary.join(", ")}</div>
      </div>
      <div className="min-w-0">
        <div className="app-text-overline">Lane</div>
        <div className="app-text-body mt-1 font-medium">{lane}</div>
      </div>
      <div className="min-w-0">
        <div className="app-text-overline">Pickup</div>
        <div className="app-text-body mt-1 font-medium">{locations || "Pending"}</div>
      </div>
      <div className="min-w-0">
        <div className="app-text-overline">Total</div>
        <div className="app-text-strong mt-1">{formatSummaryCurrency(openOrder.total)}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <StatusPill tone={getPhaseTone(phase)}>{phase}</StatusPill>
        <PaymentStatusPill status={openOrder.paymentStatus} />
      </div>
    </div>
  );
}

export function OpenOrdersScreen({
  openOrders,
  closedOrderHistory,
  pickupAppointments,
  onMarkOpenOrderPickupReady,
  onStartNewOrder,
}: OpenOrdersScreenProps) {
  const [activeView, setActiveView] = useState<OrdersView>("queues");
  const [query, setQuery] = useState("");
  const [activeQueue, setActiveQueue] = useState<OrdersQueueKey>("all");
  const [typeFilter, setTypeFilter] = useState<OrderType | "all">("all");
  const [locationFilter, setLocationFilter] = useState<PickupLocation | "all">("all");

  const baseOpenOrders = useMemo(
    () => filterOpenOrders(openOrders, { query, queue: "all", typeFilter, locationFilter }),
    [locationFilter, openOrders, query, typeFilter],
  );

  const basePickupAppointments = useMemo(
    () => filterPickupAppointments(pickupAppointments, { query, queue: "all", locationFilter }),
    [locationFilter, pickupAppointments, query],
  );

  const queueCounts = useMemo(
    () => getOrderQueueCounts(baseOpenOrders, basePickupAppointments),
    [baseOpenOrders, basePickupAppointments],
  );

  const filteredQueueOrders = useMemo(
    () => filterOpenOrders(openOrders, { query, queue: activeQueue, typeFilter, locationFilter }),
    [activeQueue, locationFilter, openOrders, query, typeFilter],
  );

  const filteredQueuePickups = useMemo(
    () => filterPickupAppointments(pickupAppointments, { query, queue: activeQueue, locationFilter }),
    [activeQueue, locationFilter, pickupAppointments, query],
  );

  const filteredHistoryItems = useMemo(
    () => filterClosedOrderHistory([...closedOrderHistory], query),
    [closedOrderHistory, query],
  );

  const queuesSubtitle = queueCounts.all === 1
    ? "1 worklist item: active order or scheduled pickup"
    : `${queueCounts.all} worklist items: ${baseOpenOrders.length} active orders and ${basePickupAppointments.length} scheduled pickups`;
  const registrySubtitle = baseOpenOrders.length === 1
    ? "1 active order only"
    : `${baseOpenOrders.length} active orders only`;
  const historySubtitle = filteredHistoryItems.length === 1
    ? "1 closed order only"
    : `${filteredHistoryItems.length} closed orders only`;

  const activeSubtitle = activeView === "queues"
    ? queuesSubtitle
    : activeView === "all"
      ? registrySubtitle
      : historySubtitle;

  return (
    <div className="space-y-4">
      <div className="space-y-5">
        <SectionHeader
          icon={ClipboardList}
          title="Orders"
          subtitle={activeSubtitle}
          action={
            <ActionButton tone="primary" className="px-3 py-2 text-xs" onClick={onStartNewOrder}>
              New order
            </ActionButton>
          }
        />

        <div className="flex flex-wrap gap-2">
          {([
            { key: "queues", label: "Worklist", count: queueCounts.all },
            { key: "all", label: "Order registry", count: baseOpenOrders.length },
            { key: "history", label: "Closed orders", count: filteredHistoryItems.length },
          ] as const).map((view) => (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key)}
              className={cx(
                "inline-flex min-h-10 items-center gap-2 rounded-[var(--app-radius-md)] border px-3.5 py-2 text-sm font-medium transition",
                activeView === view.key
                  ? selectedFilterClass
                  : unselectedFilterClass,
              )}
            >
              {view.label}
              <CountPill
                count={view.count}
                icon={undefined}
                className={cx(
                  "px-2 py-0.5 text-[11px]",
                  activeView === view.key
                    ? selectedFilterCountClass
                    : unselectedFilterCountClass,
                )}
              />
            </button>
          ))}
        </div>

        <SearchFilterBar
          query={query}
          onQueryChange={setQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          locationFilter={locationFilter}
          onLocationFilterChange={setLocationFilter}
        />

        {activeView === "queues" ? (
          <QueueStrip activeQueue={activeQueue} onQueueChange={setActiveQueue} counts={queueCounts} />
        ) : null}
      </div>

      <div className="border-t border-[var(--app-border)]/55 pt-4">
        {activeView === "all" ? (
          baseOpenOrders.length === 0 ? (
            <EmptyState>No active orders match this search and filter set.</EmptyState>
          ) : (
            <div className="overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)]/55 bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]">
              {baseOpenOrders.map((openOrder, index) => (
                <div
                  key={openOrder.id}
                  className={cx(index > 0 && "border-t border-[var(--app-border)]/35")}
                >
                  <AllOrdersRow openOrder={openOrder} />
                </div>
              ))}
            </div>
          )
        ) : null}

        {activeView === "queues" ? (
          <QueueSection
            icon={activeQueue === "scheduled_pickups" ? Clock3 : PackageSearch}
            title={queueMeta.find((queue) => queue.key === activeQueue)?.label ?? "Queue"}
            subtitle={
              activeQueue === "all"
                ? "Active orders and booked pickup visits that still need operational attention."
                : queueOverviewMeta.find((queue) => queue.key === activeQueue)?.subtitle ?? "Focused operational queue view."
            }
            openOrders={filteredQueueOrders}
            pickupAppointments={filteredQueuePickups}
            onMarkOpenOrderPickupReady={onMarkOpenOrderPickupReady}
            emptyMessage="Nothing matches this queue and filter combination."
          />
        ) : null}

        {activeView === "history" ? (
          filteredHistoryItems.length === 0 ? (
            <EmptyState>No closed orders match this search.</EmptyState>
          ) : (
            <div className="overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)]/55 bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]">
              {filteredHistoryItems.map((order, index) => (
                <div
                  key={order.id}
                  className={cx(
                    "grid gap-3 px-4 py-3.5 md:grid-cols-[minmax(0,1fr)_140px_120px_auto] md:items-center",
                    index > 0 && "border-t border-[var(--app-border)]/35",
                  )}
                >
                  <div className="min-w-0">
                    <div className="app-text-strong">{order.customerName}</div>
                    <div className="app-text-caption mt-1">{order.label}</div>
                  </div>
                  <div className="app-text-body font-medium">{order.date}</div>
                  <div className="app-text-strong">{order.total}</div>
                  <div className="flex justify-start md:justify-end">
                    <OrderStatusPill status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
