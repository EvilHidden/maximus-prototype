import { ArrowRight, Save, Tag, UserRound } from "lucide-react";
import type { Customer } from "../../../types";
import { ActionButton, Card } from "../../../components/ui/primitives";
import type { MeasurementSetDisplay } from "../types";

type CurrentOrderMeasurementCardProps = {
  customer: Customer | null;
  activeSetDisplay: MeasurementSetDisplay | null;
  hasEnteredMeasurements: boolean;
  onOpenSaveDraft: () => void;
  onOpenSaveSet: () => void;
  onOpenCustomerModal: () => void;
  onCheckout: () => void;
};

export function CurrentOrderMeasurementCard({
  customer,
  activeSetDisplay,
  hasEnteredMeasurements,
  onOpenSaveDraft,
  onOpenSaveSet,
  onOpenCustomerModal,
  onCheckout,
}: CurrentOrderMeasurementCardProps) {
  return (
    <Card className="p-4">
      <div className="mb-4 border-b border-[var(--app-border)] pb-3">
        <div className="app-text-strong">Current order</div>
        <div className="app-text-caption mt-1">Active link and save actions</div>
      </div>
      <div className="mb-4 flex items-start gap-3 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3">
        <div className="app-icon-chip">
          <UserRound className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="app-text-value">{customer?.name ?? "Customer required"}</div>
          <div className="app-text-body-muted mt-1">
            {customer ? "Measurements will stay attached to this active order." : "Link the customer here before checkout."}
          </div>
          {activeSetDisplay ? (
            <div className="app-text-overline mt-2">
              {activeSetDisplay.title}
              {activeSetDisplay.subline ? ` • ${activeSetDisplay.subline}` : ""}
            </div>
          ) : hasEnteredMeasurements ? (
            <div className="app-text-overline mt-2">New unsaved set in progress</div>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ActionButton
          tone="secondary"
          className="flex min-h-11 flex-col items-center justify-center gap-1 px-2 py-2 text-center"
          onClick={onOpenSaveDraft}
          disabled={!customer}
        >
          <Save className="h-4 w-4" />
          <span className="app-text-overline">Draft</span>
        </ActionButton>
        <ActionButton
          tone="secondary"
          className="flex min-h-11 flex-col items-center justify-center gap-1 px-2 py-2 text-center"
          onClick={onOpenSaveSet}
          disabled={!customer}
        >
          <Tag className="h-4 w-4" />
          <span className="app-text-overline">Save</span>
        </ActionButton>
        <ActionButton
          tone="secondary"
          className="flex min-h-11 flex-col items-center justify-center gap-1 px-2 py-2 text-center"
          onClick={onOpenCustomerModal}
        >
          <UserRound className="h-4 w-4" />
          <span className="app-text-overline">{customer ? "Customer" : "Link"}</span>
        </ActionButton>
        <ActionButton
          tone="primary"
          className="flex min-h-11 flex-col items-center justify-center gap-1 px-2 py-2 text-center"
          onClick={onCheckout}
          disabled={!customer}
        >
          <ArrowRight className="h-4 w-4" />
          <span className="app-text-overline">Checkout</span>
        </ActionButton>
      </div>
    </Card>
  );
}
