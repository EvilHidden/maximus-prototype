import { ClipboardList, type LucideIcon } from "lucide-react";
import { ActionButton, EmptyState, SectionHeader, Surface, SurfaceHeader } from "../../../../components/ui/primitives";

type CheckoutEmptyStateProps = {
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction: () => void;
};

export function CheckoutEmptyState({
  title = "Review order",
  subtitle = "Start an order first, then come back here to take payment.",
  actionLabel = "New order",
  actionIcon: ActionIcon = ClipboardList,
  onAction,
}: CheckoutEmptyStateProps) {
  return (
    <div className="space-y-4">
      <SectionHeader icon={ActionIcon} title={title} subtitle={subtitle} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Surface tone="work" className="overflow-hidden">
          <div className="px-4 py-4">
            <div className="app-text-overline">Review order</div>
            <div className="mt-1 app-text-value">No order in progress</div>
            <div className="app-text-caption mt-1 max-w-[36rem]">
              Review is available after you start an order, add the work, and set the pickup timing.
            </div>
          </div>

          <div className="border-t border-[var(--app-border)]/45 px-4 py-8">
            <EmptyState className="rounded-[var(--app-radius-md)] border-dashed bg-[var(--app-surface-muted)]/25 px-6 py-8 shadow-none">
              <div className="flex items-start gap-3">
                <div className="app-icon-chip">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="app-text-overline">No order yet</div>
                  <div className="app-text-body mt-2">
                    Start a new order to add the customer, the work, and the pickup timing.
                  </div>
                </div>
              </div>
            </EmptyState>
          </div>
        </Surface>

        <div className="space-y-4">
          <Surface tone="support" className="p-4">
            <SurfaceHeader title="Next step" subtitle="Start a new order to continue." />

            <div className="mt-4 border-t border-[var(--app-border)]/45 pt-4">
              <ActionButton tone="primary" onClick={onAction}>
                {actionLabel}
              </ActionButton>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
