import { ArrowLeft, ArrowRight, Save, Tag } from "lucide-react";
import type { Customer } from "../../../types";
import { ActionButton } from "../../../components/ui/primitives";
import type { MeasurementSetDisplay } from "../types";

type MeasurementOrderContext = {
  eyebrow: string;
  title: string;
  detail: string;
  note: string;
};

type CurrentOrderMeasurementCardProps = {
  customer: Customer | null;
  activeSetDisplay: MeasurementSetDisplay | null;
  hasEnteredMeasurements: boolean;
  orderContext: MeasurementOrderContext | null;
  hasCheckoutPath: boolean;
  onSaveCurrentSet: () => void;
  onSaveAsNewSet: () => void;
  onBackToOrder: () => void;
  checkoutDisabledReason?: string;
  onCheckout: () => void;
};

export function CurrentOrderMeasurementCard({
  customer,
  activeSetDisplay,
  hasEnteredMeasurements,
  orderContext,
  hasCheckoutPath,
  onSaveCurrentSet,
  onSaveAsNewSet,
  onBackToOrder,
  checkoutDisabledReason,
  onCheckout,
}: CurrentOrderMeasurementCardProps) {
  const currentSetTitle = (() => {
    if (activeSetDisplay) {
      return `${activeSetDisplay.title} • ${activeSetDisplay.version}`;
    }
    if (hasEnteredMeasurements) {
      return "Unsaved measurements";
    }
    return "No set selected";
  })();

  const currentSetDetail = (() => {
    if (activeSetDisplay) {
      return activeSetDisplay.subline ?? "Saved set";
    }
    if (hasEnteredMeasurements) {
      return customer ? "These edits are only in the current workspace until you save them." : "Choose a customer before saving this set.";
    }
    return customer ? "Choose a saved set or start entering measurements." : "Choose a customer to load or save measurement sets.";
  })();

  const primarySaveLabel = activeSetDisplay ? "Update set" : "Save set";

  return (
    <div>
      <div className="mb-4">
        <div className="app-text-overline">{orderContext ? "Current item" : "Current set"}</div>
        <div className="app-text-value mt-1">{orderContext ? orderContext.title : currentSetTitle}</div>
        <div className="app-text-caption mt-1">{orderContext ? orderContext.detail : currentSetDetail}</div>
      </div>

      <div className="mb-5 border-t border-b border-[var(--app-border)]/32 py-3">
        {orderContext ? (
          <>
            <div className="app-text-overline">{orderContext.eyebrow}</div>
            <div className="app-text-caption mt-1">{orderContext.note}</div>
          </>
        ) : (
          <>
            <div className="app-text-overline">Save status</div>
            <div className="app-text-caption mt-1">{currentSetDetail}</div>
          </>
        )}

        {orderContext ? (
          <div className="mt-3 border-t border-[var(--app-border)]/38 pt-3">
            <div className="app-text-overline">Current set</div>
            <div className="app-text-strong mt-1">{currentSetTitle}</div>
            <div className="app-text-caption mt-1">{currentSetDetail}</div>
          </div>
        ) : null}
      </div>

      <div className="mb-2 app-text-overline">Save current measurements</div>
      <div className="space-y-2">
        <ActionButton
          tone="primary"
          className="flex min-h-11 w-full items-center justify-center gap-2 px-3 py-2 text-center"
          onClick={onSaveCurrentSet}
          disabled={!customer}
        >
          <Tag className="h-4 w-4" />
          <span>{primarySaveLabel}</span>
        </ActionButton>
        <ActionButton
          tone="secondary"
          className="flex min-h-10 w-full items-center justify-center gap-2 px-3 py-2 text-center"
          onClick={onSaveAsNewSet}
          disabled={!customer}
        >
          <Save className="h-4 w-4" />
          <span>Save as new set</span>
        </ActionButton>
      </div>

      {orderContext ? <div className="mb-2 mt-5 app-text-overline">Order actions</div> : null}
      {orderContext ? (
        <div className="space-y-2">
          <ActionButton tone="secondary" className="flex min-h-10 w-full items-center justify-center gap-2 px-3 py-2 text-center" onClick={onBackToOrder}>
            <ArrowLeft className="h-4 w-4" />
            <span>Back to order</span>
          </ActionButton>
          {hasCheckoutPath ? (
            <ActionButton
              tone="primary"
              className="flex min-h-10 w-full items-center justify-center gap-2 px-3 py-2 text-center"
              onClick={onCheckout}
              disabled={Boolean(checkoutDisabledReason)}
              title={checkoutDisabledReason}
            >
              <ArrowRight className="h-4 w-4" />
              <span>Review order</span>
            </ActionButton>
          ) : null}
        </div>
      ) : null}

      {orderContext && hasCheckoutPath && checkoutDisabledReason ? (
        <div className="app-text-caption mt-3">{checkoutDisabledReason}</div>
      ) : null}
    </div>
  );
}
