import type { PricingSummary } from "../../../types";
import { formatSummaryCurrency } from "../selectors";

type PricingSummaryProps = {
  pricing: PricingSummary;
};

export function PricingSummary({ pricing }: PricingSummaryProps) {
  return (
    <div className="app-panel-section">
      <div className="mb-3 app-kicker">Pricing</div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="app-text-body-muted">Alterations</span>
          <span className="app-text-body font-medium">{formatSummaryCurrency(pricing.alterationsSubtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="app-text-body-muted">Custom garments</span>
          <span className="app-text-body font-medium">{formatSummaryCurrency(pricing.customSubtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="app-text-body-muted">Tax</span>
          <span className="app-text-body font-medium">{formatSummaryCurrency(pricing.taxAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="app-text-body-muted">Deposit due</span>
          <span className="app-text-body font-medium">{formatSummaryCurrency(pricing.depositDue)}</span>
        </div>
      </div>
      <div className="mt-3 border-t border-[var(--app-border)] pt-3">
        <div className="flex justify-between">
          <span className="app-text-strong">Total</span>
          <span className="app-text-strong">{formatSummaryCurrency(pricing.total)}</span>
        </div>
      </div>
    </div>
  );
}
