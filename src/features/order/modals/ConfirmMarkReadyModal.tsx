import { CalendarClock, MapPin, PackageCheck } from "lucide-react";
import { ActionButton, ModalShell, StatusPill, cx } from "../../../components/ui/primitives";
import type { OpenOrder } from "../../../types";
import {
  getMarkReadyActionLabel,
  getOpenOrderTypeLabel,
  getOperationalPickupDateLabel,
  getOperationalPickupTimeLabel,
} from "../selectors";

type ConfirmMarkReadyModalProps = {
  openOrder: OpenOrder;
  pickupIds: string[];
  onConfirm: () => void;
  onClose: () => void;
};

function getScopeLabel(scope: OpenOrder["pickupSchedules"][number]["scope"]) {
  return scope === "custom" ? "Custom garment" : "Alterations";
}

export function ConfirmMarkReadyModal({
  openOrder,
  pickupIds,
  onConfirm,
  onClose,
}: ConfirmMarkReadyModalProps) {
  const pendingPickups = openOrder.pickupSchedules.filter((pickup) => pickupIds.includes(pickup.id));
  const pendingPickupCount = pendingPickups.length;
  const scopeLabels = [...new Set(pendingPickups.map((pickup) => getScopeLabel(pickup.scope)))];
  const scopeSummary = scopeLabels.length > 1 ? "selected pickups" : `${scopeLabels[0]} pickup`;
  const confirmLabel = getMarkReadyActionLabel(openOrder, pendingPickupCount);
  const confirmSubtitle = pendingPickupCount > 1
    ? `Move ${openOrder.payerName}'s ${scopeSummary.toLowerCase()} into the ready-for-pickup queue.`
    : `Move ${openOrder.payerName}'s ${scopeSummary.toLowerCase()} into the ready-for-pickup queue.`;

  return (
    <ModalShell
      title={confirmLabel}
      subtitle={confirmSubtitle}
      onClose={onClose}
      showCloseButton={false}
      widthClassName="max-w-[560px]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <ActionButton tone="secondary" onClick={onClose}>
            Back
          </ActionButton>
          <ActionButton tone="primary" onClick={onConfirm}>
            {confirmLabel}
          </ActionButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="success">Ready for pickup</StatusPill>
          <div className="app-text-caption">
            {getOpenOrderTypeLabel(openOrder.orderType)} • Order #{openOrder.id}
          </div>
        </div>

        <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/22 px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="min-w-0">
              <div className="app-text-overline">Customer</div>
              <div className="mt-1 app-text-value">{openOrder.payerName}</div>
              <div className="mt-2 app-text-body leading-tight">{openOrder.itemSummary.join(" · ")}</div>
            </div>
            <div className="flex items-start">
              <div className="rounded-[var(--app-radius-md)] border border-emerald-200 bg-emerald-50 px-3 py-2 text-right dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <div className="app-text-overline text-[var(--app-success-text)]">Action</div>
                <div className="mt-1 text-sm font-semibold text-[var(--app-success-text)]">
                  {pendingPickupCount > 1 ? `${pendingPickupCount} pickups` : "1 pickup"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {pendingPickups.length ? (
          <div className="space-y-2">
            <div className="app-text-overline">Pickup details</div>
            <div className="space-y-2">
              {pendingPickups.map((pickup, index) => {
                const dateLabel = getOperationalPickupDateLabel(pickup.pickupDate, pickup.pickupTime) ?? "Date pending";
                const timeLabel = getOperationalPickupTimeLabel(pickup.pickupDate, pickup.pickupTime) ?? "Time pending";

                return (
                  <div
                    key={pickup.id}
                    className={cx(
                      "rounded-[var(--app-radius-md)] border border-[var(--app-border)]/55 bg-[var(--app-surface)] px-4 py-3",
                      index > 0 && "mt-2",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <div className="app-text-strong">{getScopeLabel(pickup.scope)}</div>
                      <div className="app-text-caption">{pickup.label}</div>
                    </div>
                    {pickup.itemSummary.length ? (
                      <div className="mt-1 app-text-caption">{pickup.itemSummary.join(" · ")}</div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 app-text-caption">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5 shrink-0 text-[var(--app-text-soft)]" />
                        <span>{dateLabel} · {timeLabel}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--app-text-soft)]" />
                        <span>{pickup.pickupLocation || "Location pending"}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface-muted)]/12 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full border border-emerald-200 bg-emerald-50 p-2 text-[var(--app-success-text)] dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <PackageCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="app-text-strong">What happens next</div>
              <div className="mt-1 app-text-caption">
                This moves the selected pickup into the ready queue so the team can collect payment or complete the handoff when the customer arrives.
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
