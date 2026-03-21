import { CalendarClock, MapPin, ShoppingBag, Trash2 } from "lucide-react";
import type { Customer, OrderBagLineItem, OrderType, PickupLocation, PricingSummary, WorkflowMode } from "../../../types";
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
  pricing: PricingSummary;
  orderType: OrderType | null;
  activeWorkflow: WorkflowMode | null;
  continueLabel: string;
  pickupRequired: boolean;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: PickupLocation | "";
  onOpenCustomerModal: () => void;
  onOpenPickupModal: () => void;
  onEditAlterationItem: (itemId: number) => void;
  onEditCustomItem: (itemId: number) => void;
  onRequestRemoveItem: (kind: WorkflowMode, itemId: number) => void;
  onClearCart: () => void;
  onContinue: () => void;
  onSchedulePayLater: () => void;
  onSchedulePrepay: () => void;
  continueDisabled: boolean;
  continueDisabledReason?: string;
  onShowDisabledReason?: (reason: string) => void;
};

export function OrderBag({
  customer,
  lineItems,
  pricing,
  orderType,
  activeWorkflow,
  continueLabel,
  pickupRequired,
  pickupDate,
  pickupTime,
  pickupLocation,
  onOpenCustomerModal,
  onOpenPickupModal,
  onEditAlterationItem,
  onEditCustomItem,
  onRequestRemoveItem,
  onClearCart,
  onContinue,
  onSchedulePayLater,
  onSchedulePrepay,
  continueDisabled,
  continueDisabledReason,
  onShowDisabledReason,
}: OrderBagProps) {
  const formattedPickupSchedule = formatPickupSchedule(pickupDate, pickupTime);
  const showAlterationSchedulingCtas = orderType === "alteration";

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

      <SummaryStack className="space-y-4 text-sm">
        <PanelSection
          title="Payer"
          className="border-0 bg-transparent p-0"
          action={
            <button
              onClick={onOpenCustomerModal}
              className="text-xs font-medium text-[var(--app-text-muted)] underline decoration-[var(--app-border-strong)] underline-offset-2 hover:text-[var(--app-text)]"
            >
              Change
            </button>
          }
        >
          <div className="px-1 py-0.5">
            <div className="app-text-strong">{customer?.name ?? "Payer required"}</div>
            <div className="app-text-caption mt-1">{customer?.phone ?? "Link the paying customer"}</div>
          </div>
        </PanelSection>

        <PanelSection title="Items" className="border-0 bg-transparent p-0">
          {lineItems.length > 0 ? (
            <div className="max-h-[280px] overflow-auto">
              {lineItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={
                    item.itemId
                      ? () => {
                          if (item.kind === "alteration" && item.editable) {
                            onEditAlterationItem(item.itemId);
                          }

                          if (item.kind === "custom") {
                            onEditCustomItem(item.itemId);
                          }
                        }
                      : undefined
                  }
                  className={cx(
                    "group rounded-[var(--app-radius-sm)] px-1 py-3.5",
                    index > 0 && "border-t border-[var(--app-border)]/45",
                    item.itemId && "cursor-pointer transition-colors hover:bg-[var(--app-surface-muted)]/45",
                  )}
                >
                  <div className="flex items-start justify-between gap-3 px-3">
                    <div className="min-w-0 flex-1">
                      <div className="app-text-body font-medium">{item.title}</div>
                      {item.subtitle ? <div className="app-text-caption mt-2 whitespace-pre-line leading-[1.7]">{item.subtitle}</div> : null}
                    </div>
                    <div className="flex min-w-[104px] shrink-0 flex-col items-end gap-2.5 pl-3 pt-0.5 text-right">
                      <div className="app-text-strong">${item.amount.toFixed(2)}</div>
                      {item.removable && item.itemId ? (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onRequestRemoveItem(item.kind, item.itemId!);
                          }}
                          className="inline-flex min-h-8 items-center gap-1 rounded-[var(--app-radius-sm)] border border-transparent px-2 text-[12px] font-medium text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-danger-text)] focus:bg-[var(--app-surface-muted)] focus:text-[var(--app-danger-text)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
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
            className="border-0 bg-transparent p-0"
            action={
              <ActionButton
                tone="quiet"
                onClick={onOpenPickupModal}
                className="min-h-8 px-3 py-1.5 text-xs"
              >
                {pickupDate && pickupTime && pickupLocation ? "Edit" : "Set pickup"}
              </ActionButton>
            }
          >
            <div>
              {pickupDate && pickupTime && pickupLocation ? (
                <div className="rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)]/20 px-3.5 py-3.5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-[var(--app-radius-sm)] bg-[var(--app-surface-muted)] p-2">
                      <CalendarClock className="h-4 w-4 text-[var(--app-text-soft)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="app-text-overline">Pickup schedule</div>
                      <div className="app-text-body mt-1 font-medium leading-[1.45]">{formattedPickupSchedule}</div>
                    </div>
                  </div>
                  <div className="my-3 border-t border-[var(--app-border)]/70" />
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-[var(--app-radius-sm)] bg-[var(--app-surface-muted)] p-2">
                      <MapPin className="h-4 w-4 text-[var(--app-text-soft)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="app-text-overline">Pickup location</div>
                      <div className="app-text-body mt-1 font-medium leading-[1.45]">{pickupLocation}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[var(--app-radius-md)] border border-dashed border-[var(--app-border-strong)] bg-[var(--app-surface-muted)]/20 px-3.5 py-3.5">
                  <div className="app-text-body font-medium">Pickup details needed</div>
                  <div className="app-text-caption mt-1">Set the pickup date, time, and location before moving this order forward.</div>
                </div>
              )}
            </div>
          </PanelSection>
        ) : null}

        {lineItems.length > 0 ? (
          <PricingSummaryPanel pricing={pricing} />
        ) : (
          <EmptyState>No summary yet.</EmptyState>
        )}

        {showAlterationSchedulingCtas ? (
          <div className="grid grid-cols-2 gap-2 border-t border-[var(--app-border)] pt-3">
            <ActionButton
              tone="primary"
              disabled={continueDisabled}
              disabledReason={continueDisabledReason}
              onDisabledPress={onShowDisabledReason}
              onClick={onSchedulePayLater}
            >
              Schedule Order and Pay Later
            </ActionButton>
            <ActionButton
              tone="secondary"
              disabled={continueDisabled}
              disabledReason={continueDisabledReason}
              onDisabledPress={onShowDisabledReason}
              onClick={onSchedulePrepay}
            >
              Schedule Order and Prepay Now
            </ActionButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 border-t border-[var(--app-border)] pt-3">
            <ActionButton
              tone="primary"
              disabled={continueDisabled}
              disabledReason={continueDisabledReason}
              onDisabledPress={onShowDisabledReason}
              onClick={onContinue}
            >
              {continueLabel}
            </ActionButton>
          </div>
        )}
      </SummaryStack>
    </Card>
  );
}
