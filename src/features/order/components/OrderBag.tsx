import { CalendarClock, MapPin, ShoppingBag, Trash2 } from "lucide-react";
import type { Customer, OrderBagLineItem, OrderType, PickupSchedule, PricingSummary, WorkflowMode } from "../../../types";
import {
  EmptyState,
  InlineEmptyState,
  PanelSection,
  SectionHeader,
  Surface,
  SummaryStack,
  cx,
} from "../../../components/ui/primitives";
import { ActionButton } from "../../../components/ui/primitives";
import { formatPickupSchedule, getCustomFulfillmentSummary } from "../selectors";
import { PricingSummary as PricingSummaryPanel } from "./PricingSummary";

type OrderBagProps = {
  customer: Customer | null;
  lineItems: OrderBagLineItem[];
  pricing: PricingSummary;
  orderType: OrderType | null;
  activeWorkflow: WorkflowMode | null;
  continueLabel: string;
  pickupRequired: boolean;
  pickupSchedules: Record<WorkflowMode, PickupSchedule>;
  onOpenCustomerModal: () => void;
  onOpenPickupModal: (scope: WorkflowMode) => void;
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
  pickupSchedules,
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
  const visiblePickupScopes = orderType === "mixed"
    ? (["alteration", "custom"] as WorkflowMode[])
    : orderType === "alteration"
      ? (["alteration"] as WorkflowMode[])
      : orderType === "custom"
        ? (["custom"] as WorkflowMode[])
        : [];
  const showAlterationSchedulingCtas = orderType === "alteration";
  const pickupSectionTitles: Record<WorkflowMode, string> = {
    alteration: orderType === "mixed" ? "Alteration pickup" : "Pickup",
    custom: orderType === "mixed" ? "Custom pickup" : "Pickup",
  };

  return (
    <Surface tone="support" className="sticky top-0 p-3.5">
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
              className="inline-flex items-center app-text-overline text-[var(--app-text-soft)] transition hover:text-[var(--app-text)]"
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

        {pickupRequired ? visiblePickupScopes.map((scope) => {
          const schedule = pickupSchedules[scope];
          const hasPickup = Boolean(schedule.pickupDate && schedule.pickupTime && schedule.pickupLocation);
          const formattedPickupSchedule = hasPickup ? formatPickupSchedule(schedule.pickupDate, schedule.pickupTime) : null;

          return (
            <PanelSection
              key={scope}
              title={pickupSectionTitles[scope]}
              className="border-0 bg-transparent p-0"
              action={
                <ActionButton
                  tone="quiet"
                  onClick={() => onOpenPickupModal(scope)}
                  className="min-h-8 px-3 py-1.5 text-xs"
                >
                  {hasPickup ? "Edit" : "Set pickup"}
                </ActionButton>
              }
            >
              {hasPickup ? (
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
                      <div className="app-text-body mt-1 font-medium leading-[1.45]">{schedule.pickupLocation}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <InlineEmptyState className="border-[var(--app-border-strong)] px-3.5 py-3.5">
                  <div className="app-text-body font-medium">
                    {scope === "custom" ? "Custom order timing" : "Pickup details needed"}
                  </div>
                  <div className="app-text-caption mt-1">
                    {scope === "custom"
                      ? (
                        getCustomFulfillmentSummary(schedule.eventType, schedule.eventDate, schedule.pickupLocation)
                      )
                      : "Set the pickup date, time, and location before moving this order forward."}
                  </div>
                </InlineEmptyState>
              )}
            </PanelSection>
          );
        }) : null}

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
    </Surface>
  );
}
