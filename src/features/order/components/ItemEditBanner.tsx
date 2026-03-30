import { Callout } from "../../../components/ui/primitives";

type ItemEditBannerProps = {
  label: string;
  detail?: string | null;
};

export function ItemEditBanner({ label, detail }: ItemEditBannerProps) {
  return (
    <Callout tone="warn" className="mb-4">
      <div className="app-text-overline text-[var(--app-warn-text)]">Editing item</div>
      <div className="app-text-value mt-1 text-[var(--app-text)]">{label}</div>
      {detail ? <div className="app-text-caption mt-1 text-[var(--app-text-muted)]">{detail}</div> : null}
      <div className="app-text-caption mt-2 text-[var(--app-warn-text)]">Save to update this item.</div>
    </Callout>
  );
}
