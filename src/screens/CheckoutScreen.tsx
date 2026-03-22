import { CreditCard } from "lucide-react";
import type { Customer, OrderWorkflowState, Screen } from "../types";
import { ActionButton, Card, EmptyState, EntityRow, PanelSection, SectionHeader, StatusPill } from "../components/ui/primitives";
import { ReadinessPill } from "../components/ui/pills";
import {
  getCheckoutCollectionAmount,
  formatPickupSchedule,
  getCustomFulfillmentSummary,
  getPickupScheduleForScope,
  getRequiredPickupScopes,
  formatSummaryCurrency,
  getOrderBagLineItems,
  getOrderType,
  getPickupRequired,
  getPricingSummary,
  getSummaryGuardrail,
} from "../features/order/selectors";

type CheckoutScreenProps = {
  payerCustomer: Customer | null;
  order: OrderWorkflowState;
  onScreenChange: (screen: Screen) => void;
  onCompleteOrder: (paymentStatus: "pay_later" | "prepaid") => void;
};

export function CheckoutScreen({ payerCustomer, order, onScreenChange, onCompleteOrder }: CheckoutScreenProps) {
  const orderType = getOrderType(order);
  const hasAlterations = orderType === "alteration" || orderType === "mixed";
  const hasCustom = orderType === "custom" || orderType === "mixed";
  const pickupRequired = getPickupRequired(order);
  const summaryGuardrail = getSummaryGuardrail(order, payerCustomer);
  const lineItems = getOrderBagLineItems(order, []);
  const pricing = getPricingSummary(order);
  const checkoutCollectionAmount = getCheckoutCollectionAmount(order);
  const requiredPickupScopes = getRequiredPickupScopes(order);
  const formattedPickup = requiredPickupScopes
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
  const isAlterationPrepayFlow = orderType === "alteration" && order.checkoutIntent === "prepay_now";
  const checklist = [
    { label: "Payer linked", ready: !summaryGuardrail.missingCustomer, value: payerCustomer?.name ?? "Required" },
    {
      label: "Pickup scheduled",
      ready: !summaryGuardrail.missingPickup,
      value: pickupRequired ? formattedPickup || "Required" : "Not needed",
    },
    {
      label: "Wearers assigned",
      ready: !hasCustom || order.custom.items.every((item) => Boolean(item.wearerCustomerId && item.linkedMeasurementLabel)),
      value: hasCustom ? `${order.custom.items.length} garments assigned` : "Not needed",
    },
    {
      label: "Custom configuration",
      ready: !summaryGuardrail.customIncomplete,
      value: hasCustom ? (summaryGuardrail.customIncomplete ? "Incomplete" : "Ready") : "Not needed",
    },
  ];
  const checkoutBlocked = orderType === null || summaryGuardrail.missingCustomer || summaryGuardrail.missingPickup || summaryGuardrail.customIncomplete;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="p-4">
        <SectionHeader
          icon={CreditCard}
          title="Checkout"
          subtitle={
            orderType === "mixed"
              ? "Save, send, collect deposit"
              : isAlterationPrepayFlow
                ? "Collect now, then open the scheduled work order"
                : orderType === "alteration"
                  ? "Save, send, collect"
                : orderType === "custom"
                  ? "Save, send, collect deposit"
                  : "Select an order type first"
          }
          action={
            <ActionButton tone="secondary" className="px-3 py-2 text-xs" onClick={() => onScreenChange("order")}>
              Back to order
            </ActionButton>
          }
        />

        {lineItems.length === 0 ? (
          <EmptyState className="text-sm">
            No order bag is ready for checkout. Add items on the order screen, then return here.
          </EmptyState>
        ) : (
          <div className="space-y-4">
            <PanelSection title="Customer handoff">
              <div className="space-y-2">
                <EntityRow
                  title={payerCustomer?.name ?? "Payer required"}
                  subtitle={payerCustomer ? `${payerCustomer.phone} • ${payerCustomer.lastVisit}` : "Link the paying customer before checkout."}
                  meta={<ReadinessPill ready={Boolean(payerCustomer)} readyLabel="Linked" />}
                />
                {pickupRequired ? (
                  <EntityRow
                    title="Pickup handoff"
                    subtitle={formattedPickup || "Alteration pickup details or custom order event details required."}
                    meta={<ReadinessPill ready={!summaryGuardrail.missingPickup} />}
                  />
                ) : null}
              </div>
            </PanelSection>

            <PanelSection title="Line items" action={<span className="app-text-body font-medium">{lineItems.length}</span>}>
              <div className="space-y-2">
                {lineItems.map((item) => (
                  <div key={item.id} className="app-entity-row">
                    <div className="min-w-0 flex-1">
                      <div className="app-text-body font-medium">{item.title}</div>
                      <div className="app-text-caption mt-1 whitespace-pre-line leading-relaxed">{item.subtitle}</div>
                    </div>
                    <div className="app-text-strong shrink-0 self-start pl-4">
                      {formatSummaryCurrency(item.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </PanelSection>

            <Card className="p-4">
              <div className="app-text-strong mb-3">Financials</div>
              <div className="mb-4 space-y-2">
                <EntityRow title="Alterations" meta={<span className="app-text-strong">{formatSummaryCurrency(pricing.alterationsSubtotal)}</span>} />
                <EntityRow title="Custom garments" meta={<span className="app-text-strong">{formatSummaryCurrency(pricing.customSubtotal)}</span>} />
                <EntityRow title="Tax" meta={<span className="app-text-strong">{formatSummaryCurrency(pricing.taxAmount)}</span>} />
                <EntityRow title="Deposit due today" meta={<StatusPill tone={hasCustom ? "dark" : "default"}>{hasCustom ? formatSummaryCurrency(pricing.depositDue) : "None"}</StatusPill>} />
                <EntityRow title="Order total" meta={<span className="app-text-strong">{formatSummaryCurrency(pricing.total)}</span>} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ActionButton tone="secondary" onClick={() => onScreenChange("order")}>
                  Revise order
                </ActionButton>
                <ActionButton
                  tone="primary"
                  disabled={checkoutBlocked}
                  onClick={() => {
                    if (!orderType) {
                      return;
                    }

                    if (orderType === "alteration" && !isAlterationPrepayFlow) {
                      return;
                    }

                    onCompleteOrder("prepaid");
                  }}
                >
                  {isAlterationPrepayFlow
                    ? `Collect ${formatSummaryCurrency(checkoutCollectionAmount)} and open order`
                    : `Send ${formatSummaryCurrency(checkoutCollectionAmount)} to Square`}
                </ActionButton>
              </div>
            </Card>
          </div>
        )}
      </Card>

      <div className="space-y-4">
        <Card className="border-dashed p-3 opacity-90">
          <div className="app-text-overline mb-2">Ops checks</div>
          <div className="overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)]">
            <div className="app-text-overline grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-3 border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2">
              <span>Check</span>
              <span>Detail</span>
              <span>Status</span>
            </div>
            {[
              ...checklist.map((item) => ({
                label: item.label,
                detail: item.value,
                tone: item.ready ? "dark" : "warn",
                status: item.ready ? "Ready" : "Needs work",
              })),
              {
                label: "Airtable write",
                detail: checkoutBlocked ? "Blocked by missing checkout data" : "Order payload ready",
                tone: checkoutBlocked ? "warn" : "dark",
                status: checkoutBlocked ? "Blocked" : "Ready",
              },
              {
                label: "Square order",
                detail: checkoutBlocked
                  ? "Waiting on order setup"
                  : isAlterationPrepayFlow
                    ? `Collect ${formatSummaryCurrency(checkoutCollectionAmount)} before opening the work order`
                    : `Queue ${formatSummaryCurrency(checkoutCollectionAmount)} to collect`,
                tone: checkoutBlocked ? "warn" : "default",
                status: checkoutBlocked ? "Pending" : "Pending send",
              },
              {
                label: "Payment collection",
                detail: hasCustom
                  ? "Deposit due today"
                  : isAlterationPrepayFlow
                    ? "Prepay in checkout"
                    : orderType === "alteration"
                      ? "Collect at terminal"
                      : "Not ready",
                tone: hasCustom || orderType === "alteration" ? "default" : "warn",
                status: hasCustom ? "Deposit due" : isAlterationPrepayFlow ? "Prepay now" : orderType === "alteration" ? "At terminal" : "Blocked",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-3 border-b border-[var(--app-border)] px-3 py-2 last:border-b-0"
              >
                <span className="app-text-body font-medium">{row.label}</span>
                <span className="app-text-caption">{row.detail}</span>
                <StatusPill tone={row.tone as "default" | "dark" | "warn"}>{row.status}</StatusPill>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
