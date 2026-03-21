import type { PricingSummary } from "../../../types";
import { formatSummaryCurrency } from "../selectors";

type PricingSummaryProps = {
  pricing: PricingSummary;
};

export function PricingSummary({ pricing }: PricingSummaryProps) {
  return (
    <div className="border-0 bg-transparent p-0">
      <div className="mb-3 app-kicker">Pricing</div>
      <div className="rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)]/25 px-1 py-1">
        <div className="rounded-[var(--app-radius-md)] bg-[var(--app-surface)]/55 px-3.5 py-3.5">
          <div className="space-y-4">
            <div className="space-y-2.5">
              <div className="flex justify-between gap-3">
                <span className="app-text-body-muted">Alterations</span>
                <span className="app-text-body font-medium">{formatSummaryCurrency(pricing.alterationsSubtotal)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="app-text-body-muted">Custom garments</span>
                <span className="app-text-body font-medium">{formatSummaryCurrency(pricing.customSubtotal)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="app-text-body-muted">Tax</span>
                <span className="app-text-body font-medium">{formatSummaryCurrency(pricing.taxAmount)}</span>
              </div>
            </div>

            <div className="rounded-[var(--app-radius-sm)] bg-[var(--app-surface-muted)] px-3.5 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="app-text-overline">Deposit due</span>
                <span className="app-text-strong">{formatSummaryCurrency(pricing.depositDue)}</span>
              </div>
            </div>

            <div className="border-t border-[var(--app-border)]/70 pt-3.5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="app-text-overline">Order total</div>
                  <div className="app-text-caption mt-1">Including tax</div>
                </div>
                <div className="app-text-value">{formatSummaryCurrency(pricing.total)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
