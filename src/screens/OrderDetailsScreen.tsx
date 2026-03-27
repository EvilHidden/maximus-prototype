import { CalendarClock, ChevronDown, ClipboardList, CreditCard, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import type { Customer, OpenOrder, Screen } from "../types";
import { ActionButton, Callout, EmptyState, SectionHeader, StatusPill, Surface, SurfaceHeader, cx } from "../components/ui/primitives";
import {
  getOpenOrderPickupBalanceDue,
  getOpenOrderPickupGroups,
  getOpenOrderTypeLabel,
  hasReadyScopesForPickup,
} from "../features/order/selectors";
import {
  formatCheckoutCurrency,
} from "../features/order/checkoutDisplay";
import { getPickupDateTime } from "../features/order/orderDateUtils";
import { CheckoutAcceptedBanner } from "../features/order/components/checkout/CheckoutAcceptedBanner";
import { CheckoutSummaryRail } from "../features/order/components/checkout/CheckoutSummaryRail";
import { ConfirmCancelOrderModal } from "../features/order/modals/ConfirmCancelOrderModal";
import { ConfirmCheckoutModal } from "../features/order/modals/ConfirmCheckoutModal";

type OrderDetailsScreenProps = {
  customers: Customer[];
  openOrder: OpenOrder | null;
  showAcceptedConfirmation: boolean;
  showCheckoutCompletion: boolean;
  onScreenChange: (screen: Screen) => void;
  onCompleteOpenOrderCheckout: (openOrderId: number) => void;
  onEditOpenOrder: (openOrderId: number) => void;
  onCancelOpenOrder: (openOrderId: number) => void;
  onCompleteOpenOrderPickup: (openOrderId: number) => void;
};

function getScopeLabel(scope: OpenOrder["pickupSchedules"][number]["scope"]) {
  return scope === "alteration" ? "Alterations" : "Custom garments";
}

function getGroupStatusDisplay(group: ReturnType<typeof getOpenOrderPickupGroups>[number], representativePickup: OpenOrder["pickupSchedules"][number] | null) {
  if (!representativePickup) {
    return {
      label: "Needs review",
      tone: "warn" as const,
      detail: "Pickup timing needs attention.",
    };
  }

  if (representativePickup.pickedUp) {
    return {
      label: "Picked up",
      tone: "success" as const,
      detail: "This handoff is already complete.",
    };
  }

  if (representativePickup.readyForPickup) {
    return {
      label: "Ready",
      tone: "success" as const,
      detail: "These pieces can be handed off now.",
    };
  }

  if (group.alertLabel === "Past promised ready time") {
    return {
      label: "Overdue",
      tone: "danger" as const,
      detail: "This is past its ready time.",
    };
  }

  if (group.alertLabel === "Promised ready within 1 hour") {
    return {
      label: "Due soon",
      tone: "warn" as const,
      detail: "This is due within the next hour.",
    };
  }

  return {
    label: "In progress",
    tone: "default" as const,
    detail: group.alertLabel,
  };
}

function getDetailsSubtitle(openOrder: OpenOrder, dueNow: number, remainingLater: number, hasReadyScopesToPickup: boolean) {
  if (hasReadyScopesToPickup && dueNow > 0 && remainingLater > 0) {
    return "Review the order first. Only the ready pieces are due today, and the unfinished work keeps its balance on the order.";
  }

  if (hasReadyScopesToPickup && dueNow > 0) {
    return "Review the order first, then take payment for the pieces being collected today.";
  }

  if (hasReadyScopesToPickup) {
    return "Everything being collected today is already paid. Review the handoff before you finish the pickup.";
  }

  if (openOrder.balanceDue > 0) {
    return "Review the order first, then decide whether payment happens now or later.";
  }

  return "Review the order details before you edit it or move it forward.";
}

function getScopeLineItems(openOrder: OpenOrder, scope: OpenOrder["pickupSchedules"][number]["scope"]) {
  return openOrder.lineItems.filter((item) => item.kind === scope);
}

function formatScopeReadyBy(pickup: OpenOrder["pickupSchedules"][number] | null) {
  if (!pickup) {
    return "Timing needed";
  }

  if (pickup.scope === "custom" && !pickup.pickupDate && pickup.eventDate) {
    return `Event due ${pickup.eventDate}`;
  }

  const pickupDateTime = getPickupDateTime(pickup.pickupDate, pickup.pickupTime);
  if (!pickupDateTime) {
    return "Timing needed";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(pickupDateTime);
}

function getCustomItemRows(item: OpenOrder["lineItems"][number]) {
  return item.components
    .filter((component) => component.kind !== "alteration_service")
    .map((component) => ({
      label: component.kind === "measurement_set"
        ? "Measurements"
        : component.kind === "pocket_type"
          ? "Pockets"
          : component.label,
      value: component.value,
    }));
}

export function OrderDetailsScreen({
  customers,
  openOrder,
  showAcceptedConfirmation,
  showCheckoutCompletion,
  onScreenChange,
  onCompleteOpenOrderCheckout,
  onEditOpenOrder,
  onCancelOpenOrder,
  onCompleteOpenOrderPickup,
}: OrderDetailsScreenProps) {
  const [checkoutConfirmOpen, setCheckoutConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>([]);

  const checkoutCustomer = useMemo(
    () => (openOrder ? customers.find((customer) => customer.id === openOrder.payerCustomerId) ?? null : null),
    [customers, openOrder],
  );

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItemIds((current) => (
      current.includes(itemId)
        ? current.filter((candidate) => candidate !== itemId)
        : [...current, itemId]
    ));
  };

  if (!openOrder) {
    return (
      <div className="space-y-4">
        <SectionHeader
          icon={ClipboardList}
          title="Order details"
          subtitle="Choose an order from Orders before opening this view."
          action={(
            <ActionButton tone="secondary" className="px-3 py-2 text-xs" onClick={() => onScreenChange("openOrders")}>
              Back to orders
            </ActionButton>
          )}
        />
        <Surface tone="work" className="px-4 py-5">
          <EmptyState className="rounded-[var(--app-radius-md)] border-dashed bg-[var(--app-surface-muted)]/35 px-5 py-5 shadow-none">
            Select an order from the Orders screen to review its details before taking payment.
          </EmptyState>
        </Surface>
      </div>
    );
  }

  const hasReadyScopesToPickup = hasReadyScopesForPickup(openOrder);
  const readyPickupBalanceDue = getOpenOrderPickupBalanceDue(openOrder);
  const dueNow = hasReadyScopesToPickup && readyPickupBalanceDue > 0 ? readyPickupBalanceDue : openOrder.balanceDue;
  const remainingLater = dueNow < openOrder.balanceDue ? openOrder.balanceDue - dueNow : 0;
  const checkoutSubtitle = getDetailsSubtitle(openOrder, dueNow, remainingLater, hasReadyScopesToPickup);
  const pickupGroups = getOpenOrderPickupGroups(openOrder, {
    includePickedUp: openOrder.orderType === "mixed",
  });
  const totalsItems = [
    { label: "Collected", value: formatCheckoutCurrency(openOrder.totalCollected) },
    { label: hasReadyScopesToPickup && dueNow > 0 ? "Due today" : "Balance due", value: formatCheckoutCurrency(dueNow) },
    ...(remainingLater > 0 ? [{ label: "Later after today", value: formatCheckoutCurrency(remainingLater) }] : []),
    { label: "Total", value: formatCheckoutCurrency(openOrder.total) },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={ClipboardList}
        title="Order details"
        subtitle={checkoutSubtitle}
        action={(
          <ActionButton tone="secondary" className="px-3 py-2 text-xs" onClick={() => onScreenChange("openOrders")}>
            Back to orders
          </ActionButton>
        )}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Surface tone="work" className="overflow-hidden">
          <div className="px-4 py-4">
            <SurfaceHeader
              title={`Order #${openOrder.id}`}
              subtitle={`${getOpenOrderTypeLabel(openOrder.orderType)} • Created ${new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }).format(new Date(openOrder.createdAt))}`}
              meta={(
                <div className="text-right">
                  <div className="app-text-overline">{hasReadyScopesToPickup && dueNow > 0 ? "Due today" : "Balance due"}</div>
                  <div className="mt-1 text-[1.9rem] font-semibold leading-none tracking-[-0.025em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
                    {dueNow > 0 ? formatCheckoutCurrency(dueNow) : "Paid"}
                  </div>
                  <div className="app-text-caption mt-1">
                    {remainingLater > 0
                      ? `${formatCheckoutCurrency(remainingLater)} stays with unfinished work`
                      : openOrder.balanceDue > 0
                        ? "Still due on this order"
                        : "No balance due"}
                  </div>
                </div>
              )}
            />
          </div>

          {showAcceptedConfirmation ? (
            <CheckoutAcceptedBanner
              openOrderId={openOrder.id}
              payerName={openOrder.payerName}
              balanceDue={openOrder.balanceDue}
              acceptedOrderNeedsPayment={openOrder.balanceDue > 0}
            />
          ) : null}

          {showCheckoutCompletion ? (
            <div className="border-t border-[var(--app-border)]/45 px-4 py-4">
              <Callout
                tone="success"
                title="Payment recorded"
              >
                {hasReadyScopesToPickup
                  ? remainingLater > 0
                    ? `${formatCheckoutCurrency(dueNow)} is recorded for today's pickup. ${formatCheckoutCurrency(remainingLater)} stays on the unfinished part of the order.`
                    : "Today's pickup balance is recorded. You can complete the handoff when the customer has everything."
                  : "This payment is recorded on the order. You can keep working from here without using a separate checkout page."}
              </Callout>
            </div>
          ) : null}

          {hasReadyScopesToPickup && dueNow > 0 && remainingLater > 0 ? (
            <div className="border-t border-[var(--app-border)]/45 px-4 py-4">
              <Callout
                tone="warn"
                title="Today’s payment is only for the ready pieces"
              >
                {formatCheckoutCurrency(dueNow)} is due now. The remaining {formatCheckoutCurrency(remainingLater)} stays with the part of the order still in progress.
              </Callout>
            </div>
          ) : null}

          <div className="border-t border-[var(--app-border)]/45 px-4 py-4">
            <div className="min-w-0">
              <div className="app-text-overline">Customer</div>
              <div className="mt-2 space-y-1.5">
                <div className="app-text-strong">{openOrder.payerName}</div>
                {checkoutCustomer?.phone ? <div className="app-text-caption">{checkoutCustomer.phone}</div> : null}
                {checkoutCustomer?.email ? <div className="app-text-caption">{checkoutCustomer.email}</div> : null}
                {checkoutCustomer?.address ? <div className="app-text-caption whitespace-pre-line">{checkoutCustomer.address}</div> : null}
                {openOrder.payerCustomerId === null ? <div className="app-text-caption">Walk-in customer</div> : null}
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--app-border)]/45 px-4 py-4">
            <div className="app-text-overline">Order items</div>
            <div className="mt-3 space-y-3">
              {pickupGroups.map((group, index) => {
                const representativePickup = openOrder.pickupSchedules.find((pickup) => pickup.id === group.pickupIds[0]) ?? null;
                const statusDisplay = getGroupStatusDisplay(group, representativePickup);
                const scopeLineItems = getScopeLineItems(openOrder, group.scope);
                const scopeAmount = scopeLineItems.reduce((sum, item) => sum + item.amount, 0);
                const readyByLabel = formatScopeReadyBy(representativePickup);
                const readyByDisplay = readyByLabel === "Timing needed" || readyByLabel.startsWith("Event due")
                  ? readyByLabel
                  : `Ready by ${readyByLabel}`;

                return (
                  <div
                    key={group.key}
                    className={cx(
                      "rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/28 px-4 py-3",
                      index > 0 && "mt-3",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="app-text-strong">{getScopeLabel(group.scope)}</div>
                          <StatusPill tone={statusDisplay.tone}>{statusDisplay.label}</StatusPill>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.82rem] text-[var(--app-text-soft)]">
                          <div className="inline-flex items-center gap-1.5">
                            <CalendarClock className="h-3.5 w-3.5" />
                            <span>{readyByDisplay}</span>
                          </div>
                          {representativePickup?.pickupLocation ? (
                            <div className="inline-flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{representativePickup.pickupLocation}</span>
                            </div>
                          ) : null}
                        </div>
                        <div className="app-text-caption mt-2 whitespace-pre-line leading-relaxed">
                          {statusDisplay.detail}
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="app-text-overline">Subtotal</div>
                        <div className="mt-1 text-[1.02rem] font-semibold tracking-[-0.015em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
                          {formatCheckoutCurrency(scopeAmount)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-[var(--app-border)]/35 pt-3">
                      <div className="app-text-overline">Items</div>
                      {scopeLineItems.length > 0 ? (
                        <div className="mt-2 divide-y divide-[var(--app-border)]/25">
                          {scopeLineItems.map((item) => {
                            const serviceRows = item.components.filter((component) => component.kind === "alteration_service");
                            const customRows = getCustomItemRows(item);
                            const itemTitle = item.kind === "alteration" ? item.garmentLabel : item.sourceLabel;
                            const isExpanded = expandedItemIds.includes(item.id);

                            return (
                              <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                                <button
                                  type="button"
                                  onClick={() => toggleItemExpanded(item.id)}
                                  className="flex w-full items-start justify-between gap-4 rounded-[var(--app-radius-sm)] px-1 py-1 text-left transition hover:bg-[var(--app-surface-muted)]/18"
                                >
                                  <div className="flex min-w-0 flex-1 items-start gap-2">
                                    <ChevronDown
                                      className={cx(
                                        "mt-0.5 h-4 w-4 shrink-0 text-[var(--app-text-soft)] transition-transform",
                                        isExpanded && "rotate-180",
                                      )}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="app-text-strong">{itemTitle}</div>
                                    </div>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <div className="app-text-strong [font-variant-numeric:tabular-nums]">
                                      {formatCheckoutCurrency(item.amount)}
                                    </div>
                                  </div>
                                </button>

                                {isExpanded ? (
                                  item.kind === "alteration" ? (
                                    serviceRows.length > 0 ? (
                                      <div className="mt-2 space-y-1.5 pl-7">
                                        {serviceRows.map((component) => (
                                          <div key={component.id} className="flex items-start justify-between gap-4">
                                            <div className="app-text-caption leading-relaxed">{component.value}</div>
                                            <div className="app-text-caption shrink-0 [font-variant-numeric:tabular-nums]">
                                              {formatCheckoutCurrency(component.amount ?? 0)}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : null
                                  ) : customRows.length > 0 ? (
                                    <div className="mt-2 space-y-1.5 pl-7">
                                      {customRows.map((row, rowIndex) => (
                                        <div key={`${item.id}-row-${rowIndex}`} className="flex items-start justify-between gap-4">
                                          <div className="app-text-caption uppercase tracking-[0.12em] text-[var(--app-text-soft)]">
                                            {row.label}
                                          </div>
                                          <div className="app-text-caption max-w-[60%] whitespace-pre-line text-right leading-relaxed text-[var(--app-text)]">
                                            {row.value}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="app-text-caption mt-2 whitespace-pre-line leading-relaxed">{group.itemSummary.join(", ")}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Surface>

        <div className="space-y-4">
          <CheckoutSummaryRail
            title="Order totals"
            subtitle={remainingLater > 0 ? "What is due today versus what stays on the order afterward." : "Collected so far and what is still due."}
            totalsItems={totalsItems}
          >
            {dueNow > 0 ? (
              <ActionButton tone="primary" onClick={() => setCheckoutConfirmOpen(true)}>
                <CreditCard className="h-4 w-4" />
                <span>{hasReadyScopesToPickup ? "Take payment for ready pieces" : "Take payment"}</span>
              </ActionButton>
            ) : hasReadyScopesToPickup ? (
              <ActionButton tone="primary" onClick={() => onCompleteOpenOrderPickup(openOrder.id)}>
                Complete pickup
              </ActionButton>
            ) : (
              <ActionButton tone="primary" onClick={() => onEditOpenOrder(openOrder.id)}>
                Edit order
              </ActionButton>
            )}
            <ActionButton tone="secondary" onClick={() => onEditOpenOrder(openOrder.id)}>
              Edit order
            </ActionButton>
            <ActionButton tone="secondary" onClick={() => onScreenChange("openOrders")}>
              Back to orders
            </ActionButton>
            <ActionButton tone="secondary" onClick={() => setCancelConfirmOpen(true)}>
              Cancel order
            </ActionButton>
          </CheckoutSummaryRail>
        </div>
      </div>

      {checkoutConfirmOpen ? (
        <ConfirmCheckoutModal
          openOrder={openOrder}
          amountDue={dueNow}
          onClose={() => setCheckoutConfirmOpen(false)}
          onConfirm={() => {
            setCheckoutConfirmOpen(false);
            onCompleteOpenOrderCheckout(openOrder.id);
          }}
        />
      ) : null}

      {cancelConfirmOpen ? (
        <ConfirmCancelOrderModal
          openOrder={openOrder}
          onClose={() => setCancelConfirmOpen(false)}
          onConfirm={() => {
            setCancelConfirmOpen(false);
            onCancelOpenOrder(openOrder.id);
          }}
        />
      ) : null}
    </div>
  );
}
