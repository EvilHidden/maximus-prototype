import { CalendarClock, MapPin, ShoppingBag, Trash2, UserRound } from "lucide-react";
import type { Customer, OrderBagLineItem, OrderType, OrderWorkflowState, PricingSummary, WorkflowMode } from "../../../types";
import {
  EmptyState,
  InlineEmptyState,
  PanelSection,
  StatusPill,
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
  pickupSchedules: OrderWorkflowState["fulfillment"];
  onOpenCustomerModal: () => void;
  onOpenPickupModal: (scope: WorkflowMode) => void;
  onEditAlterationItem: (itemId: number) => void;
  onEditCustomItem: (itemId: number) => void;
  onRequestRemoveItem: (kind: WorkflowMode, itemId: number) => void;
  onClearCart: () => void;
  onContinue: () => void;
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
  const pickupSectionTitles: Record<WorkflowMode, string> = {
    alteration: orderType === "mixed" ? "Alteration pickup" : "Pickup",
    custom: orderType === "mixed" ? "Custom occasion" : "Occasion",
  };

  return (
    <Surface tone="support" className="app-support-rail-fixed w-full p-3.5 app-order-bag">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShoppingBag className="mt-0.5 h-4 w-4 text-[var(--app-text-soft)]" />
          <div>
            <h2 className="app-section-title">Cart</h2>
            <p className="app-section-copy">{lineItems.length === 1 ? "1 item" : `${lineItems.length} items`}</p>
          </div>
        </div>
        {lineItems.length > 0 ? (
          <ActionButton tone="quiet" className="px-3 py-2 text-xs" onClick={onClearCart}>
            Clear cart
          </ActionButton>
        ) : null}
      </div>

      <SummaryStack className="space-y-4 text-sm">
        <PanelSection
          title="Paying customer"
          className="border-0 bg-transparent p-0"
        >
          <button
            onClick={onOpenCustomerModal}
            className="flex w-full items-start gap-3 rounded-[var(--app-radius-md)] px-1 py-1.5 text-left transition hover:bg-[var(--app-surface-muted)]/38"
          >
            <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-[var(--app-text-soft)]" />
            <div className="min-w-0 flex-1">
              <div className="app-text-strong">{customer?.name ?? "Customer required"}</div>
              <div className="app-text-caption mt-1">{customer?.phone ?? "Choose the customer paying for this order"}</div>
            </div>
            <div className="app-kicker shrink-0 pt-0.5 text-[var(--app-text-soft)]">Change</div>
          </button>
        </PanelSection>

        <PanelSection title="Items" className="border-0 bg-transparent p-0">
          {lineItems.length > 0 ? (
            <div>
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
                    index > 0 && "border-t border-[var(--app-border-strong)]/55",
                    item.itemId && "cursor-pointer transition-colors hover:bg-[var(--app-surface-muted)]/45",
                  )}
                >
                  <div className="space-y-2.5 px-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="app-kicker inline-flex items-center whitespace-nowrap text-[var(--app-text-muted)]">
                            {index + 1}. {item.kind === "custom" ? "Custom garment" : "Alteration"}
                          </div>
                          {item.isRush ? (
                            <StatusPill tone="danger" className="shrink-0 align-middle">
                              Rush
                            </StatusPill>
                          ) : null}
                        </div>
                        <div className="mt-1 app-text-strong leading-tight">{item.garmentLabel}</div>
                      </div>
                      <div className="flex min-w-[96px] shrink-0 flex-col items-end gap-2 text-right">
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
                    {item.subtitle ? (
                      item.kind === "custom" ? (
                        <div className="space-y-1.5">
                          {item.subtitle.split("\n").map((line, lineIndex) => {
                            if (lineIndex === 0) {
                              return (
                                <div
                                  key={`${item.id}-detail-${lineIndex}`}
                                  className="app-text-body-muted leading-[1.55]"
                                >
                                  {line}
                                </div>
                              );
                            }

                            const detailLabel = lineIndex === 1 ? "Style" : lineIndex === 2 ? "Build" : "Mono";

                            return (
                              <div
                                key={`${item.id}-detail-${lineIndex}`}
                                className="grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-2.5"
                              >
                                <div className="app-kicker pt-[0.08rem] text-[var(--app-text-muted)]">{detailLabel}</div>
                                <div className="app-text-caption leading-[1.65]">{line}</div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="app-text-caption whitespace-pre-line leading-[1.7]">{item.subtitle}</div>
                      )
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No items added yet.</EmptyState>
          )}
        </PanelSection>

        {pickupRequired ? visiblePickupScopes.map((scope) => {
          if (scope === "custom") {
            const customOccasion = pickupSchedules.custom;
            const hasOccasion = customOccasion.eventType !== "none";

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
                    {hasOccasion ? "Edit occasion" : "Add occasion"}
                  </ActionButton>
                }
              >
                {hasOccasion ? (
                  <div className="rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)]/26 px-3.5 py-3.5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-[var(--app-radius-sm)] bg-[var(--app-surface-muted)]/85 p-2">
                        <CalendarClock className="h-4 w-4 text-[var(--app-text-muted)]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="app-kicker text-[var(--app-text-muted)]">Occasion</div>
                        <div className="app-text-body mt-1 font-medium leading-[1.45]">
                          {getCustomFulfillmentSummary(customOccasion.eventType, customOccasion.eventDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <InlineEmptyState className="border-[var(--app-border-strong)]/70 bg-[var(--app-surface)]/26 px-3.5 py-3.5">
                    <div className="app-text-body font-medium">No occasion set</div>
                    <div className="app-text-caption mt-1">
                      Add an occasion only if this garment is tied to a wedding, prom, anniversary, or another dated event.
                    </div>
                  </InlineEmptyState>
                )}
              </PanelSection>
            );
          }

          const alterationPickup = pickupSchedules.alteration;
          const hasPickup = Boolean(alterationPickup.pickupDate && alterationPickup.pickupTime && alterationPickup.pickupLocation);
          const formattedPickupSchedule = hasPickup
            ? formatPickupSchedule(alterationPickup.pickupDate, alterationPickup.pickupTime)
            : null;

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
                <div className="rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)]/26 px-3.5 py-3.5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-[var(--app-radius-sm)] bg-[var(--app-surface-muted)]/85 p-2">
                      <CalendarClock className="h-4 w-4 text-[var(--app-text-muted)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="app-kicker text-[var(--app-text-muted)]">Pickup time</div>
                      <div className="app-text-body mt-1 font-medium leading-[1.45]">{formattedPickupSchedule}</div>
                    </div>
                  </div>
                  <div className="my-3 border-t border-[var(--app-border-strong)]/45" />
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-[var(--app-radius-sm)] bg-[var(--app-surface-muted)]/85 p-2">
                      <MapPin className="h-4 w-4 text-[var(--app-text-muted)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="app-kicker text-[var(--app-text-muted)]">Pickup location</div>
                      <div className="app-text-body mt-1 font-medium leading-[1.45]">{alterationPickup.pickupLocation}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <InlineEmptyState className="border-[var(--app-border-strong)]/70 bg-[var(--app-surface)]/26 px-3.5 py-3.5">
                  <div className="app-text-body font-medium">Pickup details needed</div>
                  <div className="app-text-caption mt-1">Set the pickup date, time, and location before you continue.</div>
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

        <div className="grid grid-cols-1 gap-2 border-t border-[var(--app-border-strong)]/50 pt-3">
          <ActionButton
            tone="primary"
            onClick={() => {
              if (continueDisabled) {
                if (continueDisabledReason && onShowDisabledReason) {
                  onShowDisabledReason(continueDisabledReason);
                }
                return;
              }

              onContinue();
            }}
          >
            {continueLabel}
          </ActionButton>
        </div>
      </SummaryStack>
    </Surface>
  );
}
