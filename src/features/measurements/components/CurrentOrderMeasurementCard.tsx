import { ArrowRight, Save, Tag, UserRound } from "lucide-react";
import type { Customer } from "../../../types";
import { ActionButton } from "../../../components/ui/primitives";
import type { MeasurementSetDisplay } from "../types";

type CurrentOrderMeasurementCardProps = {
  customer: Customer | null;
  activeSetDisplay: MeasurementSetDisplay | null;
  hasEnteredMeasurements: boolean;
  onOpenSaveDraft: () => void;
  onOpenSaveSet: () => void;
  onOpenCustomerModal: () => void;
  checkoutDisabledReason?: string;
  onCheckout: () => void;
};

export function CurrentOrderMeasurementCard({
  customer,
  activeSetDisplay,
  hasEnteredMeasurements,
  onOpenSaveDraft,
  onOpenSaveSet,
  onOpenCustomerModal,
  checkoutDisabledReason,
  onCheckout,
}: CurrentOrderMeasurementCardProps) {
  return (
    <div>
      <div className="mb-4">
        <div className="app-text-value">Current order</div>
        <div className="app-text-caption mt-1">Customer, current set, and save actions</div>
      </div>
      <div className="mb-4 flex items-start gap-3 rounded-[var(--app-radius-md)] border border-[var(--app-border)]/40 bg-[var(--app-surface)]/18 px-4 py-3">
        <div className="app-icon-chip">
          <UserRound className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="app-text-value">{customer?.name ?? "Customer required"}</div>
          <div className="app-text-body-muted mt-1">
            {customer ? "These measurements stay with this order." : "Choose the customer here before checkout."}
          </div>
          {activeSetDisplay ? (
            <div className="app-text-overline mt-2">
              {activeSetDisplay.title}
              {activeSetDisplay.subline ? ` • ${activeSetDisplay.subline}` : ""}
            </div>
          ) : hasEnteredMeasurements ? (
            <div className="app-text-overline mt-2">New set not saved yet</div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <ActionButton
          tone="secondary"
          className="flex min-h-12 items-center justify-center gap-2 px-3 py-2 text-center"
          onClick={onOpenSaveDraft}
          disabled={!customer}
        >
          <Save className="h-4 w-4" />
          <span>Save draft</span>
        </ActionButton>
        <ActionButton
          tone="secondary"
          className="flex min-h-12 items-center justify-center gap-2 px-3 py-2 text-center"
          onClick={onOpenSaveSet}
          disabled={!customer}
        >
          <Tag className="h-4 w-4" />
          <span>Save set</span>
        </ActionButton>
        <ActionButton
          tone="secondary"
          className="flex min-h-12 items-center justify-center gap-2 px-3 py-2 text-center"
          onClick={onOpenCustomerModal}
        >
          <UserRound className="h-4 w-4" />
          <span>{customer ? "Change customer" : "Link customer"}</span>
        </ActionButton>
        <ActionButton
          tone="primary"
          className="flex min-h-12 items-center justify-center gap-2 px-3 py-2 text-center"
          onClick={onCheckout}
          disabled={Boolean(checkoutDisabledReason)}
          title={checkoutDisabledReason}
        >
          <ArrowRight className="h-4 w-4" />
          <span>Go to checkout</span>
        </ActionButton>
      </div>
      {checkoutDisabledReason ? (
        <div className="app-text-caption mt-3">
          {checkoutDisabledReason}
        </div>
      ) : null}
    </div>
  );
}
