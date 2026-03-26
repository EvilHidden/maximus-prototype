import { ClipboardList, CreditCard } from "lucide-react";
import { useState } from "react";
import type { Customer, OpenOrder, OrderWorkflowState, Screen } from "../types";
import { ActionButton, EmptyState, SectionHeader, Surface, cx } from "../components/ui/primitives";
import {
  getCheckoutCollectionAmount,
  getOpenOrderPickupBalanceDue,
  hasReadyScopesForPickup,
  getOrderBagLineItems,
  getOrderType,
  getPickupRequired,
  getPricingSummary,
  getSummaryGuardrail,
} from "../features/order/selectors";
import {
  formatCheckoutCurrency,
  getCheckoutDisplayLineItem,
  getDraftPickupSummary,
  getReadyBySummary,
  getSavedPickupSummary,
} from "../features/order/checkoutDisplay";
import { CheckoutAcceptedBanner } from "../features/order/components/checkout/CheckoutAcceptedBanner";
import { CheckoutEmptyState } from "../features/order/components/checkout/CheckoutEmptyState";
import { CheckoutSummaryRail } from "../features/order/components/checkout/CheckoutSummaryRail";
import { ConfirmCancelOrderModal } from "../features/order/modals/ConfirmCancelOrderModal";
import { ConfirmCheckoutModal } from "../features/order/modals/ConfirmCheckoutModal";

type CheckoutScreenProps = {
  customers: Customer[];
  payerCustomer: Customer | null;
  openOrder: OpenOrder | null;
  showAcceptedConfirmation: boolean;
  showCheckoutCompletion: boolean;
  order: OrderWorkflowState;
  onScreenChange: (screen: Screen) => void;
  onSaveDraftOrder: (paymentStatus: "due_later" | "ready_to_collect", openCheckout?: boolean) => void;
  onCompleteOpenOrderCheckout: (openOrderId: number) => void;
  onEditOpenOrder: (openOrderId: number) => void;
  onCancelOpenOrder: (openOrderId: number) => void;
  onCompleteOpenOrderPickup: (openOrderId: number) => void;
};

export function CheckoutScreen({
  customers,
  payerCustomer,
  openOrder,
  showAcceptedConfirmation,
  showCheckoutCompletion,
  order,
  onScreenChange,
  onSaveDraftOrder,
  onCompleteOpenOrderCheckout,
  onEditOpenOrder,
  onCancelOpenOrder,
  onCompleteOpenOrderPickup,
}: CheckoutScreenProps) {
  const [checkoutConfirmOpen, setCheckoutConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
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
  const acceptedOrderNeedsPayment = Boolean(openOrder && isAcceptedOpenOrder && openOrder.balanceDue > 0);
  const readyPickupBalanceDue = openOrder ? getOpenOrderPickupBalanceDue(openOrder) : 0;
  const hasReadyScopesToPickup = openOrder ? hasReadyScopesForPickup(openOrder) : false;
  const dueNow = openOrder
    ? hasReadyScopesToPickup && readyPickupBalanceDue > 0
      ? readyPickupBalanceDue
      : openOrder.balanceDue
    : checkoutCollectionAmount;
  const showPaymentCompleteState = Boolean(openOrder && showCheckoutCompletion);
  const openCheckoutConfirmation = () => setCheckoutConfirmOpen(true);
  const closeCheckoutConfirmation = () => setCheckoutConfirmOpen(false);
  const openCancelConfirmation = () => setCancelConfirmOpen(true);
  const closeCancelConfirmation = () => setCancelConfirmOpen(false);

  if (isEmptyDraftCheckout) {
    return <CheckoutEmptyState onAction={() => onScreenChange("order")} actionIcon={CreditCard} />;
  }

  const checkoutSubtitle = openOrder
    ? showPaymentCompleteState
      ? hasReadyScopesToPickup
        ? "Payment is recorded. Finish the pickup when the customer has everything."
        : "Payment is recorded. Keep this order here until you are done with the customer."
      : isAcceptedOpenOrder
        ? acceptedOrderNeedsPayment
          ? "The order is saved. Checkout can be taken now or later."
          : "The order is saved and ready for work."
        : hasReadyScopesToPickup && dueNow > 0
          ? "Review the ready pieces and check out what is due today."
          : hasReadyScopesToPickup
            ? "Everything ready today is paid. Finish the pickup when the handoff is complete."
            : openOrder.balanceDue > 0
              ? openOrder.totalCollected > 0
                ? "Deposit recorded. Checkout the remaining balance when the customer collects."
                : "Review the order and check out what is due."
              : "This order is paid."
    : isDraftAlterationOnly
      ? "Review the order and accept it."
      : draftShouldCollectNow
        ? "Review the order, accept it, and take payment."
        : "Review the order and accept it.";

  const pageMeta = openOrder ? (
    <div className="text-right">
      <div className="app-text-overline">
        {showPaymentCompleteState
          ? openOrder.balanceDue > 0
            ? "Paid today"
            : "Paid"
          : hasReadyScopesToPickup && dueNow > 0
            ? "Due now"
            : isAcceptedOpenOrder
              ? acceptedOrderNeedsPayment
                ? "Still due"
                : "Paid"
              : "Balance due"}
      </div>
      <div className="mt-1 text-[1.9rem] font-semibold leading-none tracking-[-0.025em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
        {showPaymentCompleteState
          ? formatCheckoutCurrency(openOrder.balanceDue > 0 ? openOrder.collectedToday || dueNow : openOrder.totalCollected)
          : dueNow > 0
            ? formatCheckoutCurrency(dueNow)
            : "Paid"}
      </div>
      <div className="app-text-caption mt-1">
        {showPaymentCompleteState
          ? openOrder.balanceDue > 0
            ? "Remaining balance stays with unfinished work"
            : "No balance due"
          : dueNow > 0
            ? hasReadyScopesToPickup
              ? "Due on the pieces being collected today"
              : isAcceptedOpenOrder
                ? "Collect later or at pickup"
                : "Still due at checkout"
            : "No balance due"}
      </div>
      {!showPaymentCompleteState && openOrder.totalCollected > 0 && openOrder.balanceDue > 0 ? (
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
        {checkoutBlocked ? "Finish setup before you save the order." : "Ready to accept."}
      </div>
    </div>
  );

  const totalsItems = openOrder
    ? [
        ...(isAcceptedOpenOrder ? [{ label: "Status", value: "Accepted" }] : []),
        { label: "Collected", value: formatCheckoutCurrency(openOrder.totalCollected) },
        { label: hasReadyScopesToPickup && dueNow !== openOrder.balanceDue ? "Due today" : "Due", value: formatCheckoutCurrency(dueNow) },
        ...(hasReadyScopesToPickup && dueNow !== openOrder.balanceDue ? [{ label: "Remaining later", value: formatCheckoutCurrency(openOrder.balanceDue) }] : []),
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
        action={!isAcceptedOpenOrder && !showPaymentCompleteState ? (
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
                    ? showPaymentCompleteState
                      ? "Checkout complete"
                      : isAcceptedOpenOrder
                      ? showAcceptedConfirmation ? "Order saved" : "Order summary"
                      : "Order summary"
                    : "New order"}
                </div>
                <div className="mt-1 app-text-value">
                  {openOrder ? `Order #${openOrder.id}` : "Order summary"}
                </div>
                <div className="app-text-caption mt-1 max-w-[36rem]">
                  {openOrder
                    ? showPaymentCompleteState
                      ? hasReadyScopesToPickup
                        ? "Payment is marked here and the order stays in place until you complete the handoff."
                        : "Payment is marked here so the customer stays anchored on this order while you finish up."
                      : isAcceptedOpenOrder
                      ? showAcceptedConfirmation
                        ? acceptedOrderNeedsPayment
                          ? "This order has been saved and is ready for work. Payment is still due later."
                          : "This order has been saved, and payment has already been collected."
                        : acceptedOrderNeedsPayment
                          ? "This order is saved and ready for work. Payment is still due."
                          : "This order is saved and ready for work."
                      : "Review the customer details, check the order, and collect any remaining payment."
                    : "Review the order, check the pickup timing, and accept it."}
                </div>
              </div>
              {pageMeta}
            </div>
          </div>

          {isAcceptedOpenOrder && showAcceptedConfirmation ? (
            <CheckoutAcceptedBanner
              openOrderId={openOrder.id}
              payerName={openOrder.payerName}
              balanceDue={openOrder.balanceDue}
              acceptedOrderNeedsPayment={acceptedOrderNeedsPayment}
            />
          ) : null}
          {showPaymentCompleteState ? (
            <div className="border-t border-[var(--app-border)]/45 px-4 py-4">
              <div className="rounded-[var(--app-radius-md)] border border-sky-200/80 bg-sky-50/85 px-4 py-4 text-sky-950 shadow-[0_14px_34px_-28px_rgba(2,132,199,0.5)]">
                <div className="app-text-overline text-sky-700">Paid</div>
                <div className="mt-1 text-[1.05rem] font-semibold tracking-[-0.015em]">
                  {openOrder.payerName}'s checkout is complete.
                </div>
                <div className="mt-1 text-sm leading-relaxed text-sky-900/85">
                  {hasReadyScopesToPickup
                    ? openOrder.balanceDue > 0
                      ? "Today’s pickup balance is in. The remaining balance stays with the unfinished work."
                      : "Everything being collected today is paid. Finish the pickup when the customer has the order."
                    : "Payment is marked here so you can finish with the customer before leaving this order."}
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
                          : "Start a new order to add the customer, the work, and the pickup timing."}
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
                      <>
                        {readyBySummary.detail ? <div className="app-text-caption mt-1 whitespace-pre-line leading-relaxed">{readyBySummary.detail}</div> : null}
                        {openOrder?.holdUntilAllScopesReady && hasReadyScopesToPickup && dueNow !== openOrder.balanceDue ? (
                          <div className="app-text-caption mt-1">
                            This is a mixed order. Only the ready pieces are being checked out today.
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="app-text-caption mt-1">This order does not need pickup scheduling.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--app-border)]/45">
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="app-text-overline">{isAcceptedOpenOrder && showAcceptedConfirmation ? "Accepted order" : "Order details"}</div>
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
          <CheckoutSummaryRail
            title={openOrder ? (showPaymentCompleteState ? "What happened" : isAcceptedOpenOrder && showAcceptedConfirmation ? "What happened" : "Payment summary") : "Order totals"}
            subtitle={openOrder ? (showPaymentCompleteState ? "Payment recorded, with any remaining balance still tied to unfinished work." : isAcceptedOpenOrder && showAcceptedConfirmation ? (acceptedOrderNeedsPayment ? "Order saved, with payment still due." : "Order saved, with payment already collected.") : "Collected, still due, and total.") : "What will be saved with this order."}
            totalsItems={totalsItems}
          >
                {!openOrder ? (
                  <>
                    {isEmptyDraftCheckout ? (
                      <ActionButton tone="primary" onClick={() => onScreenChange("order")}>
                        New order
                      </ActionButton>
                    ) : isDraftAlterationOnly ? (
                      <>
                        <ActionButton tone="secondary" onClick={() => onScreenChange("order")}>
                          Edit order
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
                          Accept and prepay
                        </ActionButton>
                      </>
                    ) : (
                      <>
                        <ActionButton tone="secondary" onClick={() => onScreenChange("order")}>
                          Edit order
                        </ActionButton>
                        <ActionButton
                          tone="primary"
                          disabled={checkoutBlocked}
                          onClick={() => onSaveDraftOrder(draftShouldCollectNow ? "ready_to_collect" : "due_later", true)}
                        >
                          {draftShouldCollectNow ? "Accept order and take payment" : "Accept order"}
                        </ActionButton>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {isAcceptedOpenOrder && !showPaymentCompleteState ? (
                      <>
                        {dueNow > 0 ? (
                          <ActionButton tone="primary" onClick={openCheckoutConfirmation}>
                            Checkout
                          </ActionButton>
                        ) : null}
                        <ActionButton tone="secondary" onClick={() => onScreenChange("openOrders")}>
                          Back to orders
                        </ActionButton>
                        <ActionButton tone="secondary" onClick={() => onEditOpenOrder(openOrder.id)}>
                          Edit order
                        </ActionButton>
                      </>
                    ) : (
                      <div className="grid gap-2">
                        <ActionButton tone="secondary" onClick={() => onScreenChange("openOrders")}>
                          Back to orders
                        </ActionButton>
                        <ActionButton tone="secondary" onClick={() => onEditOpenOrder(openOrder.id)}>
                          Edit order
                        </ActionButton>
                      </div>
                    )}
                    {showPaymentCompleteState ? (
                      hasReadyScopesToPickup ? (
                        <ActionButton tone="primary" onClick={() => onCompleteOpenOrderPickup(openOrder.id)}>
                          Complete pickup
                        </ActionButton>
                      ) : (
                        <ActionButton tone="primary" onClick={() => onScreenChange("openOrders")}>
                          View order
                        </ActionButton>
                      )
                    ) : isAcceptedOpenOrder ? null : hasReadyScopesToPickup && dueNow > 0 ? (
                      <ActionButton tone="primary" onClick={openCheckoutConfirmation}>
                        Checkout
                      </ActionButton>
                    ) : hasReadyScopesToPickup ? (
                      <ActionButton tone="primary" onClick={() => onCompleteOpenOrderPickup(openOrder.id)}>
                        Complete pickup
                      </ActionButton>
                    ) : openOrder.balanceDue > 0 ? (
                      <ActionButton tone="primary" onClick={openCheckoutConfirmation}>
                        Checkout
                      </ActionButton>
                    ) : (
                      <ActionButton tone="primary" onClick={() => onScreenChange("openOrders")}>
                        View order
                      </ActionButton>
                    )}
                    <ActionButton tone="secondary" onClick={openCancelConfirmation} disabled={showPaymentCompleteState}>
                      Cancel order
                    </ActionButton>
                  </>
                )}
          </CheckoutSummaryRail>
        </div>
      </div>
      {openOrder && checkoutConfirmOpen ? (
        <ConfirmCheckoutModal
          openOrder={openOrder}
          amountDue={dueNow}
          onClose={closeCheckoutConfirmation}
          onConfirm={() => {
            closeCheckoutConfirmation();
            onCompleteOpenOrderCheckout(openOrder.id);
          }}
        />
      ) : null}
      {openOrder && cancelConfirmOpen ? (
        <ConfirmCancelOrderModal
          openOrder={openOrder}
          onClose={closeCancelConfirmation}
          onConfirm={() => {
            closeCancelConfirmation();
            onCancelOpenOrder(openOrder.id);
          }}
        />
      ) : null}
    </div>
  );
}
