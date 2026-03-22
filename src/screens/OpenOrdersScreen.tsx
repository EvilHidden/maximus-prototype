import { useMemo, useState } from "react";
import { ClipboardList, Clock3, PackageCheck, PackageSearch, Search, type LucideIcon } from "lucide-react";
import type { Appointment, ClosedOrderHistoryItem, OpenOrder, OrderType, PickupLocation } from "../types";
import { ActionButton, Card, EmptyState, SectionHeader, StatusPill, cx } from "../components/ui/primitives";
import { CountPill, LocationPill, OrderStatusPill, PaymentStatusPill } from "../components/ui/pills";
import {
  filterClosedOrderHistory,
  filterOpenOrders,
  filterPickupAppointments,
  formatSummaryCurrency,
  getOpenOrderLocationSummary,
  getOpenOrderOperationalLane,
  getOpenOrderOperationalPhase,
  getOpenOrderPaymentSummary,
  getOpenOrderTypeLabel,
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
type PickupAlertTone = "default" | "warn" | "danger" | "success";

const queueMeta: Array<{
  key: OrdersQueueKey;
  label: string;
}> = [
  { key: "all", label: "All active" },
  { key: "due_today", label: "Due today" },
  { key: "due_tomorrow", label: "Due tomorrow" },
  { key: "ready_for_pickup", label: "Ready for pickup" },
  { key: "overdue", label: "Overdue" },
  { key: "in_house", label: "In-house" },
  { key: "factory", label: "Factory" },
  { key: "scheduled_pickups", label: "Scheduled pickups" },
];

const pickupLocations: Array<PickupLocation | "all"> = ["all", "Fifth Avenue", "Queens", "Long Island"];

function getPickupToneClass(tone: PickupAlertTone) {
  if (tone === "warn") {
    return "text-[var(--app-warn-text)]";
  }

  if (tone === "danger") {
    return "text-[var(--app-danger-text)]";
  }

  if (tone === "success") {
    return "text-[var(--app-success-text)]";
  }

  return "text-[var(--app-text)]";
}

function getPhaseTone(phase: string) {
  if (phase === "Ready for pickup") {
    return "success" as const;
  }

  if (phase === "Overdue") {
    return "danger" as const;
  }

  return "warn" as const;
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
    <div className="flex flex-wrap items-end gap-3 border-b border-[var(--app-border)]/55 pb-4">
      <label className="block min-w-[280px] flex-1">
        <div className="app-text-overline mb-2">Search orders</div>
        <div className="rounded-[var(--app-radius-lg)] border border-[var(--app-border)]/55 bg-[var(--app-surface)] px-4 py-3.5 shadow-[var(--app-shadow-sm)]">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 shrink-0 text-[var(--app-text-soft)]" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search by customer, order type, garment, order ID, or pickup details"
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
          className="min-h-[3.625rem] w-full rounded-[var(--app-radius-lg)] border border-[var(--app-border)]/55 bg-[var(--app-surface)] px-4 py-3 app-text-body shadow-[var(--app-shadow-sm)] outline-none"
        >
          <option value="all">All order types</option>
          <option value="alteration">Alterations</option>
          <option value="custom">Custom</option>
          <option value="mixed">Mixed</option>
        </select>
      </label>

      <label className="block min-w-[180px]">
        <div className="app-text-overline mb-2">Location</div>
        <select
          value={locationFilter}
          onChange={(event) => onLocationFilterChange(event.target.value as PickupLocation | "all")}
          className="min-h-[3.625rem] w-full rounded-[var(--app-radius-lg)] border border-[var(--app-border)]/55 bg-[var(--app-surface)] px-4 py-3 app-text-body shadow-[var(--app-shadow-sm)] outline-none"
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
    <div className="space-y-3 border-b border-[var(--app-border)]/55 pb-4">
      <div>
        <div className="app-text-overline">Queue filters</div>
        <div className="app-text-caption mt-1">Use queues to shift the worklist without duplicating the Home screen.</div>
      </div>
      <div className="flex flex-wrap gap-2">
        {queueMeta.map((queue) => (
          <button
            key={queue.key}
            onClick={() => onQueueChange(queue.key)}
            className={cx(
              "inline-flex min-h-10 items-center gap-2 rounded-[var(--app-radius-md)] border px-3 py-2 transition",
              activeQueue === queue.key
                ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-[var(--app-accent-contrast)]"
                : "border-[var(--app-border)] bg-[var(--app-surface-muted)]/20 text-[var(--app-text-muted)] hover:text-[var(--app-text)]",
            )}
          >
            <span className="app-text-body font-medium">{queue.label}</span>
            <CountPill
              count={counts[queue.key]}
              icon={undefined}
              className={cx(
                "px-2 py-0.5 text-[11px]",
                activeQueue === queue.key
                  ? "border-transparent bg-[rgba(255,255,255,0.18)] text-[var(--app-accent-contrast)]"
                  : "border-transparent bg-[var(--app-surface)] text-[var(--app-text-soft)]",
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
        <div className="app-text-caption mt-1">{getPickupAppointmentSummary(appointment)}</div>
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

  return (
    <div className="px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="app-text-value">{openOrder.payerName}</div>
          <div className="app-text-caption mt-1">
            {getOpenOrderTypeLabel(openOrder.orderType)} • {openOrder.createdAtLabel}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={getPhaseTone(phase)}>{phase}</StatusPill>
          <PaymentStatusPill status={openOrder.paymentStatus} />
          <div className="app-text-strong">Total {formatSummaryCurrency(openOrder.total)}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-2">
          {openOrder.pickupSchedules.map((pickup) => {
            const pickupAlert = getPickupAlertState(pickup.pickupDate, pickup.pickupTime, pickup.readyForPickup);
            const pickupSummary = getPickupStatusSummary(pickup);

            return (
              <div
                key={pickup.id}
                className="grid gap-3 rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)]/20 px-3.5 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              >
                <div className="min-w-0">
                  <div className="app-text-overline">{pickup.label}</div>
                  <div className={cx("mt-1 text-sm font-semibold", getPickupToneClass(pickupAlert.tone))}>
                    {pickupSummary}
                  </div>
                  <div className="app-text-caption mt-1">{pickup.itemSummary.join(", ")}</div>
                  {pickupAlert.label ? (
                    <div className={cx("mt-1 text-xs font-medium", getPickupToneClass(pickupAlert.tone))}>
                      {pickupAlert.label}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  {pickup.readyForPickup ? (
                    <StatusPill tone="success">Ready</StatusPill>
                  ) : (
                    <ActionButton
                      tone="secondary"
                      className="px-3 py-2 text-xs"
                      onClick={() => onMarkOpenOrderPickupReady(openOrder.id, pickup.id)}
                    >
                      Mark ready
                    </ActionButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)]/20 px-3.5 py-3">
          <div className="app-text-overline">Lane</div>
          <div className="mt-1 app-text-strong">{getOpenOrderOperationalLane(openOrder)}</div>
          <div className="app-text-caption mt-1">{getOpenOrderLocationSummary(openOrder) || "Pickup location pending"}</div>
          <div className="mt-4 border-t border-[var(--app-border)]/45 pt-3">
            <div className="app-text-overline">Collected today</div>
            <div className="mt-1 app-text-strong">{formatSummaryCurrency(openOrder.collectedToday)}</div>
            <div className="app-text-caption mt-1">{getOpenOrderPaymentSummary(openOrder.paymentStatus)}</div>
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
        {pickupAppointments.map((appointment, index) => (
          <div
            key={appointment.id}
            className={cx(index > 0 && "border-t border-[var(--app-border)]/35")}
          >
            <WorkQueuePickupRow appointment={appointment} />
          </div>
        ))}
        {openOrders.map((openOrder, index) => (
          <div
            key={openOrder.id}
            className={cx((pickupAppointments.length > 0 || index > 0) && "border-t border-[var(--app-border)]/35")}
          >
            <WorkQueueOrderRow openOrder={openOrder} onMarkOpenOrderPickupReady={onMarkOpenOrderPickupReady} />
          </div>
        ))}
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

  const queuesSubtitle = queueCounts.all === 1 ? "1 active order or pickup" : `${queueCounts.all} active orders and pickups`;
  const registrySubtitle = baseOpenOrders.length === 1 ? "1 active order in the registry" : `${baseOpenOrders.length} active orders in the registry`;
  const historySubtitle = filteredHistoryItems.length === 1 ? "1 closed order" : `${filteredHistoryItems.length} closed orders`;

  const readyQueueOrders = useMemo(
    () => filterOpenOrders(baseOpenOrders, { query: "", queue: "ready_for_pickup", typeFilter: "all", locationFilter: "all" }),
    [baseOpenOrders],
  );
  const readyQueuePickups = useMemo(
    () => filterPickupAppointments(basePickupAppointments, { query: "", queue: "ready_for_pickup", locationFilter: "all" }),
    [basePickupAppointments],
  );
  const overdueQueueOrders = useMemo(
    () => filterOpenOrders(baseOpenOrders, { query: "", queue: "overdue", typeFilter: "all", locationFilter: "all" }),
    [baseOpenOrders],
  );
  const overdueQueuePickups = useMemo(
    () => filterPickupAppointments(basePickupAppointments, { query: "", queue: "overdue", locationFilter: "all" }),
    [basePickupAppointments],
  );
  const inHouseQueueOrders = useMemo(
    () => filterOpenOrders(baseOpenOrders, { query: "", queue: "in_house", typeFilter: "all", locationFilter: "all" }),
    [baseOpenOrders],
  );
  const factoryQueueOrders = useMemo(
    () => filterOpenOrders(baseOpenOrders, { query: "", queue: "factory", typeFilter: "all", locationFilter: "all" }),
    [baseOpenOrders],
  );

  const activeSubtitle = activeView === "queues"
    ? queuesSubtitle
    : activeView === "all"
      ? registrySubtitle
      : historySubtitle;

  return (
    <div className="space-y-4">
      <Card className="p-4">
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

        <div className="mb-4 flex flex-wrap gap-2 border-b border-[var(--app-border)] pb-4">
          {([
            { key: "queues", label: "Work queues", count: queueCounts.all },
            { key: "all", label: "All orders", count: baseOpenOrders.length },
            { key: "history", label: "History", count: filteredHistoryItems.length },
          ] as const).map((view) => (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key)}
              className={cx(
                "inline-flex min-h-10 items-center gap-2 rounded-[var(--app-radius-md)] border px-3.5 py-2 text-sm font-medium transition",
                activeView === view.key
                  ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-[var(--app-accent-contrast)]"
                  : "border-[var(--app-border)] bg-[var(--app-surface-muted)]/30 text-[var(--app-text-muted)] hover:text-[var(--app-text)]",
              )}
            >
              {view.label}
              <CountPill
                count={view.count}
                icon={undefined}
                className={cx(
                  "px-2 py-0.5 text-[11px]",
                  activeView === view.key
                    ? "border-transparent bg-[rgba(255,255,255,0.18)] text-[var(--app-accent-contrast)]"
                    : "border-transparent bg-[var(--app-surface)] text-[var(--app-text-soft)]",
                )}
              />
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <SearchFilterBar
            query={query}
            onQueryChange={setQuery}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            locationFilter={locationFilter}
            onLocationFilterChange={setLocationFilter}
          />

          {activeView === "queues" ? (
            <div className="space-y-6">
              <QueueStrip activeQueue={activeQueue} onQueueChange={setActiveQueue} counts={queueCounts} />

              {activeQueue === "all" ? (
                <div className="space-y-6">
                  <QueueSection
                    icon={PackageCheck}
                    title="Ready for pickup"
                    subtitle="Orders and pickup appointments that can move into customer handoff."
                    openOrders={readyQueueOrders}
                    pickupAppointments={readyQueuePickups}
                    onMarkOpenOrderPickupReady={onMarkOpenOrderPickupReady}
                    emptyMessage="Nothing is ready for pickup right now."
                  />

                  <QueueSection
                    icon={PackageSearch}
                    title="Overdue"
                    subtitle="Items that need attention because the promised pickup timing has slipped."
                    openOrders={overdueQueueOrders}
                    pickupAppointments={overdueQueuePickups}
                    onMarkOpenOrderPickupReady={onMarkOpenOrderPickupReady}
                    emptyMessage="No overdue orders or pickups."
                  />

                  <QueueSection
                    icon={PackageCheck}
                    title="In-house work"
                    subtitle="Alterations and mixed orders that rely on internal production and finishing."
                    openOrders={inHouseQueueOrders}
                    pickupAppointments={[]}
                    onMarkOpenOrderPickupReady={onMarkOpenOrderPickupReady}
                    emptyMessage="No in-house work matches these filters."
                  />

                  <QueueSection
                    icon={Clock3}
                    title="Factory / custom work"
                    subtitle="Custom and mixed orders that need external production and event-risk tracking."
                    openOrders={factoryQueueOrders}
                    pickupAppointments={[]}
                    onMarkOpenOrderPickupReady={onMarkOpenOrderPickupReady}
                    emptyMessage="No factory or custom work matches these filters."
                  />
                </div>
              ) : (
                <QueueSection
                  icon={activeQueue === "scheduled_pickups" ? Clock3 : PackageSearch}
                  title={queueMeta.find((queue) => queue.key === activeQueue)?.label ?? "Queue"}
                  subtitle="Filtered operational queue view."
                  openOrders={filteredQueueOrders}
                  pickupAppointments={filteredQueuePickups}
                  onMarkOpenOrderPickupReady={onMarkOpenOrderPickupReady}
                  emptyMessage="Nothing matches this queue and filter combination."
                />
              )}
            </div>
          ) : null}

          {activeView === "all" ? (
            baseOpenOrders.length === 0 ? (
              <EmptyState>No active orders match this search and filter set.</EmptyState>
            ) : (
              <div className="overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45">
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

          {activeView === "history" ? (
            filteredHistoryItems.length === 0 ? (
              <EmptyState>No closed orders match this search.</EmptyState>
            ) : (
              <div className="overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45">
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
      </Card>
    </div>
  );
}
