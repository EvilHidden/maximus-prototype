import { ActionButton, ModalShell, StatusPill } from "../../../components/ui/primitives";
import type { OpenOrder } from "../../../types";
import { getMarkReadyActionLabel, getOpenOrderTypeLabel } from "../selectors";

type ConfirmMarkReadyModalProps = {
  openOrder: OpenOrder;
  pendingPickupCount: number;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmMarkReadyModal({
  openOrder,
  pendingPickupCount,
  onConfirm,
  onClose,
}: ConfirmMarkReadyModalProps) {
  const pendingPickups = openOrder.pickupSchedules.filter((pickup) => (
    pickup.scope === "alteration" && !pickup.readyForPickup && !pickup.pickedUp
  ));
  const confirmLabel = getMarkReadyActionLabel(openOrder, pendingPickupCount);
  const confirmSubtitle = `Set ${openOrder.payerName}'s alterations to ready for pickup?`;

  return (
    <ModalShell
      title={confirmLabel}
      subtitle={confirmSubtitle}
      onClose={onClose}
      showCloseButton={false}
      widthClassName="max-w-[460px]"
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
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="success">Ready</StatusPill>
          <div className="app-text-caption">
            {getOpenOrderTypeLabel(openOrder.orderType)} • Order #{openOrder.id}
          </div>
        </div>
        <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/18 px-3 py-3">
          <div className="app-text-strong">{openOrder.payerName}</div>
          <div className="app-text-caption mt-1">{openOrder.itemSummary.join(", ")}</div>
          <div className="app-text-caption mt-1">
            {pendingPickupCount > 1
              ? `${pendingPickupCount} alteration pickup slots will be marked ready.`
              : "The alteration pickup slot will be marked ready."}
          </div>
        </div>
        {pendingPickups.length ? (
          <div className="app-text-body">
            {pendingPickups
              .map((pickup) => `${pickup.pickupDate || "Date pending"}${pickup.pickupTime ? ` at ${pickup.pickupTime}` : ""}${pickup.pickupLocation ? ` • ${pickup.pickupLocation}` : ""}`)
              .join(" · ")}
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
