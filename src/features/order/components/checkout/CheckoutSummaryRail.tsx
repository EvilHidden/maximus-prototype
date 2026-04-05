import { Surface, SurfaceHeader, cx } from "../../../../components/ui/primitives";

type SummaryItem = {
  label: string;
  value: string;
};

type CheckoutSummaryRailProps = {
  title: string;
  subtitle: string;
  totalsItems: SummaryItem[];
  summarySplitIndex?: number;
  summarySplitLabel?: string;
  actionsLabel?: string;
  children: React.ReactNode;
};

export function CheckoutSummaryRail({
  title,
  subtitle,
  totalsItems,
  summarySplitIndex,
  summarySplitLabel = "Summary",
  actionsLabel = "Order actions",
  children,
}: CheckoutSummaryRailProps) {
  const totalItem = totalsItems[totalsItems.length - 1] ?? null;
  const detailItems = totalItem ? totalsItems.slice(0, -1) : totalsItems;
  const hasSummarySplit = typeof summarySplitIndex === "number"
    && summarySplitIndex > 0
    && summarySplitIndex < detailItems.length;
  const leadingItems = hasSummarySplit ? detailItems.slice(0, summarySplitIndex) : detailItems;
  const summaryItems = hasSummarySplit ? detailItems.slice(summarySplitIndex) : [];

  return (
    <Surface tone="support" as="aside" className="app-support-rail-fixed overflow-hidden app-checkout-rail">
      <div className="px-4 pt-4 pb-3 app-checkout-rail__header">
        <SurfaceHeader
          title={title}
          subtitle={subtitle}
          titleClassName="app-text-strong"
          subtitleClassName="app-text-caption max-w-[26ch] leading-relaxed"
        />
      </div>

      <div className="border-t border-[var(--app-border)]/40 px-4 py-3 app-checkout-rail__summary">
        <div className="space-y-2.5 app-checkout-rail__summary-list">
          {leadingItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4 app-checkout-rail__summary-row">
              <div className="app-text-caption">{item.label}</div>
              <div className="app-text-body-muted text-right font-medium [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
                {item.value}
              </div>
            </div>
          ))}

          {summaryItems.length > 0 ? (
            <div className="app-checkout-rail__summary-section">
              <div className="app-text-overline app-checkout-rail__summary-section-label">{summarySplitLabel}</div>
              <div className="space-y-2.5">
                {summaryItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 app-checkout-rail__summary-row">
                    <div className="app-text-caption">{item.label}</div>
                    <div className="app-text-body-muted text-right font-medium [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {totalItem ? (
            <div className={cx(
              "flex items-center justify-between gap-4 border-t border-[var(--app-border)]/35 pt-2.5 app-checkout-rail__total-row",
              detailItems.length === 0 && "border-t-0 pt-0",
            )}>
              <div className="app-text-overline">{totalItem.label}</div>
              <div className="app-text-value text-right [font-variant-numeric:tabular-nums]">
                {totalItem.value}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-[var(--app-border)]/40 px-4 py-3 app-checkout-rail__actions-shell">
        <div className="app-text-overline app-checkout-rail__actions-label">{actionsLabel}</div>
        <div className="grid gap-2 app-checkout-rail__actions [&>*]:w-full">{children}</div>
      </div>
    </Surface>
  );
}
