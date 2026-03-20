import { Clock, ShoppingBag, Trash2 } from "lucide-react";
import type { Customer, OrderBagLineItem, PickupLocation, PricingSummary, WorkflowMode } from "../../../types";
import {
  ActionButton,
  Card,
  EmptyState,
  EntityRow,
  PanelSection,
  SectionHeader,
  SummaryStack,
} from "../../../components/ui/primitives";
import { formatPickupSchedule } from "../selectors";
import { PricingSummary as PricingSummaryPanel } from "./PricingSummary";

type OrderBagProps = {
  customer: Customer | null;
  lineItems: OrderBagLineItem[];
  pricing: PricingSummary;
  activeWorkflow: WorkflowMode | null;
  continueLabel: string;
  pickupRequired: boolean;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: PickupLocation | "";
  onOpenCustomerModal: () => void;
  onOpenPickupModal: () => void;
  onEditAlterationItem: (itemId: number) => void;
  onRequestRemoveItem: (itemId: number) => void;
  onClearCart: () => void;
  onContinue: () => void;
  continueDisabled: boolean;
};

export function OrderBag({
  customer,
  lineItems,
  pricing,
  activeWorkflow,
  continueLabel,
  pickupRequired,
  pickupDate,
  pickupTime,
  pickupLocation,
  onOpenCustomerModal,
  onOpenPickupModal,
  onEditAlterationItem,
  onRequestRemoveItem,
  onClearCart,
  onContinue,
  continueDisabled,
}: OrderBagProps) {
  const formattedPickupSchedule = formatPickupSchedule(pickupDate, pickupTime);

  return (
    <Card className="sticky top-0 p-4">
      <SectionHeader
        icon={ShoppingBag}
        title="Order bag"
        subtitle="Cart"
        action={
          lineItems.length > 0 ? (
            <ActionButton tone="quiet" className="px-3 py-2 text-xs" onClick={onClearCart}>
              Clear bag
            </ActionButton>
          ) : null
        }
      />

      <SummaryStack className="text-sm">
        <PanelSection
          title="Customer"
          action={
            <button
              onClick={onOpenCustomerModal}
              className="text-xs font-medium text-[var(--app-text-muted)] underline decoration-[var(--app-border-strong)] underline-offset-2 hover:text-[var(--app-text)]"
            >
              Change
            </button>
          }
        >
          <div className="font-semibold text-[var(--app-text)]">{customer?.name ?? "Customer required"}</div>
          <div className="mt-1 text-xs text-[var(--app-text-muted)]">{customer?.phone ?? "Customer required"}</div>
        </PanelSection>

        <PanelSection title="Items" action={<span className="text-sm font-medium text-[var(--app-text)]">{lineItems.length}</span>}>
          {lineItems.length > 0 ? (
            <div className="max-h-[280px] space-y-2 overflow-auto">
              {lineItems.map((item) => (
                <EntityRow
                  key={item.id}
                  title={item.title}
                  subtitle={item.subtitle}
                  meta={<div className="text-sm font-semibold text-[var(--app-text)]">${item.amount.toFixed(2)}</div>}
                  action={
                    item.removable && item.itemId ? (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onRequestRemoveItem(item.itemId!);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--app-danger-text)] hover:opacity-80"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    ) : undefined
                  }
                  onClick={item.editable && item.itemId ? () => onEditAlterationItem(item.itemId!) : undefined}
                />
              ))}
            </div>
          ) : (
            <EmptyState>No items added yet.</EmptyState>
          )}
        </PanelSection>

        {pickupRequired ? (
          <PanelSection
            title="Pickup"
            action={
              <button
                onClick={onOpenPickupModal}
                className="text-xs font-medium text-[var(--app-text-muted)] underline decoration-[var(--app-border-strong)] underline-offset-2 hover:text-[var(--app-text)]"
              >
                {pickupDate && pickupTime && pickupLocation ? "Change" : "Set"}
              </button>
            }
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--app-text-muted)]">Schedule</span>
                <span className="text-right font-medium text-[var(--app-text)]">{formattedPickupSchedule || "Required"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--app-text-muted)]">Location</span>
                <span className="font-medium text-[var(--app-text)]">{pickupLocation || "Required"}</span>
              </div>
              {!pickupDate || !pickupTime || !pickupLocation ? (
                <EmptyState className="text-xs">Pickup date, time, and location required.</EmptyState>
              ) : null}
            </div>
          </PanelSection>
        ) : null}

        {lineItems.length > 0 ? <PricingSummaryPanel pricing={pricing} /> : <EmptyState>No summary yet.</EmptyState>}

        <div className="grid grid-cols-2 gap-3">
          <ActionButton tone="secondary">Save draft</ActionButton>
          <ActionButton tone="primary" disabled={continueDisabled} onClick={onContinue}>
            {continueLabel}
          </ActionButton>
        </div>
      </SummaryStack>
    </Card>
  );
}
