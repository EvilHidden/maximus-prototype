import { CreditCard, PackageCheck, Receipt, UserRound } from "lucide-react";
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
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
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
                  <EntityRow
                    key={item.id}
                    title={item.title}
                    subtitle={item.subtitle}
                    meta={<div className="text-sm font-semibold text-[var(--app-text)]">{formatSummaryCurrency(item.amount)}</div>}
                  />
                ))}
              </div>
            </PanelSection>

            <PanelSection title="Checkout sequence">
              <div className="space-y-3 text-sm text-[var(--app-text-muted)]">
                <div className="app-panel-section">
                  <div className="mb-1 flex items-center gap-2 font-semibold text-[var(--app-text)]">
                    <UserRound className="h-4 w-4" />
                    1. Confirm customer and pickup
                  </div>
                  <div>Make sure the bag is linked to the right client and pickup handoff before syncing downstream systems.</div>
                </div>
                <div className="app-panel-section">
                  <div className="mb-1 flex items-center gap-2 font-semibold text-[var(--app-text)]">
                    <Receipt className="h-4 w-4" />
                    2. Save operational records
                  </div>
                  <div>Write the order, line items, measurements, and pickup metadata into Airtable.</div>
                </div>
                <div className="app-panel-section">
                  <div className="mb-1 flex items-center gap-2 font-semibold text-[var(--app-text)]">
                    <PackageCheck className="h-4 w-4" />
                    3. Send to Square and collect
                  </div>
                  <div>
                    {hasCustom
                      ? `Collect ${formatSummaryCurrency(checkoutCollectionAmount)} now, then sync the order to Square.`
                      : "Push the order to Square and complete payment at the terminal."}
                  </div>
                </div>
              </div>
            </PanelSection>
          </div>
        )}
      </Card>

      <div className="space-y-4">
        <Card className="p-4">
          <div className="mb-3 font-semibold text-[var(--app-text)]">Readiness</div>
          <div className="space-y-2">
            {checklist.map((item) => (
              <EntityRow
                key={item.label}
                title={item.label}
                subtitle={item.value}
                meta={<StatusPill tone={item.ready ? "dark" : "warn"}>{item.ready ? "Ready" : "Needs work"}</StatusPill>}
              />
            ))}
          </div>
        </Card>

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

        <Card className="p-4">
          <div className="mb-3 font-semibold text-[var(--app-text)]">Sync status</div>
          <div className="mb-4 space-y-2 text-sm">
            <EntityRow title="Airtable write" meta={<StatusPill tone={checkoutBlocked ? "warn" : "dark"}>{checkoutBlocked ? "Blocked" : "Ready"}</StatusPill>} />
            <EntityRow title="Square order" meta={<StatusPill tone={checkoutBlocked ? "warn" : "default"}>{checkoutBlocked ? "Pending setup" : "Pending send"}</StatusPill>} />
            <EntityRow
              title="Payment collection"
              meta={<StatusPill>{hasCustom ? "Deposit due" : orderType === "alteration" ? "At terminal" : "Blocked"}</StatusPill>}
            />
          </div>
          <ActionButton tone="secondary" fullWidth>
            Save draft
          </ActionButton>
        </Card>
      </div>
    </div>
  );
}
