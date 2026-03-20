import { Clock, ShoppingBag, Trash2 } from "lucide-react";
import type { Customer, OrderBagLineItem, PickupLocation, PricingSummary, WorkflowMode } from "../../../types";
import {
  ActionButton,
  Card,
  EmptyState,
  PanelSection,
  SectionHeader,
  SummaryStack,
  cx,
} from "../../../components/ui/primitives";
import { formatPickupSchedule } from "../selectors";
import { PricingSummary as PricingSummaryPanel } from "./PricingSummary";

type OrderBagProps = {
  customer: Customer | null;
  lineItems: OrderBagLineItem[];
  customDraft: OrderBagLineItem | null;
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
  onRequestRemoveItem: (kind: WorkflowMode, itemId: number) => void;
  onClearCart: () => void;
  onContinue: () => void;
  continueDisabled: boolean;
};

export function OrderBag({
  customer,
  lineItems,
  customDraft,
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
    <Card className="sticky top-0 p-3.5">
      <SectionHeader
        icon={ShoppingBag}
        title="Cart"
        subtitle={lineItems.length === 1 ? "1 item" : `${lineItems.length} items`}
        action={
          lineItems.length > 0 ? (
            <ActionButton tone="quiet" className="px-3 py-2 text-xs" onClick={onClearCart}>
              Clear cart
            </ActionButton>
          ) : null
        }
      />

      <SummaryStack className="text-sm">
        {customDraft ? (
          <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--app-text-soft)]">Active custom build</div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[var(--app-text)]">{customDraft.title.replace("Draft custom garment - ", "")}</div>
                {customDraft.subtitle ? <div className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[var(--app-text-soft)]">{customDraft.subtitle}</div> : null}
              </div>
              <div className="shrink-0 text-[15px] font-semibold tracking-[-0.01em] text-[var(--app-text)]">{`$${customDraft.amount.toFixed(2)}`}</div>
            </div>
          </div>
        ) : null}

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
          <div className="mt-0.5 text-xs text-[var(--app-text-muted)]">{customer?.phone ?? "Customer required"}</div>
        </PanelSection>

        <PanelSection title="Items">
          {lineItems.length > 0 ? (
            <div className="max-h-[280px] space-y-2 overflow-auto">
              {lineItems.map((item) => (
                <div
                  key={item.id}
                  onClick={item.editable && item.itemId ? () => onEditAlterationItem(item.itemId!) : undefined}
                  className={cx(
                    "rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3",
                    item.editable && item.itemId && "cursor-pointer transition-colors hover:bg-[var(--app-surface-muted)]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[var(--app-text)]">{item.title}</div>
                      {item.subtitle ? <div className="mt-1 text-[11px] uppercase tracking-[0.08em] leading-relaxed text-[var(--app-text-soft)]">{item.subtitle}</div> : null}
                    </div>
                    <div className="shrink-0 text-sm font-semibold text-[var(--app-text)]">${item.amount.toFixed(2)}</div>
                  </div>
                  {item.removable && item.itemId ? (
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onRequestRemoveItem(item.kind, item.itemId!);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--app-danger-text)] hover:opacity-80"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  ) : null}
                </div>
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

        <div className="grid grid-cols-2 gap-2 border-t border-[var(--app-border)] pt-3">
          <ActionButton tone="secondary">Save draft</ActionButton>
          <ActionButton tone="primary" disabled={continueDisabled} onClick={onContinue}>
            {continueLabel}
          </ActionButton>
        </div>
      </SummaryStack>
    </Card>
  );
}
