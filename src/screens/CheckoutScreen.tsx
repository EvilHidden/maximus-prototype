import { CheckCircle2, ClipboardList, CreditCard } from "lucide-react";
import type { Customer, OpenOrder, OrderWorkflowState, Screen } from "../types";
import { ActionButton, DefinitionList, EmptyState, SectionHeader, Surface, SurfaceHeader, cx } from "../components/ui/primitives";
import {
  formatPickupSchedule,
  getCheckoutCollectionAmount,
  getOrderBagLineItems,
  getOrderType,
  getPickupRequired,
  getPickupScheduleForScope,
  getPricingSummary,
  getRequiredPickupScopes,
  getSummaryGuardrail,
} from "../features/order/selectors";
import { getPickupDateTime } from "../features/order/orderDateUtils";

type CheckoutScreenProps = {
  customers: Customer[];
  payerCustomer: Customer | null;
  openOrder: OpenOrder | null;
  showAcceptedConfirmation: boolean;
  order: OrderWorkflowState;
  onScreenChange: (screen: Screen) => void;
  onSaveDraftOrder: (paymentStatus: "due_later" | "ready_to_collect", openCheckout?: boolean) => void;
  onStartOpenOrderWork: (openOrderId: number) => void;
  onStartOpenOrderPayment: (openOrderId: number) => void;
  onCaptureOpenOrderPayment: (openOrderId: number) => void;
  onEditOpenOrder: (openOrderId: number) => void;
  onCancelOpenOrder: (openOrderId: number) => void;
  onCompleteOpenOrderPickup: (openOrderId: number) => void;
};

function getDraftPickupSummary(order: OrderWorkflowState) {
  const requiredPickupScopes = getRequiredPickupScopes(order);

  return requiredPickupScopes
    .map((scope) => {
      const schedule = getPickupScheduleForScope(order, scope);
      const scopeLabel = scope === "alteration" ? "Alterations" : "Custom garments";
      const formatted = formatPickupSchedule(schedule.pickupDate, schedule.pickupTime);

      if (formatted) {
        return `${scopeLabel}: ${formatted}`;
      }

      if (scope === "custom" && schedule.eventDate) {
        return `${scopeLabel}: Event due ${schedule.eventDate}`;
      }

      return `${scopeLabel}: Timing needed`;
    })
    .join(requiredPickupScopes.length > 1 ? "\n" : "");
}

function getSavedPickupSummary(openOrder: OpenOrder) {
  return openOrder.pickupSchedules
    .map((pickup) => {
      const scopeLabel = pickup.scope === "alteration" ? "Alterations" : "Custom garments";
      const formatted = formatPickupSchedule(pickup.pickupDate, pickup.pickupTime);

      if (formatted) {
        return `${scopeLabel}: ${formatted}`;
      }

      if (pickup.scope === "custom" && pickup.eventDate) {
        return `${scopeLabel}: Event due ${pickup.eventDate}`;
      }

      return `${scopeLabel}: Timing needed`;
    })
    .join(openOrder.pickupSchedules.length > 1 ? "\n" : "");
}

function formatCheckoutCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompactReadyBy(dateValue: string, timeValue: string) {
  const pickupDateTime = getPickupDateTime(dateValue, timeValue);
  if (!pickupDateTime) {
    return null;
  }

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(pickupDateTime);
  return dateLabel;
}

function getReadyBySummary(openOrder: OpenOrder | null, pickupSummary: string) {
  const pickupLines = pickupSummary.split("\n").filter(Boolean);

  if (!openOrder) {
    return {
      headline: pickupLines[0] ?? "",
      detail: pickupLines.slice(1).join("\n"),
    };
  }

  const compactEntries = openOrder.pickupSchedules
    .map((pickup) => ({
      scopeLabel: pickup.scope === "alteration" ? "Alterations" : "Custom garments",
      value: formatCompactReadyBy(pickup.pickupDate, pickup.pickupTime),
    }))
    .filter((entry): entry is { scopeLabel: string; value: string } => Boolean(entry.value));

  if (!compactEntries.length) {
    return {
      headline: pickupLines[0] ?? "",
      detail: pickupLines.slice(1).join("\n"),
    };
  }

  const uniqueTimes = [...new Set(compactEntries.map((entry) => entry.value))];
  if (uniqueTimes.length === 1) {
    const scopeSummary = compactEntries.map((entry) => entry.scopeLabel).join(" + ");
    return {
      headline: uniqueTimes[0],
      detail: scopeSummary,
    };
  }

  return {
    headline: "Multiple ready dates",
    detail: compactEntries.map((entry) => `${entry.scopeLabel}: ${entry.value}`).join("\n"),
  };
}

function toSentenceCase(value: string) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getCheckoutDisplayLineItem(item: OpenOrder["lineItems"][number]) {
  if (item.kind === "alteration") {
    const detail = item.components
      .filter((component) => component.kind === "alteration_service")
      .map((component) => toSentenceCase(component.value))
      .join(", ");

    return {
      title: `Alteration - ${item.garmentLabel}`,
      subtitle: detail ? toSentenceCase(detail) : "",
    };
  }

  const primaryDetail = item.components
    .filter((component) => component.kind === "wearer" || component.kind === "measurement_set")
    .map((component) => component.value)
    .join(" • ");
  const optionDetail = item.components
    .filter((component) => component.kind !== "wearer" && component.kind !== "measurement_set")
    .map((component) => `${component.label} ${component.value}`)
    .join(" • ");

  return {
    title: `Custom garment - ${item.garmentLabel}`,
    subtitle: [primaryDetail, optionDetail].filter(Boolean).join("\n"),
  };
}

export function CheckoutScreen({
  customers,
  payerCustomer,
  openOrder,
  showAcceptedConfirmation,
  order,
  onScreenChange,
  onSaveDraftOrder,
  onStartOpenOrderWork,
  onStartOpenOrderPayment,
  onCaptureOpenOrderPayment,
  onEditOpenOrder,
  onCancelOpenOrder,
  onCompleteOpenOrderPickup,
}: CheckoutScreenProps) {
  const orderType = getOrderType(order);
  const hasCustom = orderType === "custom" || orderType === "mixed";
  const pickupRequired = getPickupRequired(order);
  const summaryGuardrail = getSummaryGuardrail(order, payerCustomer);
  const draftLineItems = getOrderBagLineItems(order, []);
  const pricing = getPricingSummary(order);
  const checkoutCollectionAmount = getCheckoutCollectionAmount(order);
  const isDraftAlterationOnly = !openOrder && orderType === "alteration";
  const isAcceptedOpenOrder = openOrder?.operationalStatus === "accepted";
  const draftShouldCollectNow = hasCustom;
  const checkoutBlocked = orderType === null || summaryGuardrail.missingCustomer || summaryGuardrail.missingPickup || summaryGuardrail.customIncomplete;
  const pickupSummary = openOrder ? getSavedPickupSummary(openOrder) : getDraftPickupSummary(order);
  const activeLineItems = openOrder ? openOrder.lineItems : draftLineItems;
  const isEmptyDraftCheckout = !openOrder && activeLineItems.length === 0;
  const checkoutCustomer = openOrder
    ? customers.find((customer) => customer.id === openOrder.payerCustomerId) ?? null
    : payerCustomer;
  const readyBySummary = getReadyBySummary(openOrder, pickupSummary);
  const allPickupScopesReady = Boolean(openOrder?.pickupSchedules.length) && openOrder.pickupSchedules.every((pickup) => pickup.readyForPickup);
  const acceptedOrderNeedsPayment = Boolean(openOrder && isAcceptedOpenOrder && openOrder.balanceDue > 0);

  if (isEmptyDraftCheckout) {
    return (
      <div className="space-y-4">
        <SectionHeader
          icon={CreditCard}
          title="Checkout"
          subtitle="Start an order first, then come back here to finish checkout."
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Surface tone="work" className="overflow-hidden">
            <div className="px-4 py-4">
              <div className="app-text-overline">Checkout</div>
              <div className="mt-1 app-text-value">No order in progress</div>
              <div className="app-text-caption mt-1 max-w-[36rem]">
                Checkout becomes available after you start an order, add the work, and set the promised-ready details.
              </div>
            </div>

            <div className="border-t border-[var(--app-border)]/45 px-4 py-8">
              <EmptyState className="rounded-[var(--app-radius-md)] border-dashed bg-[var(--app-surface-muted)]/25 px-6 py-8 shadow-none">
                <div className="flex items-start gap-3">
                  <div className="app-icon-chip">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="app-text-overline">Nothing to check out yet</div>
                    <div className="app-text-body mt-2">
                      Start a new order to add the customer, the work, and the pickup timing.
                    </div>
                  </div>
                </div>
              </EmptyState>
            </div>
          </Surface>

          <div className="space-y-4">
            <Surface tone="support" className="p-4">
              <SurfaceHeader
                title="Next step"
                subtitle="Start a new order to continue."
              />

              <div className="mt-4 border-t border-[var(--app-border)]/45 pt-4">
                <ActionButton tone="primary" onClick={() => onScreenChange("order")}>
                  New order
                </ActionButton>
              </div>
            </Surface>
          </div>
        </div>
      </div>
    );
  }

  const checkoutSubtitle = openOrder
    ? openOrder.paymentStatus === "pending"
      ? "Finish collecting payment for this order."
      : isAcceptedOpenOrder
        ? showAcceptedConfirmation
          ? acceptedOrderNeedsPayment
            ? "The order is in and payment can wait until later."
            : "The order is in and payment has already been collected."
          : acceptedOrderNeedsPayment
            ? "This order has been accepted and is waiting for work to begin."
            : "This order has been accepted and is ready for work to begin."
        : openOrder.balanceDue > 0
          ? openOrder.totalCollected > 0
            ? "Deposit recorded. Collect the remaining balance when the customer checks out."
            : "Review the order and collect payment."
          : "This order is prepaid and ready to close out."
    : isDraftAlterationOnly
      ? "Review the order and send it through."
      : draftShouldCollectNow
        ? "Review the order, send it through, and collect payment."
        : "Review the order and send it through.";

  const pageMeta = openOrder ? (
    <div className="text-right">
      <div className="app-text-overline">
        {isAcceptedOpenOrder
          ? acceptedOrderNeedsPayment
            ? "Still due"
            : "Paid"
          : "Balance due"}
      </div>
      <div className="mt-1 text-[1.9rem] font-semibold leading-none tracking-[-0.025em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
        {openOrder.balanceDue > 0 ? formatCheckoutCurrency(openOrder.balanceDue) : "Prepaid"}
      </div>
      <div className="app-text-caption mt-1">
        {openOrder.balanceDue > 0
          ? isAcceptedOpenOrder
            ? "Collect later or at pickup"
            : "Still due at checkout"
          : "No balance due"}
      </div>
      {openOrder.totalCollected > 0 && openOrder.balanceDue > 0 ? (
        <div className="mt-2 text-[0.68rem] uppercase tracking-[0.14em] text-[var(--app-text-soft)]">
          Collected {formatCheckoutCurrency(openOrder.totalCollected)}
        </div>
      ) : null}
    </div>
  ) : (
    <div className="text-right">
      <div className="app-text-overline">{draftShouldCollectNow ? "Due today" : "Payment today"}</div>
      <div className="mt-1 text-[1.65rem] font-semibold leading-none tracking-[-0.02em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
        {draftShouldCollectNow ? formatCheckoutCurrency(checkoutCollectionAmount) : "None due"}
      </div>
      <div className="app-text-caption mt-1">
        {checkoutBlocked ? "Order still needs setup before save." : "Order is ready to send through."}
      </div>
    </div>
  );

  const totalsItems = openOrder
    ? [
        ...(isAcceptedOpenOrder ? [{ label: "Status", value: "Accepted" }] : []),
        { label: "Collected", value: formatCheckoutCurrency(openOrder.totalCollected) },
        { label: "Due", value: formatCheckoutCurrency(openOrder.balanceDue) },
        { label: "Total", value: formatCheckoutCurrency(openOrder.total) },
      ]
    : [
        { label: "Alterations", value: formatCheckoutCurrency(pricing.alterationsSubtotal) },
        { label: "Custom", value: formatCheckoutCurrency(pricing.customSubtotal) },
        { label: "Tax", value: formatCheckoutCurrency(pricing.taxAmount) },
        { label: "Due today", value: draftShouldCollectNow ? formatCheckoutCurrency(checkoutCollectionAmount) : "None" },
        { label: "Total", value: formatCheckoutCurrency(pricing.total) },
      ];

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={CreditCard}
        title="Checkout"
        subtitle={checkoutSubtitle}
        action={!isAcceptedOpenOrder ? (
          <ActionButton
            tone="secondary"
            className="px-3 py-2 text-xs"
            onClick={() => onScreenChange(openOrder ? "openOrders" : "order")}
          >
            {openOrder ? "Back to orders" : "New order"}
          </ActionButton>
        ) : undefined}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Surface tone="work" className="overflow-hidden">
          <div className="px-4 py-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="app-text-overline">
                  {openOrder
                    ? isAcceptedOpenOrder
                      ? showAcceptedConfirmation ? "Order accepted" : "Open order"
                      : "Order review"
                    : "Checkout review"}
                </div>
                <div className="mt-1 app-text-value">
                  {openOrder ? `Order #${openOrder.id}` : "Checkout review"}
                </div>
                <div className="app-text-caption mt-1 max-w-[36rem]">
                  {openOrder
                    ? isAcceptedOpenOrder
                      ? showAcceptedConfirmation
                        ? acceptedOrderNeedsPayment
                          ? "You accepted this order, saved it to Square, and set the promised-ready details. Payment is still due later."
                          : "You accepted this order, saved it to Square, and the payment is already in."
                        : acceptedOrderNeedsPayment
                          ? "This order is saved, the promised-ready details are set, and the team can start work whenever they are ready."
                          : "This order is saved, the promised-ready details are set, and the team can start work now."
                      : "Review customer details, check the order, and collect any remaining payment."
                    : "Review the order, confirm fulfillment, and send it through."}
                </div>
              </div>
              {pageMeta}
            </div>
          </div>

          {isAcceptedOpenOrder && showAcceptedConfirmation ? (
            <div className="border-t border-[var(--app-border)]/45 px-4 py-4">
              <div className="rounded-[var(--app-radius-md)] border border-emerald-200/80 bg-emerald-50/85 px-4 py-4 text-emerald-900 shadow-[0_14px_34px_-28px_rgba(5,150,105,0.55)]">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="app-text-overline text-emerald-700">All set</div>
                    <div className="mt-1 text-[1.05rem] font-semibold tracking-[-0.015em] text-emerald-950">
                      Order #{openOrder.id} has been accepted.
                    </div>
                    <div className="mt-1 text-sm leading-relaxed text-emerald-800/90">
                      {acceptedOrderNeedsPayment
                        ? `${openOrder.payerName}'s order is saved, the due date is set, and the team can start work. No payment was collected, so ${formatCheckoutCurrency(openOrder.balanceDue)} will be due later or at pickup.`
                        : `${openOrder.payerName}'s order is saved, the due date is set, and the payment is already in. The team can start work.`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeLineItems.length === 0 ? (
            <div className="border-t border-[var(--app-border)]/45">
              <div className="px-4 py-5">
                <EmptyState className="rounded-[var(--app-radius-md)] border-dashed bg-[var(--app-surface-muted)]/35 px-5 py-5 shadow-none">
                  <div className="flex items-start gap-3">
                    <div className="app-icon-chip">
                      <ClipboardList className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="app-text-overline">
                        {openOrder ? "Order details unavailable" : "No order yet"}
                      </div>
                      <div className="app-text-body mt-2">
                        {openOrder
                          ? "This order is missing its checkout details. Return to Orders and reopen it there."
                          : "Start a new order to add the customer, the work, and the promised-ready details."}
                      </div>
                      <div className="mt-3">
                        <ActionButton
                          tone="primary"
                          className="px-3 py-2 text-xs"
                          onClick={() => onScreenChange(openOrder ? "openOrders" : "order")}
                        >
                          {openOrder ? "Back to orders" : "New order"}
                        </ActionButton>
                      </div>
                    </div>
                  </div>
                </EmptyState>
              </div>
            </div>
          ) : (
            <>
              <div className="border-t border-[var(--app-border)]/45 px-4 py-4">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="min-w-0">
                    <div className="app-text-overline">Customer details</div>
                    <div className="mt-2 space-y-1.5">
                      <div className="app-text-strong">
                        {openOrder?.payerName ?? checkoutCustomer?.name ?? "Customer required"}
                      </div>
                      {checkoutCustomer?.phone ? <div className="app-text-caption">{checkoutCustomer.phone}</div> : null}
                      {checkoutCustomer?.email ? <div className="app-text-caption">{checkoutCustomer.email}</div> : null}
                      {checkoutCustomer?.address ? <div className="app-text-caption whitespace-pre-line">{checkoutCustomer.address}</div> : null}
                      {!checkoutCustomer && openOrder?.payerCustomerId === null ? (
                        <div className="app-text-caption">Walk-in customer</div>
                      ) : null}
                    </div>
                  </div>

                  <div className="lg:text-right">
                    <div className="app-text-overline">Ready by</div>
                    <div className="mt-2 app-text-strong">{pickupRequired || openOrder ? readyBySummary.headline || "Timing needed" : "No pickup timing needed"}</div>
                    {pickupRequired || openOrder ? (
                      readyBySummary.detail ? <div className="app-text-caption mt-1 whitespace-pre-line leading-relaxed">{readyBySummary.detail}</div> : null
                    ) : (
                      <div className="app-text-caption mt-1">This order does not need pickup scheduling.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--app-border)]/45">
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="app-text-overline">{isAcceptedOpenOrder && showAcceptedConfirmation ? "Accepted order" : "Order review"}</div>
                  <div className="app-text-overline text-right">Amount</div>
                </div>
                {activeLineItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={cx("app-table-row grid grid-cols-[minmax(0,1fr)_120px] gap-3 px-4 py-3.5", index > 0 && "border-t border-[var(--app-border)]/35")}
                  >
                    <div className="min-w-0">
                      {(() => {
                        const displayItem = getCheckoutDisplayLineItem(item);

                        return (
                          <>
                            <div className="app-text-strong">{displayItem.title}</div>
                            {displayItem.subtitle ? (
                              <div className="app-text-caption mt-1 whitespace-pre-line leading-relaxed">{displayItem.subtitle}</div>
                            ) : null}
                          </>
                        );
                      })()}
                    </div>
                    <div className="text-right text-[1.02rem] font-semibold tracking-[-0.015em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
                      {formatCheckoutCurrency(item.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Surface>

        <div className="space-y-4">
          <Surface tone="support" className="p-4">
            <SurfaceHeader
              title={openOrder ? (isAcceptedOpenOrder && showAcceptedConfirmation ? "What happened" : "Payment summary") : "Order totals"}
              subtitle={openOrder ? (isAcceptedOpenOrder && showAcceptedConfirmation ? (acceptedOrderNeedsPayment ? "Order saved, with payment still due." : "Order saved, with payment already collected.") : "Collected, due, and total.") : "What will save with the order."}
            />

            <div className="mt-4 border-t border-[var(--app-border)]/45 pt-4">
              <DefinitionList items={totalsItems} />
            </div>

            <div className="mt-4 border-t border-[var(--app-border)]/45 pt-4">
              <div className="grid gap-2">
                {!openOrder ? (
                  <>
                    {isEmptyDraftCheckout ? (
                      <ActionButton tone="primary" onClick={() => onScreenChange("order")}>
                        New order
                      </ActionButton>
                    ) : isDraftAlterationOnly ? (
                      <>
                        <ActionButton tone="secondary" onClick={() => onScreenChange("order")}>
                          Revise order
                        </ActionButton>
                        <ActionButton
                          tone="primary"
                          disabled={checkoutBlocked}
                          onClick={() => onSaveDraftOrder("due_later", true)}
                        >
                          Accept order
                        </ActionButton>
                        <ActionButton
                          tone="secondary"
                          disabled={checkoutBlocked}
                          onClick={() => onSaveDraftOrder("ready_to_collect", true)}
                        >
                          Accept + prepay
                        </ActionButton>
                      </>
                    ) : (
                      <>
                        <ActionButton tone="secondary" onClick={() => onScreenChange("order")}>
                          Revise order
                        </ActionButton>
                        <ActionButton
                          tone="primary"
                          disabled={checkoutBlocked}
                          onClick={() => onSaveDraftOrder(draftShouldCollectNow ? "ready_to_collect" : "due_later", true)}
                        >
                          {draftShouldCollectNow ? "Send order and continue to payment" : "Send order"}
                        </ActionButton>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {isAcceptedOpenOrder ? (
                      <>
                        <ActionButton tone="primary" onClick={() => onStartOpenOrderWork(openOrder.id)}>
                          Start work
                        </ActionButton>
                        <ActionButton tone="secondary" onClick={() => onScreenChange("openOrders")}>
                          Return to orders
                        </ActionButton>
                        <ActionButton tone="secondary" onClick={() => onEditOpenOrder(openOrder.id)}>
                          Revise order
                        </ActionButton>
                      </>
                    ) : (
                      <div className="grid gap-2">
                        <ActionButton tone="secondary" onClick={() => onScreenChange("openOrders")}>
                          Back to orders
                        </ActionButton>
                        <ActionButton tone="secondary" onClick={() => onEditOpenOrder(openOrder.id)}>
                          Revise order
                        </ActionButton>
                      </div>
                    )}
                    {openOrder.paymentStatus === "pending" ? (
                      <ActionButton tone="primary" onClick={() => onCaptureOpenOrderPayment(openOrder.id)}>
                        Confirm payment
                      </ActionButton>
                    ) : isAcceptedOpenOrder ? null : openOrder.balanceDue > 0 ? (
                      <ActionButton tone="primary" onClick={() => onStartOpenOrderPayment(openOrder.id)}>
                        {openOrder.totalCollected > 0 ? "Collect balance" : "Collect payment"}
                      </ActionButton>
                    ) : allPickupScopesReady ? (
                      <ActionButton tone="primary" onClick={() => onCompleteOpenOrderPickup(openOrder.id)}>
                        Complete pickup
                      </ActionButton>
                    ) : (
                      <ActionButton tone="primary" onClick={() => onScreenChange("openOrders")}>
                        Finish checkout
                      </ActionButton>
                    )}
                    <ActionButton tone="secondary" onClick={() => onCancelOpenOrder(openOrder.id)}>
                      Cancel order
                    </ActionButton>
                  </>
                )}
              </div>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
