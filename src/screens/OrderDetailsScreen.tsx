import { CalendarClock, ChevronDown, ClipboardList, CreditCard, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  CheckoutPaymentMode,
  ClosedOrderDetail,
  Customer,
  OpenOrder,
  OrderBagLineItem,
  OrderTimelineItem,
  OrderWorkflowState,
  Screen,
  StatusTone,
  WorkflowMode,
} from "../types";
import type { AppReferenceData } from "../db";
import { ActionButton, Callout, EmptyState, SectionHeader, StatusPill, Surface, SurfaceHeader, cx } from "../components/ui/primitives";
import {
  formatPickupSchedule,
  getAlterationPickup,
  getCustomOccasion,
  getDraftPaymentPolicy,
  getMixedPaymentAllocation,
  getOpenOrderPickupGroups,
  getOpenOrderTypeLabel,
  getOrderBagLineItems,
  getOrderType,
  getPickupRequired,
  getPricingSummary,
  getRequiredPickupScopes,
  getSummaryGuardrail,
  hasReadyScopesForPickup,
} from "../features/order/selectors";
import {
  formatCheckoutCurrency,
  getDraftPickupSummary,
  getReadyBySummary,
} from "../features/order/checkoutDisplay";
import { getPickupDateTime } from "../features/order/orderDateUtils";
import { CheckoutAcceptedBanner } from "../features/order/components/checkout/CheckoutAcceptedBanner";
import { CheckoutSummaryRail } from "../features/order/components/checkout/CheckoutSummaryRail";
import { ConfirmCancelOrderModal } from "../features/order/modals/ConfirmCancelOrderModal";
import { ConfirmCheckoutModal } from "../features/order/modals/ConfirmCheckoutModal";

type DetailLineItem = OpenOrder["lineItems"][number] | OrderBagLineItem;

type OrderDetailsScreenProps = {
  customers: Customer[];
  referenceData: AppReferenceData;
  openOrder: OpenOrder | null;
  closedOrder: ClosedOrderDetail | null;
  draftOrder: OrderWorkflowState | null;
  payerCustomer: Customer | null;
  showAcceptedConfirmation: boolean;
  showCheckoutCompletion: boolean;
  requestedCheckoutPaymentMode: Exclude<CheckoutPaymentMode, "none"> | null;
  onScreenChange: (screen: Screen) => void;
  onDismissRequestedCheckoutPayment: () => void;
  onRevertAcceptedOrderSave: (openOrderId: number) => void;
  onCompleteOpenOrderCheckout: (openOrderId: number, paymentMode: Exclude<CheckoutPaymentMode, "none">) => void;
  onEditOpenOrder: (openOrderId: number) => void;
  onCancelOpenOrder: (openOrderId: number) => void;
  onCompleteOpenOrderPickup: (openOrderId: number) => void;
  onSaveDraftOrder: (paymentMode: CheckoutPaymentMode, openCheckout?: boolean) => void;
};

type ScopeStatusDisplay = {
  label: string;
  tone: StatusTone;
  detail: string;
};

function getScopeLabel(scope: WorkflowMode) {
  return scope === "alteration" ? "Alterations" : "Custom garments";
}

function getGroupStatusDisplay(
  group: ReturnType<typeof getOpenOrderPickupGroups>[number],
  representativePickup: OpenOrder["pickupSchedules"][number] | null,
): ScopeStatusDisplay {
  if (!representativePickup) {
    return {
      label: "Needs review",
      tone: "warn",
      detail: "Set pickup timing.",
    };
  }

  if (representativePickup.pickedUp) {
    return {
      label: "Picked up",
      tone: "success",
      detail: "Pickup completed.",
    };
  }

  if (representativePickup.readyForPickup) {
    return {
      label: "Ready",
      tone: "success",
      detail: "Ready for pickup.",
    };
  }

  if (group.alertLabel === "Past promised ready time") {
    return {
      label: "Overdue",
      tone: "danger",
      detail: "Past ready time.",
    };
  }

  if (group.alertLabel === "Promised ready within 1 hour") {
    return {
      label: "Due soon",
      tone: "warn",
      detail: "Ready within 1 hour.",
    };
  }

  return {
    label: "In progress",
    tone: "default",
    detail: group.alertLabel,
  };
}

function getDraftScopeStatusDisplay(order: OrderWorkflowState, scope: WorkflowMode): ScopeStatusDisplay {
  const requiredScopes = getRequiredPickupScopes(order);
  if (!requiredScopes.includes(scope)) {
    return {
      label: "No timing needed",
      tone: "default",
      detail: "No pickup timing needed.",
    };
  }

  if (scope === "alteration") {
    const pickup = getAlterationPickup(order);
    const formatted = formatPickupSchedule(pickup.pickupDate, pickup.pickupTime);
    if (formatted) {
      return {
        label: "Scheduled",
        tone: "default",
        detail: `Ready by ${formatted}`,
      };
    }

    return {
      label: "Timing needed",
      tone: "warn",
      detail: "Set pickup timing.",
    };
  }

  const occasion = getCustomOccasion(order);
  if (occasion.eventDate) {
    return {
      label: "Event due",
      tone: "default",
      detail: `Event due ${occasion.eventDate}`,
    };
  }

  return {
    label: "Timing needed",
    tone: "warn",
    detail: "Set event timing.",
  };
}

function getDetailsSubtitle(openOrder: OpenOrder, dueNow: number, remainingLater: number, hasReadyScopesToPickup: boolean) {
  if (hasReadyScopesToPickup && dueNow > 0 && remainingLater > 0) {
    return "Take payment for the ready pieces. The rest stays open.";
  }

  if (hasReadyScopesToPickup && dueNow > 0) {
    return "Take payment for the ready pieces.";
  }

  if (hasReadyScopesToPickup) {
    return "Ready pieces are already paid.";
  }

  if (openOrder.balanceDue > 0) {
    return "Review the order and decide whether to take payment now.";
  }

  return "Review the order before making changes.";
}

function getScopeLineItems(lineItems: DetailLineItem[], scope: WorkflowMode) {
  return lineItems.filter((item) => item.kind === scope);
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

function getCustomItemRows(item: DetailLineItem) {
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

function getCollapsedItemSummary(item: DetailLineItem) {
  if (item.kind === "alteration") {
    return "";
  }

  const wearer = item.components.find((component) => component.kind === "wearer")?.value;
  const measurements = item.components.find((component) => component.kind === "measurement_set")?.value;

  return [wearer, measurements].filter(Boolean).join(" • ");
}

function getOrderReceiptItems({
  order,
}: {
  order: Pick<OpenOrder, "lineItems" | "total" | "orderType" | "totalCollected" | "balanceDue">;
}) {
  const alterationSubtotal = order.lineItems
    .filter((item) => item.kind === "alteration")
    .reduce((sum, item) => sum + item.amount, 0);
  const customSubtotal = order.lineItems
    .filter((item) => item.kind === "custom")
    .reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = Math.max(order.total - alterationSubtotal - customSubtotal, 0);
  const isFullyPaid = order.balanceDue <= 0;
  const mixedAllocation = order.orderType === "mixed" ? getMixedPaymentAllocation(order) : null;
  const customDepositDue = order.orderType === "custom" ? customSubtotal * 0.5 : 0;
  const depositPaid = order.orderType === "mixed"
    ? mixedAllocation?.depositPaid ?? 0
    : order.orderType === "custom"
      ? Math.min(order.totalCollected, customDepositDue)
      : 0;
  const depositDueRemaining = order.orderType === "mixed"
    ? Math.max((mixedAllocation?.depositDue ?? 0) - depositPaid, 0)
    : order.orderType === "custom"
      ? Math.max(customDepositDue - depositPaid, 0)
      : 0;

  return [
    ...(alterationSubtotal > 0 ? [{ label: "Alterations", value: formatCheckoutCurrency(alterationSubtotal) }] : []),
    ...(customSubtotal > 0 ? [{ label: "Custom garments", value: formatCheckoutCurrency(customSubtotal) }] : []),
    ...(taxAmount > 0 ? [{ label: "Tax", value: formatCheckoutCurrency(taxAmount) }] : []),
    { label: "Deposit due", value: formatCheckoutCurrency(depositDueRemaining) },
    { label: "Balance due", value: formatCheckoutCurrency(isFullyPaid ? 0 : order.balanceDue) },
    { label: "Total", value: formatCheckoutCurrency(order.total) },
  ];
}

function getDraftReceiptItems(order: OrderWorkflowState, referenceData: AppReferenceData) {
  const pricing = getPricingSummary(order, {
    pricingBooks: referenceData.customPricingBooks,
    taxRate: referenceData.taxRate,
    customDepositRate: referenceData.customDepositRate,
  });
  const paymentPolicy = getDraftPaymentPolicy(order, {
    pricingBooks: referenceData.customPricingBooks,
    taxRate: referenceData.taxRate,
    customDepositRate: referenceData.customDepositRate,
  });

  return [
    { label: "Alterations", value: formatCheckoutCurrency(pricing.alterationsSubtotal) },
    { label: "Custom garments", value: formatCheckoutCurrency(pricing.customSubtotal) },
    { label: "Tax", value: formatCheckoutCurrency(pricing.taxAmount) },
    {
      label: "Due today",
      value: paymentPolicy.minimumDueNow > 0 ? formatCheckoutCurrency(paymentPolicy.minimumDueNow) : "None",
    },
    ...(paymentPolicy.allowFullPrepay ? [{ label: "Prepay in full", value: formatCheckoutCurrency(paymentPolicy.collectibleNow) }] : []),
    { label: "Total", value: formatCheckoutCurrency(pricing.total) },
  ];
}

function getTimelineTimestamp(occurredAt: OrderTimelineItem["occurredAt"]) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(occurredAt));
}

function getOrderHeaderTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function OrderDetailsScreen({
  customers,
  referenceData,
  openOrder,
  closedOrder,
  draftOrder,
  payerCustomer,
  showAcceptedConfirmation,
  showCheckoutCompletion,
  requestedCheckoutPaymentMode,
  onScreenChange,
  onDismissRequestedCheckoutPayment,
  onRevertAcceptedOrderSave,
  onCompleteOpenOrderCheckout,
  onEditOpenOrder,
  onCancelOpenOrder,
  onCompleteOpenOrderPickup,
  onSaveDraftOrder,
}: OrderDetailsScreenProps) {
  const [checkoutConfirmOpen, setCheckoutConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>([]);
  const [selectedCheckoutPaymentMode, setSelectedCheckoutPaymentMode] = useState<Exclude<CheckoutPaymentMode, "none">>("minimum_due");

  const detailOrder = openOrder ?? closedOrder;
  const isDraftDetail = Boolean(draftOrder && !detailOrder);
  const isClosedDetail = Boolean(closedOrder && !openOrder);
  const activeDraftOrder = isDraftDetail ? draftOrder : null;
  const draftLineItems = useMemo(
    () => (activeDraftOrder ? getOrderBagLineItems(activeDraftOrder, customers, referenceData.customPricingBooks) : []),
    [activeDraftOrder, customers, referenceData.customPricingBooks],
  );
  const draftOrderType = activeDraftOrder ? getOrderType(activeDraftOrder) : null;
  const draftPickupRequired = activeDraftOrder ? getPickupRequired(activeDraftOrder) : false;
  const draftSummaryGuardrail = activeDraftOrder ? getSummaryGuardrail(activeDraftOrder, payerCustomer) : null;
  const draftPaymentPolicy = activeDraftOrder
    ? getDraftPaymentPolicy(activeDraftOrder, {
        pricingBooks: referenceData.customPricingBooks,
        taxRate: referenceData.taxRate,
        customDepositRate: referenceData.customDepositRate,
      })
    : null;
  const draftPickupSummary = activeDraftOrder ? getDraftPickupSummary(activeDraftOrder) : "";
  const draftReadyBySummary = activeDraftOrder ? getReadyBySummary(null, draftPickupSummary) : null;
  const draftShouldCollectNow = Boolean(draftPaymentPolicy && draftPaymentPolicy.minimumDueNow > 0);
  const isDraftAlterationOnly = isDraftDetail && draftOrderType === "alteration";
  const draftCheckoutBlocked = Boolean(
    activeDraftOrder
    && (
      draftOrderType === null
      || draftSummaryGuardrail?.missingCustomer
      || draftSummaryGuardrail?.missingPickup
      || draftSummaryGuardrail?.customIncomplete
    ),
  );
  const activeLineItems = detailOrder ? detailOrder.lineItems : draftLineItems;
  const checkoutCustomer = useMemo(
    () => {
      if (detailOrder) {
        return customers.find((customer) => customer.id === detailOrder.payerCustomerId) ?? null;
      }

      return payerCustomer;
    },
    [customers, detailOrder, payerCustomer],
  );

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItemIds((current) => (
      current.includes(itemId)
        ? current.filter((candidate) => candidate !== itemId)
        : [...current, itemId]
    ));
  };

  useEffect(() => {
    if (!openOrder || !showAcceptedConfirmation || !requestedCheckoutPaymentMode) {
      return;
    }

    setSelectedCheckoutPaymentMode(requestedCheckoutPaymentMode);
    setCheckoutConfirmOpen(true);
  }, [openOrder, requestedCheckoutPaymentMode, showAcceptedConfirmation]);

  if (!detailOrder && !activeDraftOrder) {
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

  if (isDraftDetail && activeLineItems.length === 0) {
    return (
      <div className="space-y-4">
        <SectionHeader
          icon={ClipboardList}
          title="Order details"
          subtitle="Add at least one order item before reviewing the draft."
          action={(
            <ActionButton tone="secondary" className="px-3 py-2 text-xs" onClick={() => onScreenChange("order")}>
              Back to order builder
            </ActionButton>
          )}
        />
        <Surface tone="work" className="px-4 py-5">
          <EmptyState className="rounded-[var(--app-radius-md)] border-dashed bg-[var(--app-surface-muted)]/35 px-5 py-5 shadow-none">
            Add order items in the builder before opening the draft details view.
          </EmptyState>
        </Surface>
      </div>
    );
  }

  const hasReadyScopesToPickup = detailOrder ? hasReadyScopesForPickup(detailOrder) : false;
  const mixedAllocation = detailOrder && detailOrder.orderType === "mixed" && !hasReadyScopesToPickup
    ? getMixedPaymentAllocation(detailOrder)
    : null;
  const dueNow = detailOrder
    ? detailOrder.paymentDueNow
    : draftPaymentPolicy?.minimumDueNow ?? 0;
  const remainingLater = detailOrder
    ? (dueNow < detailOrder.balanceDue ? detailOrder.balanceDue - dueNow : 0)
    : Math.max((draftPaymentPolicy?.collectibleNow ?? 0) - dueNow, 0);
  const displayAmountNow = detailOrder
    ? (detailOrder.balanceDue > 0 && dueNow <= 0 ? detailOrder.balanceDue : dueNow)
    : dueNow;
  const checkoutSubtitle = isClosedDetail
    ? "Review the final receipt and lifecycle history for this closed order."
    : isDraftDetail
      ? draftShouldCollectNow
        ? "Review the order, save it, and decide whether to take payment now."
        : "Review the order and save it when everything looks right."
      : getDetailsSubtitle(openOrder!, dueNow, remainingLater, hasReadyScopesToPickup);
  const pickupGroups = detailOrder ? getOpenOrderPickupGroups(detailOrder, {
    includePickedUp: isClosedDetail || detailOrder.orderType === "mixed",
  }) : [];
  const draftScopeCards = activeDraftOrder
    ? (["alteration", "custom"] as const)
      .map((scope) => {
        const lineItems = getScopeLineItems(draftLineItems, scope);
        if (!lineItems.length) {
          return null;
        }

        return {
          key: scope,
          scope,
          lineItems,
          statusDisplay: getDraftScopeStatusDisplay(activeDraftOrder, scope),
          amount: lineItems.reduce((sum, item) => sum + item.amount, 0),
        };
      })
      .filter((group): group is NonNullable<typeof group> => Boolean(group))
    : [];
  const totalsItems = detailOrder
    ? getOrderReceiptItems({ order: detailOrder })
    : getDraftReceiptItems(activeDraftOrder!, referenceData);
  const receiptChargeRowCount = detailOrder
    ? [
        detailOrder.lineItems.some((item) => item.kind === "alteration"),
        detailOrder.lineItems.some((item) => item.kind === "custom"),
      ].filter(Boolean).length
    : 3;
  const timeline = detailOrder?.timeline ?? [];
  const headerSubtitle = detailOrder
    ? [
        getOpenOrderTypeLabel(detailOrder.orderType),
        `Created ${getOrderHeaderTimestamp(detailOrder.createdAt)}`,
        isClosedDetail && closedOrder?.closedAt ? `Closed ${getOrderHeaderTimestamp(closedOrder.closedAt)}` : null,
      ].filter(Boolean).join(" • ")
    : [draftOrderType ? getOpenOrderTypeLabel(draftOrderType) : "Draft order", "Not yet saved"].join(" • ");
  const orderStatusPill = isDraftDetail
    ? null
    : isClosedDetail ? (
      <StatusPill tone={closedOrder!.status === "Canceled" ? "danger" : "success"}>{closedOrder!.status}</StatusPill>
    ) : detailOrder!.balanceDue > 0 ? (
      <StatusPill tone="warn">Balance due</StatusPill>
    ) : (
      <StatusPill tone="success">Paid</StatusPill>
    );
  const overviewTitle = isDraftDetail ? "Ready by" : "Order status";
  const overviewHeadline = isDraftDetail
    ? (
      draftPickupRequired
        ? draftReadyBySummary?.headline || "Timing needed"
        : "No pickup timing needed"
    )
    : null;
  const overviewDetail = isDraftDetail
    ? (
      draftPickupRequired
        ? draftReadyBySummary?.detail || ""
        : "This draft does not need pickup scheduling."
    )
    : null;
  const backButtonLabel = isDraftDetail ? "Back to order builder" : "Back to orders";
  const headerTitle = detailOrder ? `Order #${detailOrder.id}` : "Draft order";

  return (
    <div className="space-y-4 app-order-details-screen">
      <SectionHeader
        icon={ClipboardList}
        title="Order details"
        subtitle={checkoutSubtitle}
        action={(
          <ActionButton
            tone="secondary"
            className="app-order-details-screen__back-button px-3 py-2 text-xs"
            onClick={() => onScreenChange(isDraftDetail ? "order" : "openOrders")}
          >
            <span className="app-hide-at-desktop">Back</span>
            <span className="app-desktop-only">{backButtonLabel}</span>
          </ActionButton>
        )}
      />

      <div className="app-page-with-support-rail app-review-layout">
        <Surface tone="work" className="overflow-hidden app-order-details-screen__main">
          <div className="px-3.5 py-3 md:px-4 md:py-4 app-order-details-screen__hero-shell">
            <SurfaceHeader
              className="app-detail-hero app-order-details-screen__hero"
              title={headerTitle}
              subtitle={headerSubtitle}
              meta={(
                <div className="app-detail-hero__meta app-order-details-screen__hero-meta text-left md:text-right">
                  <div className="app-order-details-screen__hero-topline">
                    <div className="app-text-overline">
                      {isClosedDetail
                        ? closedOrder!.status
                        : isDraftDetail
                          ? draftShouldCollectNow
                            ? "Due today"
                            : "No payment due"
                          : hasReadyScopesToPickup && dueNow > 0
                            ? "Due today"
                            : detailOrder!.balanceDue <= 0
                              ? "No balance due"
                              : dueNow <= 0 && detailOrder!.balanceDue > 0
                                ? "Open balance"
                                : "Balance due"}
                    </div>
                    {!isDraftDetail ? <div className="app-hide-at-desktop">{orderStatusPill}</div> : null}
                  </div>
                  <div className="mt-1 text-[1.9rem] font-semibold leading-none tracking-[-0.025em] [font-variant-numeric:tabular-nums] text-[var(--app-text)] app-order-details-screen__hero-amount">
                    {isDraftDetail
                      ? (draftShouldCollectNow ? formatCheckoutCurrency(displayAmountNow) : "None due")
                      : displayAmountNow > 0
                        ? formatCheckoutCurrency(displayAmountNow)
                        : "Paid"}
                  </div>
                </div>
              )}
            />
          </div>

          {!isDraftDetail && !isClosedDetail && showAcceptedConfirmation ? (
            <CheckoutAcceptedBanner
              openOrderId={openOrder!.id}
              payerName={openOrder!.payerName}
              balanceDue={openOrder!.balanceDue}
              acceptedOrderNeedsPayment={openOrder!.balanceDue > 0}
            />
          ) : null}

          {!isDraftDetail && !isClosedDetail && hasReadyScopesToPickup && dueNow > 0 && remainingLater > 0 ? (
            <div className="border-t border-[var(--app-border)]/45 px-3.5 py-3 md:px-4 md:py-4">
              <Callout tone="warn" title="Only the ready pieces are due today">
                Charge {formatCheckoutCurrency(dueNow)} today. The remaining {formatCheckoutCurrency(remainingLater)} stays with the work still in progress.
              </Callout>
            </div>
          ) : null}

          <div className="border-t border-[var(--app-border)]/45 px-3.5 py-3 md:px-4 md:py-4 app-order-details-screen__overview-shell">
            <div className="app-order-details-overview">
              <div className="min-w-0 app-order-details-overview__customer">
                <div className="app-text-overline">Customer</div>
                <div className="mt-2 app-order-details-overview__customer-name">
                  {detailOrder?.payerName ?? checkoutCustomer?.name ?? "Customer required"}
                </div>
                <div className="mt-2 space-y-1.5 app-order-details-overview__customer-meta">
                  {checkoutCustomer?.phone ? <div className="app-text-caption">{checkoutCustomer.phone}</div> : null}
                  {checkoutCustomer?.email ? <div className="app-text-caption">{checkoutCustomer.email}</div> : null}
                  {checkoutCustomer?.address ? <div className="app-text-caption whitespace-pre-line">{checkoutCustomer.address}</div> : null}
                  {detailOrder?.payerCustomerId === null ? <div className="app-text-caption">Walk-in customer</div> : null}
                </div>
              </div>
              <div className="min-w-0 app-order-details-overview__status app-order-details-overview__status--flat app-desktop-only">
                <div className="app-text-overline">{overviewTitle}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {isDraftDetail ? (
                    <div className="app-text-strong whitespace-pre-line">{overviewHeadline}</div>
                  ) : (
                    orderStatusPill
                  )}
                </div>
                {isDraftDetail && overviewDetail ? (
                  <div className="app-text-caption mt-1 whitespace-pre-line leading-relaxed">{overviewDetail}</div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--app-border)]/45 px-3.5 py-3 md:px-4 md:py-4">
            <div className="app-order-details-section-heading">
              <div className="app-text-overline">Order items</div>
            </div>
            <div className="mt-3 space-y-2.5">
              {isDraftDetail
                ? draftScopeCards.map((group, index) => (
                    <div
                      key={group.key}
                      className={cx(
                        "rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)] px-3.5 py-2.5 md:px-4 md:py-3 app-order-details-scope",
                        index > 0 && "mt-3",
                      )}
                    >
                      <div className="app-order-details-scope__header">
                        <div className="min-w-0 flex-1">
                          <div className="app-order-details-scope__title-row">
                            <div className="app-text-strong">{getScopeLabel(group.scope)}</div>
                            <StatusPill tone={group.statusDisplay.tone}>{group.statusDisplay.label}</StatusPill>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.82rem] text-[var(--app-text-soft)] app-order-details-scope__meta">
                            <div className="inline-flex items-center gap-1.5">
                              <CalendarClock className="h-3.5 w-3.5" />
                              <span>{group.statusDisplay.detail}</span>
                            </div>
                            <div className="app-text-caption text-[var(--app-text-soft)]">
                              {group.lineItems.length} {group.lineItems.length === 1 ? "item" : "items"}
                            </div>
                          </div>
                        </div>
                        <div className="text-left md:text-right app-order-details-scope__total">
                          <div className="app-text-overline">Subtotal</div>
                          <div className="mt-1 app-text-body font-semibold [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
                            {formatCheckoutCurrency(group.amount)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-[var(--app-border)]/35 pt-3 app-order-details-scope__items">
                        <div className="divide-y divide-[var(--app-border)]/25 app-order-details-scope__item-list">
                          {group.lineItems.map((item) => {
                            const serviceRows = item.components.filter((component) => component.kind === "alteration_service");
                            const customRows = getCustomItemRows(item);
                            const itemTitle = item.kind === "alteration" ? item.garmentLabel : item.sourceLabel;
                            const collapsedSummary = getCollapsedItemSummary(item);
                            const isExpanded = expandedItemIds.includes(item.id);

                            return (
                              <div key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                                <button
                                  type="button"
                                  onClick={() => toggleItemExpanded(item.id)}
                                  className={cx(
                                    "flex w-full items-start justify-between gap-4 rounded-[var(--app-radius-sm)] px-1 py-1.5 text-left transition hover:bg-[var(--app-surface)]/65 app-order-details-item-toggle",
                                    isExpanded && "bg-[var(--app-surface)]/80",
                                  )}
                                >
                                  <div className="flex min-w-0 flex-1 items-start gap-2">
                                    <ChevronDown
                                      className={cx(
                                        "mt-0.5 h-4 w-4 shrink-0 text-[var(--app-text-soft)] transition-transform",
                                        isExpanded && "rotate-180",
                                      )}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <div className="app-text-strong">{itemTitle}</div>
                                        {item.isRush ? <StatusPill tone="danger">Rush</StatusPill> : null}
                                      </div>
                                      {collapsedSummary ? (
                                        <div className="app-text-caption mt-1 truncate pr-4">
                                          {collapsedSummary}
                                        </div>
                                      ) : null}
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
                                      <div className="mt-2 space-y-1.5 border-l-2 border-[var(--app-border)]/55 pl-5">
                                        {serviceRows.map((component) => (
                                          <div key={component.id} className="flex items-start justify-between gap-4">
                                            <div className="app-text-body-muted leading-relaxed">{component.value}</div>
                                            <div className="app-text-body-muted shrink-0 [font-variant-numeric:tabular-nums]">
                                              {formatCheckoutCurrency(component.amount ?? 0)}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : null
                                  ) : customRows.length > 0 ? (
                                    <div className="mt-2 space-y-2 border-l-2 border-[var(--app-border)]/55 pl-5">
                                      {customRows.map((row, rowIndex) => (
                                        <div key={`${item.id}-row-${rowIndex}`} className="flex items-start justify-between gap-4">
                                          <div className="app-text-body-muted">{row.label}</div>
                                          <div className="app-text-body-muted max-w-[58%] whitespace-pre-line text-right leading-relaxed text-[var(--app-text)]">
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
                      </div>
                    </div>
                  ))
                : pickupGroups.map((group, index) => {
                    const representativePickup = detailOrder!.pickupSchedules.find((pickup) => pickup.id === group.pickupIds[0]) ?? null;
                    const statusDisplay = getGroupStatusDisplay(group, representativePickup);
                    const scopeLineItems = getScopeLineItems(detailOrder!.lineItems, group.scope);
                    const scopeAmount = scopeLineItems.reduce((sum, item) => sum + item.amount, 0);
                    const readyByLabel = formatScopeReadyBy(representativePickup);
                    const readyByDisplay = readyByLabel === "Timing needed" || readyByLabel.startsWith("Event due")
                      ? readyByLabel
                      : `Ready by ${readyByLabel}`;

                    return (
                      <div
                        key={group.key}
                        className={cx(
                          "rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)] px-3.5 py-2.5 md:px-4 md:py-3 app-order-details-scope",
                          index > 0 && "mt-3",
                        )}
                      >
                        <div className="app-order-details-scope__header">
                          <div className="min-w-0 flex-1">
                            <div className="app-order-details-scope__title-row">
                              <div className="app-text-strong">{getScopeLabel(group.scope)}</div>
                              <StatusPill tone={statusDisplay.tone}>{statusDisplay.label}</StatusPill>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.82rem] text-[var(--app-text-soft)] app-order-details-scope__meta">
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
                              <div className="app-text-caption text-[var(--app-text-soft)]">
                                {scopeLineItems.length} {scopeLineItems.length === 1 ? "item" : "items"}
                              </div>
                            </div>
                          </div>
                          <div className="text-left md:text-right app-order-details-scope__total">
                            <div className="app-text-overline">Subtotal</div>
                            <div className="mt-1 app-text-body font-semibold [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
                              {formatCheckoutCurrency(scopeAmount)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-[var(--app-border)]/35 pt-3 app-order-details-scope__items">
                          {scopeLineItems.length > 0 ? (
                            <div className="divide-y divide-[var(--app-border)]/25 app-order-details-scope__item-list">
                              {scopeLineItems.map((item) => {
                                const serviceRows = item.components.filter((component) => component.kind === "alteration_service");
                                const customRows = getCustomItemRows(item);
                                const itemTitle = item.kind === "alteration" ? item.garmentLabel : item.sourceLabel;
                                const collapsedSummary = getCollapsedItemSummary(item);
                                const isExpanded = expandedItemIds.includes(item.id);

                                return (
                                  <div key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                                    <button
                                      type="button"
                                      onClick={() => toggleItemExpanded(item.id)}
                                      className={cx(
                                        "flex w-full items-start justify-between gap-4 rounded-[var(--app-radius-sm)] px-1 py-1.5 text-left transition hover:bg-[var(--app-surface)]/65 app-order-details-item-toggle",
                                        isExpanded && "bg-[var(--app-surface)]/80",
                                      )}
                                    >
                                      <div className="flex min-w-0 flex-1 items-start gap-2">
                                        <ChevronDown
                                          className={cx(
                                            "mt-0.5 h-4 w-4 shrink-0 text-[var(--app-text-soft)] transition-transform",
                                            isExpanded && "rotate-180",
                                          )}
                                        />
                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <div className="app-text-strong">{itemTitle}</div>
                                            {item.isRush ? <StatusPill tone="danger">Rush</StatusPill> : null}
                                          </div>
                                          {collapsedSummary ? (
                                            <div className="app-text-caption mt-1 truncate pr-4">
                                              {collapsedSummary}
                                            </div>
                                          ) : null}
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
                                          <div className="mt-2 space-y-1.5 border-l-2 border-[var(--app-border)]/55 pl-5">
                                            {serviceRows.map((component) => (
                                              <div key={component.id} className="flex items-start justify-between gap-4">
                                                <div className="app-text-body-muted leading-relaxed">{component.value}</div>
                                                <div className="app-text-body-muted shrink-0 [font-variant-numeric:tabular-nums]">
                                                  {formatCheckoutCurrency(component.amount ?? 0)}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : null
                                      ) : customRows.length > 0 ? (
                                        <div className="mt-2 space-y-2 border-l-2 border-[var(--app-border)]/55 pl-5">
                                          {customRows.map((row, rowIndex) => (
                                            <div key={`${item.id}-row-${rowIndex}`} className="flex items-start justify-between gap-4">
                                              <div className="app-text-body-muted">{row.label}</div>
                                              <div className="app-text-body-muted max-w-[58%] whitespace-pre-line text-right leading-relaxed text-[var(--app-text)]">
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

        <div className="space-y-4 app-order-details-screen__support">
          <CheckoutSummaryRail
            title="Order receipt"
            subtitle=""
            totalsItems={totalsItems}
            summarySplitIndex={receiptChargeRowCount}
            summarySplitLabel="Payment summary"
            actionsLabel={isClosedDetail ? "Archive view" : isDraftDetail ? "Save order" : "Order actions"}
          >
            {isClosedDetail ? (
              <div className="app-text-caption leading-relaxed text-[var(--app-text-soft)]">
                Closed orders are read-only. Use this view to confirm the final receipt, pickup details, and lifecycle history.
              </div>
            ) : null}

            {isDraftDetail ? (
              <>
                {draftCheckoutBlocked ? (
                  <div className="app-text-caption leading-relaxed text-[var(--app-text-soft)]">
                    {draftOrderType === null
                      ? "Add at least one item before saving this order."
                      : draftSummaryGuardrail?.missingCustomer
                        ? "Choose the paying customer before saving the draft."
                        : draftSummaryGuardrail?.missingPickup
                          ? "Finish the pickup timing before saving the draft."
                          : "Finish the custom garment setup before saving the draft."}
                  </div>
                ) : null}
                <ActionButton tone="secondary" onClick={() => onScreenChange("order")}>
                  Edit order
                </ActionButton>
                {isDraftAlterationOnly ? (
                  <>
                    <ActionButton tone="primary" disabled={draftCheckoutBlocked} onClick={() => onSaveDraftOrder("none", true)}>
                      Save order
                    </ActionButton>
                    <ActionButton tone="secondary" disabled={draftCheckoutBlocked} onClick={() => onSaveDraftOrder("full_balance", true)}>
                      Save order and pay in full
                    </ActionButton>
                  </>
                ) : (
                  <>
                    <ActionButton tone="primary" disabled={draftCheckoutBlocked} onClick={() => onSaveDraftOrder("minimum_due", true)}>
                      {draftOrderType === "custom" || draftOrderType === "mixed"
                        ? "Save order and take deposit"
                        : "Save order and take required payment"}
                    </ActionButton>
                    {draftOrderType === "mixed" ? (
                      <ActionButton tone="secondary" disabled={draftCheckoutBlocked} onClick={() => onSaveDraftOrder("deposit_and_alterations", true)}>
                        Save order and prepay alterations
                      </ActionButton>
                    ) : null}
                    {draftPaymentPolicy?.allowFullPrepay ? (
                      <ActionButton tone="secondary" disabled={draftCheckoutBlocked} onClick={() => onSaveDraftOrder("full_balance", true)}>
                        Save order and pay in full
                      </ActionButton>
                    ) : null}
                  </>
                )}
              </>
            ) : !isClosedDetail ? (
              <>
                {detailOrder!.balanceDue > 0 ? (
                  <ActionButton
                    tone="primary"
                    onClick={() => {
                      setSelectedCheckoutPaymentMode(detailOrder!.paymentDueNow <= 0 ? "full_balance" : "minimum_due");
                      setCheckoutConfirmOpen(true);
                    }}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Take payment</span>
                  </ActionButton>
                ) : hasReadyScopesToPickup ? (
                  <ActionButton tone="primary" onClick={() => onCompleteOpenOrderPickup(openOrder!.id)}>
                    Complete pickup
                  </ActionButton>
                ) : (
                  <ActionButton tone="primary" onClick={() => onEditOpenOrder(openOrder!.id)}>
                    Edit order
                  </ActionButton>
                )}
                {(detailOrder!.balanceDue > 0 || hasReadyScopesToPickup) ? (
                  <ActionButton tone="secondary" onClick={() => onEditOpenOrder(openOrder!.id)}>
                    Edit order
                  </ActionButton>
                ) : null}
                <ActionButton tone="secondary" onClick={() => onScreenChange("openOrders")}>
                  Back to orders
                </ActionButton>
                <ActionButton tone="secondary" onClick={() => setCancelConfirmOpen(true)}>
                  Cancel order
                </ActionButton>
              </>
            ) : (
              <ActionButton tone="secondary" onClick={() => onScreenChange("openOrders")}>
                Back to orders
              </ActionButton>
            )}
          </CheckoutSummaryRail>

          {!isDraftDetail ? (
            <div className="border-t border-[var(--app-border)]/35 pt-3 app-order-details-screen__history">
              <div className="space-y-2.5 px-1">
                <div className="app-text-overline text-[var(--app-text-soft)]">Order history</div>
                {timeline.length ? (
                  <div className="relative space-y-3 pl-5 before:absolute before:bottom-1 before:left-[0.34rem] before:top-1 before:w-px before:bg-[var(--app-border)]/35 before:content-['']">
                    {timeline.map((item) => (
                      <div key={item.id} className="relative">
                        <div className="absolute left-[-1.08rem] top-1.5 h-2 w-2 rounded-full border border-[var(--app-border)]/55 bg-[var(--app-surface)]" />
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="app-text-body text-[var(--app-text)]">{item.label}</div>
                            <div className="app-text-caption mt-0.5 break-words leading-relaxed text-[var(--app-text-soft)]">
                              {getTimelineTimestamp(item.occurredAt)}
                            </div>
                          </div>
                          {typeof item.amount === "number" ? (
                            <div className="shrink-0 text-right">
                              <div className="app-text-body [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
                                {formatCheckoutCurrency(item.amount)}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="app-text-caption leading-relaxed text-[var(--app-text-soft)]">
                    No order history recorded yet.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {!isClosedDetail && !isDraftDetail && checkoutConfirmOpen && openOrder ? (
        <ConfirmCheckoutModal
          openOrder={openOrder}
          minimumAmountDue={dueNow}
          depositAndAlterationAmount={mixedAllocation
            ? Math.max(mixedAllocation.depositDue - mixedAllocation.depositPaid, 0) + Math.max(mixedAllocation.alterationDue - mixedAllocation.alterationPaid, 0)
            : dueNow}
          fullAmountDue={openOrder.balanceDue}
          selectedPaymentMode={selectedCheckoutPaymentMode}
          lockPaymentMode={Boolean(requestedCheckoutPaymentMode)}
          onClose={() => {
            setCheckoutConfirmOpen(false);
            if (requestedCheckoutPaymentMode && showAcceptedConfirmation) {
              onRevertAcceptedOrderSave(openOrder.id);
              return;
            }
            onDismissRequestedCheckoutPayment();
          }}
          onConfirm={(paymentMode) => {
            setCheckoutConfirmOpen(false);
            onDismissRequestedCheckoutPayment();
            onCompleteOpenOrderCheckout(openOrder.id, paymentMode);
          }}
        />
      ) : null}

      {!isClosedDetail && !isDraftDetail && cancelConfirmOpen && openOrder ? (
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
