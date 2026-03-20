import { CreditCard } from "lucide-react";
import type { Customer, MeasurementSet, OrderWorkflowState, Screen } from "../types";
import { ActionButton, Card, EmptyState, EntityRow, PanelSection, SectionHeader, StatusPill } from "../components/ui/primitives";
import {
  getCheckoutCollectionAmount,
  formatPickupSchedule,
  formatSummaryCurrency,
  getOrderBagLineItems,
  getOrderType,
  getPickupRequired,
  getPricingSummary,
  getSummaryGuardrail,
} from "../features/order/selectors";

type CheckoutScreenProps = {
  selectedCustomer: Customer | null;
  measurementSets: MeasurementSet[];
  order: OrderWorkflowState;
  onScreenChange: (screen: Screen) => void;
};

export function CheckoutScreen({ selectedCustomer, measurementSets, order, onScreenChange }: CheckoutScreenProps) {
  const orderType = getOrderType(order);
  const hasAlterations = orderType === "alteration" || orderType === "mixed";
  const hasCustom = orderType === "custom" || orderType === "mixed";
  const pickupRequired = getPickupRequired(order);
  const summaryGuardrail = getSummaryGuardrail(order, selectedCustomer);
  const lineItems = getOrderBagLineItems(order, measurementSets);
  const pricing = getPricingSummary(order);
  const checkoutCollectionAmount = getCheckoutCollectionAmount(order);
  const formattedPickup = formatPickupSchedule(order.fulfillment.pickupDate, order.fulfillment.pickupTime);
  const checklist = [
    { label: "Customer linked", ready: !summaryGuardrail.missingCustomer, value: selectedCustomer?.name ?? "Required" },
    {
      label: "Pickup scheduled",
      ready: !summaryGuardrail.missingPickup,
      value: pickupRequired ? `${formattedPickup ?? "Required"}${order.fulfillment.pickupLocation ? ` • ${order.fulfillment.pickupLocation}` : ""}` : "Not needed",
    },
    {
      label: "Measurements attached",
      ready: !hasCustom || Boolean(order.custom.linkedMeasurementSetId),
      value: hasCustom ? (order.custom.linkedMeasurementSetId ? "Linked" : "Required") : "Not needed",
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
              <div className="space-y-2 text-sm">
                <EntityRow
                  title={selectedCustomer?.name ?? "Customer required"}
                  subtitle={selectedCustomer ? `${selectedCustomer.phone} • ${selectedCustomer.lastVisit}` : "Link a customer before checkout."}
                  meta={<StatusPill tone={selectedCustomer ? "dark" : "warn"}>{selectedCustomer ? "Linked" : "Missing"}</StatusPill>}
                />
                {pickupRequired ? (
                  <EntityRow
                    title="Pickup handoff"
                    subtitle={
                      formattedPickup && order.fulfillment.pickupLocation
                        ? `${formattedPickup} • ${order.fulfillment.pickupLocation}`
                        : "Pickup date, time, and location required."
                    }
                    meta={<StatusPill tone={!summaryGuardrail.missingPickup ? "dark" : "warn"}>{!summaryGuardrail.missingPickup ? "Ready" : "Missing"}</StatusPill>}
                  />
                ) : null}
              </div>
            </PanelSection>

            <PanelSection title="Line items" action={<span className="text-sm font-medium text-[var(--app-text)]">{lineItems.length}</span>}>
              <div className="space-y-2">
                {lineItems.map((item) => (
                  <div key={item.id} className="app-entity-row">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[var(--app-text)]">{item.title}</div>
                      <div className="mt-1 text-sm leading-relaxed text-[var(--app-text-muted)]">{item.subtitle}</div>
                    </div>
                    <div className="shrink-0 self-start pl-4 text-sm font-semibold text-[var(--app-text)]">
                      {formatSummaryCurrency(item.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </PanelSection>

            <Card className="p-4">
              <div className="mb-3 font-semibold text-[var(--app-text)]">Financials</div>
              <div className="mb-4 space-y-2 text-sm">
                <EntityRow title="Alterations" meta={<span className="font-semibold text-[var(--app-text)]">{formatSummaryCurrency(pricing.alterationsSubtotal)}</span>} />
                <EntityRow title="Custom garments" meta={<span className="font-semibold text-[var(--app-text)]">{formatSummaryCurrency(pricing.customSubtotal)}</span>} />
                <EntityRow title="Tax" meta={<span className="font-semibold text-[var(--app-text)]">{formatSummaryCurrency(pricing.taxAmount)}</span>} />
                <EntityRow title="Deposit due today" meta={<StatusPill tone={hasCustom ? "dark" : "default"}>{hasCustom ? formatSummaryCurrency(pricing.depositDue) : "None"}</StatusPill>} />
                <EntityRow title="Order total" meta={<span className="font-semibold text-[var(--app-text)]">{formatSummaryCurrency(pricing.total)}</span>} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ActionButton tone="secondary" onClick={() => onScreenChange("order")}>
                  Revise order
                </ActionButton>
                <ActionButton tone="primary" disabled={checkoutBlocked}>
                  {`Send ${formatSummaryCurrency(checkoutCollectionAmount)} to Square`}
                </ActionButton>
              </div>
            </Card>
          </div>
        )}
      </Card>

      <div className="space-y-4">
        <Card className="border-dashed p-3 opacity-90">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--app-text-soft)]">Ops checks</div>
          <div className="overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)]">
            <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-3 border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--app-text-soft)]">
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
                detail: checkoutBlocked ? "Waiting on order setup" : `Queue ${formatSummaryCurrency(checkoutCollectionAmount)} to collect`,
                tone: checkoutBlocked ? "warn" : "default",
                status: checkoutBlocked ? "Pending" : "Pending send",
              },
              {
                label: "Payment collection",
                detail: hasCustom ? "Deposit due today" : orderType === "alteration" ? "Collect at terminal" : "Not ready",
                tone: hasCustom || orderType === "alteration" ? "default" : "warn",
                status: hasCustom ? "Deposit due" : orderType === "alteration" ? "At terminal" : "Blocked",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-3 border-b border-[var(--app-border)] px-3 py-2 text-xs last:border-b-0"
              >
                <span className="font-medium text-[var(--app-text)]">{row.label}</span>
                <span className="text-[var(--app-text-muted)]">{row.detail}</span>
                <StatusPill tone={row.tone as "default" | "dark" | "warn"}>{row.status}</StatusPill>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
