import {
  ClipboardList,
  Clock3,
  MapPin,
  PackageSearch,
  Search,
  type LucideIcon,
} from "lucide-react";
import type { Appointment, ClosedOrderHistoryItem, OpenOrder, OrderType, PickupLocation } from "../../../types";
import {
  ActionButton,
  EmptyState,
  SearchField,
  SectionHeader,
  SelectField,
  SelectionChip,
  StatusPill,
  SurfaceHeader,
  cx,
} from "../../../components/ui/primitives";
import { CountPill, LocationPill, OrderStatusPill, PaymentStatusPill } from "../../../components/ui/pills";
import {
  getAppointmentContextFlagLabel,
  getAppointmentPrepFlagLabel,
  getAppointmentProfileFlagLabel,
  getAppointmentTimeLabel,
} from "../../appointments/selectors";
import {
  formatClosedOrderDate,
  formatClosedOrderTotal,
  formatOpenOrderCreatedAt,
  formatSummaryCurrency,
  getOpenOrderLocationSummary,
  getOpenOrderOperationalLane,
  getOpenOrderOperationalPhase,
  getOpenOrderTypeLabel,
  getOperationalPickupDateLabel,
  getOperationalPickupTimeLabel,
  getPickupAlertState,
  getPickupAppointmentSummary,
  getPickupStatusSummary,
  getPickupTimingLabel,
  type OrdersQueueKey,
} from "../selectors";
import type { OrdersView } from "../hooks/useOpenOrdersView";

export const queueMeta: Array<{
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

export const queueOverviewMeta: Array<{
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
    icon: Clock3,
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
    icon: PackageSearch,
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

function OpenSectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <SurfaceHeader
      icon={Icon}
      title={title}
      subtitle={subtitle}
      className="border-b border-[var(--app-border)]/45 pb-3"
      titleClassName="app-text-value"
      subtitleClassName="app-text-caption"
    />
  );
}

export function OpenOrdersHeader({
  subtitle,
  onStartNewOrder,
}: {
  subtitle: string;
  onStartNewOrder: () => void;
}) {
  return (
    <SectionHeader
      icon={ClipboardList}
      title="Orders"
      subtitle={subtitle}
      action={
        <ActionButton tone="primary" className="px-3 py-2 text-xs" onClick={onStartNewOrder}>
          New order
        </ActionButton>
      }
    />
  );
}

export function OpenOrdersControls({
  activeView,
  onViewChange,
  viewCounts,
  query,
  onQueryChange,
  typeFilter,
  onTypeFilterChange,
  pickupLocations,
  locationFilter,
  onLocationFilterChange,
  activeQueue,
  onQueueChange,
  queueCounts,
}: {
  activeView: OrdersView;
  onViewChange: (view: OrdersView) => void;
  viewCounts: { queues: number; all: number; history: number };
  query: string;
  onQueryChange: (value: string) => void;
  typeFilter: OrderType | "all";
  onTypeFilterChange: (value: OrderType | "all") => void;
  pickupLocations: PickupLocation[];
  locationFilter: PickupLocation | "all";
  onLocationFilterChange: (value: PickupLocation | "all") => void;
  activeQueue: OrdersQueueKey;
  onQueueChange: (queue: OrdersQueueKey) => void;
  queueCounts: Record<OrdersQueueKey, number>;
}) {
  const locationOptions: Array<PickupLocation | "all"> = ["all", ...pickupLocations];

  return (
    <div className="app-control-deck px-4 py-4">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {([
            { key: "queues", label: "Worklist", count: viewCounts.queues },
            { key: "all", label: "Order registry", count: viewCounts.all },
            { key: "history", label: "Closed orders", count: viewCounts.history },
          ] as const).map((view) => (
            <SelectionChip
              key={view.key}
              selected={activeView === view.key}
              onClick={() => onViewChange(view.key)}
              className={activeView === view.key ? "shadow-[inset_0_0_0_1px_var(--app-accent)]" : "bg-[var(--app-surface-muted)]/30"}
              trailing={
                <CountPill
                  count={view.count}
                  icon={undefined}
                  className={cx(
                    "px-2 py-0.5 text-[11px]",
                    activeView === view.key
                      ? "border-[var(--app-border-strong)] bg-[var(--app-accent)] text-[var(--app-accent-contrast)]"
                      : "border-[var(--app-border)]/55 bg-[var(--app-surface-muted)]/78 text-[var(--app-text-soft)]",
                  )}
                />
              }
            >
              {view.label}
            </SelectionChip>
          ))}
        </div>

        <div className="border-t border-[var(--app-border)]/35 pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <SearchField
              label="Search work and orders"
              value={query}
              onChange={onQueryChange}
              placeholder="Search by customer, garment, order ID, or pickup details"
              icon={Search}
              className="min-w-[280px] flex-1"
            />

            <SelectField
              label="Type"
              value={typeFilter}
              onChange={(value) => onTypeFilterChange(value as OrderType | "all")}
              className="min-w-[180px]"
            >
              <option value="all">All order types</option>
              <option value="alteration">Alterations</option>
              <option value="custom">Custom Garment</option>
              <option value="mixed">Custom + Alterations</option>
            </SelectField>

            <SelectField
              label="Location"
              value={locationFilter}
              onChange={(value) => onLocationFilterChange(value as PickupLocation | "all")}
              className="min-w-[180px]"
            >
              {locationOptions.map((location) => (
                <option key={location} value={location}>
                  {location === "all" ? "All locations" : location}
                </option>
              ))}
            </SelectField>
          </div>
        </div>

        {activeView === "queues" ? (
          <div className="border-t border-[var(--app-border)]/35 pt-4">
            <div className="-mx-1 overflow-x-auto pb-1 app-no-scrollbar">
              <div className="flex min-w-max gap-2 px-1">
                {queueMeta.map((queue) => (
                  <SelectionChip
                    key={queue.key}
                    selected={activeQueue === queue.key}
                    onClick={() => onQueueChange(queue.key)}
                    className={activeQueue === queue.key ? "shadow-[inset_0_0_0_1px_var(--app-accent)]" : "bg-[var(--app-surface-muted)]/30"}
                    trailing={
                      <CountPill
                        count={queueCounts[queue.key]}
                        icon={undefined}
                        className={cx(
                          "px-2 py-0.5 text-[11px]",
                          activeQueue === queue.key
                            ? "border-[var(--app-border-strong)] bg-[var(--app-accent)] text-[var(--app-accent-contrast)]"
                            : "border-[var(--app-border)]/55 bg-[var(--app-surface-muted)]/78 text-[var(--app-text-soft)]",
                        )}
                      />
                    }
                  >
                    {queue.label}
                  </SelectionChip>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function WorkQueuePickupRow({ appointment }: { appointment: Appointment }) {
  const operationalDetail =
    appointment.prepFlags.map(getAppointmentPrepFlagLabel)[0]
    ?? appointment.profileFlags.map(getAppointmentProfileFlagLabel)[0]
    ?? appointment.contextFlags.map(getAppointmentContextFlagLabel)[0]
    ?? "Customer handoff scheduled";

  return (
    <div className="grid gap-3 px-4 py-3.5 md:grid-cols-[minmax(0,1.1fr)_220px_180px] md:items-center">
      <div className="min-w-0">
        <div className="app-text-strong">{appointment.customer}</div>
        <div className="app-text-caption mt-1">Scheduled pickup appointment • {getPickupAppointmentSummary(appointment)}</div>
      </div>
      <div className="min-w-0">
        <div className="app-text-body font-medium">{`${getPickupTimingLabel(appointment.scheduledFor.slice(0, 10))} • ${getAppointmentTimeLabel(appointment)}`}</div>
        <div className="app-text-caption mt-1">{operationalDetail}</div>
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
          <div className="app-text-caption mt-1">{getOpenOrderTypeLabel(openOrder.orderType)} • {formatOpenOrderCreatedAt(openOrder.createdAt)}</div>
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
                      tone="primary"
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

export function QueueSection({
  activeQueue,
  openOrders,
  pickupAppointments,
  onMarkOpenOrderPickupReady,
}: {
  activeQueue: OrdersQueueKey;
  openOrders: OpenOrder[];
  pickupAppointments: Appointment[];
  onMarkOpenOrderPickupReady: (openOrderId: number, pickupId: string) => void;
}) {
  const count = openOrders.length + pickupAppointments.length;

  if (!count) {
    return (
      <div className="app-work-surface">
        <div className="px-4 py-4">
          <OpenSectionHeader
            icon={activeQueue === "scheduled_pickups" ? Clock3 : PackageSearch}
            title={queueMeta.find((queue) => queue.key === activeQueue)?.label ?? "Queue"}
            subtitle={
              activeQueue === "all"
                ? "Active orders and booked pickup visits that still need operational attention."
                : queueOverviewMeta.find((queue) => queue.key === activeQueue)?.subtitle ?? "Focused operational queue view."
            }
          />
        </div>
        <div className="border-t border-[var(--app-border)]/45">
          <EmptyState className="rounded-none border-0 bg-transparent shadow-none">
            <div className="app-text-body">Nothing matches this queue and filter combination.</div>
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="app-work-surface">
      <div className="px-4 py-4">
        <OpenSectionHeader
          icon={activeQueue === "scheduled_pickups" ? Clock3 : PackageSearch}
          title={queueMeta.find((queue) => queue.key === activeQueue)?.label ?? "Queue"}
          subtitle={
            activeQueue === "all"
              ? "Active orders and booked pickup visits that still need operational attention."
              : queueOverviewMeta.find((queue) => queue.key === activeQueue)?.subtitle ?? "Focused operational queue view."
          }
        />
      </div>
      <div className="border-t border-[var(--app-border)]/45">
        {pickupAppointments.length > 0 ? (
          <div>
            <div className="app-table-head border-b border-[var(--app-border)]/35 px-4 py-2">
              <div className="app-text-overline">Scheduled pickup appointments</div>
            </div>
            {pickupAppointments.map((appointment, index) => (
              <div
                key={appointment.id}
                className={cx("app-table-row", index > 0 && "border-t border-[var(--app-border)]/35")}
              >
                <WorkQueuePickupRow appointment={appointment} />
              </div>
            ))}
          </div>
        ) : null}
        {openOrders.length > 0 ? (
          <div className={cx(pickupAppointments.length > 0 && "border-t border-[var(--app-border)]/45")}>
            <div className="app-table-head border-b border-[var(--app-border)]/35 px-4 py-2">
              <div className="app-text-overline">Active orders</div>
            </div>
            {openOrders.map((openOrder, index) => (
              <div
                key={openOrder.id}
                className={cx("app-table-row", index > 0 && "border-t border-[var(--app-border)]/35")}
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

export function OpenOrdersBody({
  activeView,
  activeQueue,
  baseOpenOrders,
  filteredQueueOrders,
  filteredQueuePickups,
  filteredHistoryItems,
  onMarkOpenOrderPickupReady,
}: {
  activeView: OrdersView;
  activeQueue: OrdersQueueKey;
  baseOpenOrders: OpenOrder[];
  filteredQueueOrders: OpenOrder[];
  filteredQueuePickups: Appointment[];
  filteredHistoryItems: ClosedOrderHistoryItem[];
  onMarkOpenOrderPickupReady: (openOrderId: number, pickupId: string) => void;
}) {
  return (
    <div className="pt-1">
      {activeView === "all" ? (
        baseOpenOrders.length === 0 ? (
          <EmptyState>No active orders match this search and filter set.</EmptyState>
        ) : (
          <div className="app-work-surface">
            {baseOpenOrders.map((openOrder, index) => (
              <div
                key={openOrder.id}
                className={cx("app-table-row", index > 0 && "border-t border-[var(--app-border)]/35")}
              >
                <AllOrdersRow openOrder={openOrder} />
              </div>
            ))}
          </div>
        )
      ) : null}

      {activeView === "queues" ? (
        <QueueSection
          activeQueue={activeQueue}
          openOrders={filteredQueueOrders}
          pickupAppointments={filteredQueuePickups}
          onMarkOpenOrderPickupReady={onMarkOpenOrderPickupReady}
        />
      ) : null}

      {activeView === "history" ? (
        filteredHistoryItems.length === 0 ? (
          <EmptyState>No closed orders match this search.</EmptyState>
        ) : (
          <div className="app-work-surface">
            {filteredHistoryItems.map((order, index) => (
              <div
                key={order.id}
                className={cx(
                  "app-table-row grid gap-3 px-4 py-3.5 md:grid-cols-[minmax(0,1fr)_140px_120px_auto] md:items-center",
                  index > 0 && "border-t border-[var(--app-border)]/35",
                )}
              >
                <div className="min-w-0">
                  <div className="app-text-strong">{order.customerName}</div>
                  <div className="app-text-caption mt-1">{order.label}</div>
                </div>
                <div className="app-text-body font-medium">{formatClosedOrderDate(order.createdAt)}</div>
                <div className="app-text-strong">{formatClosedOrderTotal(order.total)}</div>
                <div className="flex justify-start md:justify-end">
                  <OrderStatusPill status={order.status} />
                </div>
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
