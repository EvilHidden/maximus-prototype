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
        <div className="flex justify-between text-sm">
          <span className="text-[var(--app-text-muted)]">Alterations</span>
          <span className="font-medium text-[var(--app-text)]">{formatSummaryCurrency(pricing.alterationsSubtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--app-text-muted)]">Custom garments</span>
          <span className="font-medium text-[var(--app-text)]">{formatSummaryCurrency(pricing.customSubtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--app-text-muted)]">Tax</span>
          <span className="font-medium text-[var(--app-text)]">{formatSummaryCurrency(pricing.taxAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--app-text-muted)]">Deposit due</span>
          <span className="font-medium text-[var(--app-text)]">{formatSummaryCurrency(pricing.depositDue)}</span>
        </div>
      </div>
      <div className="mt-3 border-t border-[var(--app-border)] pt-3">
        <div className="flex justify-between text-base">
          <span className="font-semibold text-[var(--app-text)]">Total</span>
          <span className="font-semibold text-[var(--app-text)]">{formatSummaryCurrency(pricing.total)}</span>
        </div>
      </div>
    </div>
  );
}
