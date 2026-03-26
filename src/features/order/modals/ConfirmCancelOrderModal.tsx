import { ActionButton, ModalShell, StatusPill } from "../../../components/ui/primitives";
import type { OpenOrder } from "../../../types";
import { getOpenOrderTypeLabel } from "../selectors";

type ConfirmCancelOrderModalProps = {
  openOrder: OpenOrder;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmCancelOrderModal({
  openOrder,
  onConfirm,
  onClose,
}: ConfirmCancelOrderModalProps) {
  return (
    <ModalShell
      title="Cancel order"
      subtitle={`Cancel ${openOrder.payerName}'s order?`}
      onClose={onClose}
      showCloseButton={false}
      widthClassName="max-w-[460px]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <ActionButton tone="secondary" onClick={onClose}>
            Back
          </ActionButton>
          <ActionButton tone="primary" onClick={onConfirm}>
            Cancel order
          </ActionButton>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="danger">Canceling</StatusPill>
          <div className="app-text-caption">
            {getOpenOrderTypeLabel(openOrder.orderType)} • Order #{openOrder.id}
          </div>
        </div>
        <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/18 px-3 py-3">
          <div className="app-text-strong">{openOrder.payerName}</div>
          <div className="app-text-caption mt-1">{openOrder.itemSummary.join(", ")}</div>
        </div>
        <div className="app-text-body">
          This closes the order immediately and removes it from active work. Use this only when the order should be canceled for real.
        </div>
      </div>
    </ModalShell>
  );
}
