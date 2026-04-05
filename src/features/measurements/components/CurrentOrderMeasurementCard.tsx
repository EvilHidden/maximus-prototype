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
  mobileCaptureOnly?: boolean;
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
  mobileCaptureOnly = false,
}: CurrentOrderMeasurementCardProps) {
  const currentSetTitle = (() => {
    if (activeSetDisplay) {
      return `${activeSetDisplay.title} • ${activeSetDisplay.version}`;
    }
    if (hasEnteredMeasurements) {
      return "Measurement set";
    }
    return "Measurement set";
  })();

  const primarySaveLabel = "Save measurements";

  if (mobileCaptureOnly) {
    return (
      <div className="app-measurements-status-card app-measurements-status-card--mobile-capture">
        <ActionButton
          tone="primary"
          className="flex min-h-11 w-full items-center justify-center gap-2 px-3 py-2 text-center"
          onClick={onSaveAsNewSet}
          disabled={!customer}
        >
          <Save className="h-4 w-4" />
          <span>Save set</span>
        </ActionButton>
      </div>
    );
  }

  return (
    <div className="app-measurements-status-card">
      <div className="mb-4 space-y-1.5 app-measurements-status-card__summary">
        {orderContext ? <div className="app-text-overline app-measurements-status-card__kicker">{orderContext.eyebrow}</div> : null}
        <div className="app-text-strong app-measurements-status-card__title">
          {orderContext ? orderContext.title : currentSetTitle}
        </div>
        {orderContext ? <div className="app-text-caption app-measurements-status-card__detail">{orderContext.detail}</div> : null}
        {orderContext?.note ? (
          <div className="app-text-caption app-measurements-status-card__note">{orderContext.note}</div>
        ) : null}
      </div>

      <div className="space-y-2 app-measurements-status-card__actions">
        <ActionButton
          tone="primary"
          className="flex min-h-11 w-full items-center justify-center gap-2 px-3 py-2 text-center"
          onClick={onSaveCurrentSet}
          disabled={!customer}
        >
          <Save className="h-4 w-4" />
          <span>{primarySaveLabel}</span>
        </ActionButton>
        <ActionButton
          tone="secondary"
          className="flex min-h-10 w-full items-center justify-center gap-2 px-3 py-2 text-center"
          onClick={onSaveAsNewSet}
          disabled={!customer}
        >
          <Tag className="h-4 w-4" />
          <span>Save a new measurement set</span>
        </ActionButton>
      </div>

      {orderContext ? (
        <div className="mb-2 mt-5 app-text-overline app-measurements-status-card__section-label">Order actions</div>
      ) : null}
      {orderContext ? (
        <div className="space-y-2 app-measurements-status-card__order-actions">
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
