import { CreditCard } from "lucide-react";
import type { Customer, OpenOrder, OrderWorkflowState, Screen } from "../types";
import { ActionButton, DefinitionList, EmptyState, EntityRow, SectionHeader, StatusPill, Surface, SurfaceHeader, cx } from "../components/ui/primitives";
import { PaymentStatusPill, ReadinessPill } from "../components/ui/pills";
import {
  formatPickupSchedule,
  formatSummaryCurrency,
  getCheckoutCollectionAmount,
  getCustomFulfillmentSummary,
  getOrderBagLineItems,
  getOrderType,
  getPickupRequired,
  getPickupScheduleForScope,
  getPricingSummary,
  getRequiredPickupScopes,
  getSummaryGuardrail,
} from "../features/order/selectors";

type CheckoutScreenProps = {
  payerCustomer: Customer | null;
  openOrder: OpenOrder | null;
  order: OrderWorkflowState;
  onScreenChange: (screen: Screen) => void;
  onSaveDraftOrder: (paymentStatus: "due_later" | "ready_to_collect", openCheckout?: boolean) => void;
  onStartOpenOrderPayment: (openOrderId: number) => void;
  onCaptureOpenOrderPayment: (openOrderId: number) => void;
};

function getDraftPickupSummary(order: OrderWorkflowState) {
  const requiredPickupScopes = getRequiredPickupScopes(order);

  return requiredPickupScopes
    .map((scope) => {
      const schedule = getPickupScheduleForScope(order, scope);
      const scopeLabel = scope === "alteration" ? "Alterations" : "Custom";
      if (scope === "custom") {
        return `${scopeLabel}: ${getCustomFulfillmentSummary(schedule.eventType, schedule.eventDate, schedule.pickupLocation)}`;
      }

      const formatted = formatPickupSchedule(schedule.pickupDate, schedule.pickupTime);
      return formatted && schedule.pickupLocation ? `${scopeLabel}: ${formatted} • ${schedule.pickupLocation}` : `${scopeLabel}: Required`;
    })
    .join(requiredPickupScopes.length > 1 ? "\n" : "");
}

function getSavedPickupSummary(openOrder: OpenOrder) {
  return openOrder.pickupSchedules
    .map((pickup) => {
      const scopeLabel = pickup.scope === "alteration" ? "Alterations" : "Custom";
      if (pickup.scope === "custom" && !pickup.pickupDate) {
        return `${scopeLabel}: ${getCustomFulfillmentSummary(pickup.eventType, pickup.eventDate, pickup.pickupLocation)}`;
      }

      const formatted = formatPickupSchedule(pickup.pickupDate, pickup.pickupTime);
      return formatted && pickup.pickupLocation ? `${scopeLabel}: ${formatted} • ${pickup.pickupLocation}` : `${scopeLabel}: Required`;
    })
    .join(openOrder.pickupSchedules.length > 1 ? "\n" : "");
}

export function CheckoutScreen({
  payerCustomer,
  openOrder,
  order,
  onScreenChange,
  onSaveDraftOrder,
  onStartOpenOrderPayment,
  onCaptureOpenOrderPayment,
}: CheckoutScreenProps) {
  const orderType = getOrderType(order);
  const hasCustom = orderType === "custom" || orderType === "mixed";
  const pickupRequired = getPickupRequired(order);
  const summaryGuardrail = getSummaryGuardrail(order, payerCustomer);
  const draftLineItems = getOrderBagLineItems(order, []);
  const pricing = getPricingSummary(order);
  const checkoutCollectionAmount = getCheckoutCollectionAmount(order);
  const isAlterationPrepayFlow = orderType === "alteration" && order.checkoutIntent === "prepay_now";
  const draftShouldCollectNow = hasCustom || isAlterationPrepayFlow;
  const checkoutBlocked = orderType === null || summaryGuardrail.missingCustomer || summaryGuardrail.missingPickup || summaryGuardrail.customIncomplete;
  const pickupSummary = openOrder ? getSavedPickupSummary(openOrder) : getDraftPickupSummary(order);
  const activeLineItems = openOrder ? openOrder.lineItems : draftLineItems;

  const draftChecklist = [
    { label: "Payer linked", ready: !summaryGuardrail.missingCustomer, value: payerCustomer?.name ?? "Required" },
    {
      label: "Pickup scheduled",
      ready: !summaryGuardrail.missingPickup,
      value: pickupRequired ? pickupSummary || "Required" : "Not needed",
    },
    {
      label: "Order payload",
      ready: !checkoutBlocked,
      value: checkoutBlocked ? "Needs review before save" : "Ready to save",
    },
    {
      label: "Collection step",
      ready: !draftShouldCollectNow || !checkoutBlocked,
      value: draftShouldCollectNow ? `Collect ${formatSummaryCurrency(checkoutCollectionAmount)} after save` : "No payment required now",
    },
  ];

  const savedChecklist = openOrder ? [
    {
      label: "Order save",
      ready: true,
      value: `Saved as active order #${openOrder.id}`,
    },
    {
      label: "Pickup handoff",
      ready: true,
      value: pickupSummary || "Saved with pickup details",
    },
    {
      label: "Payment status",
      ready: openOrder.paymentStatus !== "pending",
      value:
        openOrder.paymentStatus === "pending"
          ? "Waiting on Square payment confirmation"
          : openOrder.balanceDue > 0
            ? `${formatSummaryCurrency(openOrder.balanceDue)} still due`
            : `Captured ${formatSummaryCurrency(openOrder.collectedToday)}`,
    },
    {
      label: "Remaining balance",
      ready: openOrder.balanceDue === 0 || openOrder.paymentStatus === "due_later",
      value: formatSummaryCurrency(openOrder.balanceDue),
    },
  ] : [];

  const checkoutSubtitle = openOrder
    ? openOrder.paymentStatus === "pending"
      ? "Payment is in flight. Wait for confirmation or close the loop manually in the prototype."
      : openOrder.balanceDue > 0
        ? "Order saved. You can collect the remaining balance whenever the customer is ready."
        : "Payment captured. Return to the order registry to continue fulfillment."
    : draftShouldCollectNow
      ? "Review the order, save it, then start collection."
      : "Review the order and save it into the active registry.";

  const pageMeta = openOrder ? (
    <div className="flex flex-wrap items-center gap-2">
      <PaymentStatusPill status={openOrder.paymentStatus} />
      <StatusPill tone={openOrder.balanceDue > 0 ? "warn" : "success"}>
        {openOrder.balanceDue > 0 ? `${formatSummaryCurrency(openOrder.balanceDue)} due` : "Settled"}
      </StatusPill>
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-2">
      <StatusPill tone={draftShouldCollectNow ? "dark" : "default"}>
        {draftShouldCollectNow ? `${formatSummaryCurrency(checkoutCollectionAmount)} due now` : "No payment due now"}
      </StatusPill>
      <StatusPill tone={checkoutBlocked ? "warn" : "success"}>
        {checkoutBlocked ? "Needs setup" : "Ready to save"}
      </StatusPill>
    </div>
  );

  const financialItems = openOrder
    ? [
        { label: "Amount due now", value: formatSummaryCurrency(openOrder.paymentDueNow) },
        { label: "Captured today", value: formatSummaryCurrency(openOrder.collectedToday) },
        { label: "Remaining balance", value: formatSummaryCurrency(openOrder.balanceDue) },
        { label: "Order total", value: formatSummaryCurrency(openOrder.total) },
      ]
    : [
        { label: "Alterations", value: formatSummaryCurrency(pricing.alterationsSubtotal) },
        { label: "Custom garments", value: formatSummaryCurrency(pricing.customSubtotal) },
        { label: "Tax", value: formatSummaryCurrency(pricing.taxAmount) },
        { label: "Due now", value: draftShouldCollectNow ? formatSummaryCurrency(checkoutCollectionAmount) : "None" },
        { label: "Order total", value: formatSummaryCurrency(pricing.total) },
      ];

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={CreditCard}
        title="Checkout"
        subtitle={checkoutSubtitle}
        action={
          <ActionButton
            tone="secondary"
            className="px-3 py-2 text-xs"
            onClick={() => onScreenChange(openOrder ? "openOrders" : "order")}
          >
            {openOrder ? "Back to orders" : "Back to order"}
          </ActionButton>
        }
      />

      <Surface tone="control" className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="app-text-value">
              {openOrder ? `Saved order #${openOrder.id}` : "Draft checkout review"}
            </div>
            <div className="app-text-caption mt-1">
              {openOrder
                ? "Use this surface to continue collection on a saved order without leaving the operational flow."
                : "Confirm the payer, pickup handoff, and line items before the draft becomes a live order."}
            </div>
          </div>
          {pageMeta}
        </div>
      </Surface>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Surface tone="work" className="overflow-hidden">
          <div className="px-4 py-4">
            <SurfaceHeader
              title={openOrder ? "Order handoff" : "Checkout worksheet"}
              subtitle={openOrder ? "Saved order context, customer handoff, and collection-ready line items." : "Review the draft in the same operator language used across the registry and worklist."}
              meta={<div className="app-text-overline">{activeLineItems.length} line items</div>}
            />
          </div>

          {activeLineItems.length === 0 ? (
            <div className="border-t border-[var(--app-border)]/45">
              <EmptyState className="rounded-none border-0 bg-transparent shadow-none text-sm">
                {openOrder
                  ? "This saved order does not have a checkout payload available."
                  : "No order bag is ready for checkout. Add items on the order screen, then return here."}
              </EmptyState>
            </div>
          ) : (
            <>
              <div className="border-t border-[var(--app-border)]/45 px-4 py-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <div className="app-text-overline">Payer</div>
                    <EntityRow
                      className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/55 bg-[var(--app-surface)]/35 px-3.5 py-3"
                      title={openOrder?.payerName ?? payerCustomer?.name ?? "Payer required"}
                      subtitle={
                        openOrder
                          ? openOrder.payerCustomerId
                            ? `Order #${openOrder.id} • ready for operational follow-through`
                            : `Order #${openOrder.id} • walk-in customer`
                          : payerCustomer
                            ? `${payerCustomer.phone} • ${payerCustomer.lastVisit}`
                            : "Link the paying customer before checkout."
                      }
                      meta={openOrder ? <PaymentStatusPill status={openOrder.paymentStatus} /> : <ReadinessPill ready={Boolean(payerCustomer)} readyLabel="Linked" />}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="app-text-overline">Pickup handoff</div>
                    <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/55 bg-[var(--app-surface)]/35 px-3.5 py-3">
                      <div className="app-text-body font-medium">
                        {pickupRequired || openOrder ? "Promised ready by" : "No pickup handoff needed"}
                      </div>
                      <div className="app-text-caption mt-1 whitespace-pre-line leading-relaxed">
                        {pickupRequired || openOrder ? pickupSummary || "Pickup details required before save." : "This order does not require pickup scheduling."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--app-border)]/45">
                <div className="app-table-head grid grid-cols-[minmax(0,1fr)_120px] gap-3 px-4 py-2">
                  <span>Line items</span>
                  <span className="text-right">Amount</span>
                </div>
                {activeLineItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={cx("app-table-row grid grid-cols-[minmax(0,1fr)_120px] gap-3 px-4 py-3.5", index > 0 && "border-t border-[var(--app-border)]/35")}
                  >
                    <div className="min-w-0">
                      <div className="app-text-body font-medium">{item.title}</div>
                      <div className="app-text-caption mt-1 whitespace-pre-line leading-relaxed">{item.subtitle}</div>
                    </div>
                    <div className="app-text-strong text-right">{formatSummaryCurrency(item.amount)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Surface>

        <div className="space-y-4">
          <Surface tone="support" className="p-4">
            <SurfaceHeader
              title="Financials"
              subtitle={openOrder ? "Collection state and remaining balance for this saved order." : "What saves now versus what remains on the order."}
            />

            <div className="mt-4 border-t border-[var(--app-border)]/45 pt-4">
              <DefinitionList items={financialItems} />
            </div>

            <div className="mt-4 border-t border-[var(--app-border)]/45 pt-4">
              <div className="grid gap-2">
                {!openOrder ? (
                  <>
                    <ActionButton tone="secondary" onClick={() => onScreenChange("order")}>
                      Revise order
                    </ActionButton>
                    <ActionButton
                      tone="primary"
                      disabled={checkoutBlocked}
                      onClick={() => onSaveDraftOrder(draftShouldCollectNow ? "ready_to_collect" : "due_later", draftShouldCollectNow)}
                    >
                      {draftShouldCollectNow ? "Save order" : "Save to order registry"}
                    </ActionButton>
                  </>
                ) : (
                  <>
                    <ActionButton tone="secondary" onClick={() => onScreenChange("openOrders")}>
                      Open order registry
                    </ActionButton>
                    {openOrder.paymentStatus === "pending" ? (
                      <ActionButton tone="primary" onClick={() => onCaptureOpenOrderPayment(openOrder.id)}>
                        Mark payment captured
                      </ActionButton>
                    ) : openOrder.balanceDue > 0 ? (
                      <ActionButton tone="primary" onClick={() => onStartOpenOrderPayment(openOrder.id)}>
                        {`Send ${formatSummaryCurrency(openOrder.balanceDue)} to Square`}
                      </ActionButton>
                    ) : (
                      <ActionButton tone="primary" onClick={() => onScreenChange("openOrders")}>
                        Return to orders
                      </ActionButton>
                    )}
                  </>
                )}
              </div>
            </div>
          </Surface>

          <Surface tone="support" className="p-4">
            <SurfaceHeader
              title="Ops checks"
              subtitle="Keep the support rail lightweight: just the key readiness signals."
            />

            <div className="mt-4 overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)]/55">
              <div className="app-table-head grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-3 px-3 py-2">
                <span>Check</span>
                <span>Detail</span>
                <span>Status</span>
              </div>
              {(openOrder ? savedChecklist : draftChecklist).map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-3 border-t border-[var(--app-border)]/35 px-3 py-2"
                >
                  <span className="app-text-body font-medium">{row.label}</span>
                  <span className="app-text-caption whitespace-pre-line">{row.value}</span>
                  <StatusPill tone={row.ready ? "dark" : "warn"}>{row.ready ? "Ready" : "Needs work"}</StatusPill>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
