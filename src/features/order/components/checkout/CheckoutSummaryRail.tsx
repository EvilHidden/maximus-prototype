import { ActionButton, DefinitionList, Surface, SurfaceHeader } from "../../../../components/ui/primitives";

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
  return (
    <Surface tone="support" className="p-4">
      <SurfaceHeader title={title} subtitle={subtitle} />

      <div className="mt-4 border-t border-[var(--app-border)]/45 pt-4">
        <DefinitionList items={totalsItems} />
      </div>

      <div className="mt-4 border-t border-[var(--app-border)]/45 pt-4">
        <div className="grid gap-2">{children}</div>
      </div>
    </Surface>
  );
}
