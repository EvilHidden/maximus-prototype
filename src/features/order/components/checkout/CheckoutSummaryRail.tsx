import { Surface, SurfaceHeader, cx } from "../../../../components/ui/primitives";

type SummaryItem = {
  label: string;
  value: string;
};

type CheckoutSummaryRailProps = {
  title: string;
  subtitle: string;
  totalsItems: SummaryItem[];
  children: React.ReactNode;
};

export function CheckoutSummaryRail({
  title,
  subtitle,
  totalsItems,
  children,
}: CheckoutSummaryRailProps) {
  const totalItem = totalsItems[totalsItems.length - 1] ?? null;
  const detailItems = totalItem ? totalsItems.slice(0, -1) : totalsItems;

  return (
    <Surface tone="support" as="aside" className="overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <SurfaceHeader
          title={title}
          subtitle={subtitle}
          titleClassName="app-text-strong"
          subtitleClassName="app-text-caption max-w-[26ch] leading-relaxed"
        />
      </div>

      <div className="border-t border-[var(--app-border)]/40 px-4 py-3">
        <div className="space-y-2.5">
          {detailItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4">
              <div className="app-text-caption">{item.label}</div>
              <div className="app-text-body-muted text-right font-medium [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
                {item.value}
              </div>
            </div>
          ))}

          {totalItem ? (
            <div className={cx(
              "flex items-center justify-between gap-4 border-t border-[var(--app-border)]/35 pt-2.5",
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

      <div className="border-t border-[var(--app-border)]/40 px-4 py-3">
        <div className="grid gap-2 [&>*]:w-full">{children}</div>
      </div>
    </Surface>
  );
}
