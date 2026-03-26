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
  onOpenSaveDraft: () => void;
  onOpenSaveSet: () => void;
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
  onOpenSaveDraft,
  onOpenSaveSet,
  onBackToOrder,
  checkoutDisabledReason,
  onCheckout,
}: CurrentOrderMeasurementCardProps) {
  return (
    <div>
      <div className="mb-4">
        <div className="app-text-overline">Use with order</div>
        <div className="app-text-value mt-1">{orderContext ? "Current item" : "No active order item"}</div>
      </div>

      <div className="mb-4 border-t border-b border-[var(--app-border)]/32 py-3">
        {orderContext ? (
          <>
            <div className="app-text-overline">{orderContext.eyebrow}</div>
            <div className="app-text-strong mt-1">{orderContext.title}</div>
            <div className="app-text-caption mt-1">{orderContext.detail}</div>
            <div className="app-text-caption mt-2">{orderContext.note}</div>
          </>
        ) : (
          <>
            <div className="app-text-overline">Measurement lookup</div>
            <div className="app-text-strong mt-1">Not tied to an order</div>
            <div className="app-text-caption mt-1">You can review saved sets here without building an order.</div>
          </>
        )}

        <div className="mt-3 border-t border-[var(--app-border)]/38 pt-3">
          <div className="app-text-overline">Saved status</div>
          {activeSetDisplay ? (
            <div className="mt-1">
              <div className="app-text-body">
                {activeSetDisplay.title} • {activeSetDisplay.version}
              </div>
              {activeSetDisplay.subline ? <div className="app-text-caption mt-1">{activeSetDisplay.subline}</div> : null}
            </div>
          ) : hasEnteredMeasurements ? (
            <div className="app-text-body-muted mt-1">New set not saved yet.</div>
          ) : (
            <div className="app-text-body-muted mt-1">No saved set linked yet.</div>
          )}
        </div>
      </div>

      <div className="mb-2 app-text-overline">Save measurements</div>
      <div className="grid gap-2 sm:grid-cols-2">
        <ActionButton
          tone="secondary"
          className="flex min-h-10 items-center justify-center gap-2 px-3 py-2 text-center"
          onClick={onOpenSaveDraft}
          disabled={!customer}
        >
          <Save className="h-4 w-4" />
          <span>Save working draft</span>
        </ActionButton>
        <ActionButton
          tone="secondary"
          className="flex min-h-10 items-center justify-center gap-2 px-3 py-2 text-center"
          onClick={onOpenSaveSet}
          disabled={!customer}
        >
          <Tag className="h-4 w-4" />
          <span>Save to customer</span>
        </ActionButton>
      </div>

      {orderContext ? <div className="mb-2 mt-4 app-text-overline">Order actions</div> : null}
      {orderContext ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <ActionButton tone="secondary" className="flex min-h-10 items-center justify-center gap-2 px-3 py-2 text-center" onClick={onBackToOrder}>
            <ArrowLeft className="h-4 w-4" />
            <span>Back to order</span>
          </ActionButton>
          {hasCheckoutPath ? (
            <ActionButton
              tone="primary"
              className="flex min-h-10 items-center justify-center gap-2 px-3 py-2 text-center"
              onClick={onCheckout}
              disabled={Boolean(checkoutDisabledReason)}
              title={checkoutDisabledReason}
            >
              <ArrowRight className="h-4 w-4" />
              <span>Go to checkout</span>
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
