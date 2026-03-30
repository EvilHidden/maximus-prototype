import { ActionButton, ModalShell } from "../../../components/ui/primitives";
import { ModalFooterActions, ModalSummaryCard } from "../../../components/ui/modalPatterns";
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
      onClose={onClose}
      showCloseButton={false}
      widthClassName="max-w-[460px]"
      footer={
        <ModalFooterActions>
          <ActionButton tone="secondary" onClick={onClose}>
            Back
          </ActionButton>
          <ActionButton tone="danger" onClick={onConfirm}>
            Cancel order
          </ActionButton>
        </ModalFooterActions>
      }
    >
      <div className="space-y-3">
        <ModalSummaryCard
          eyebrow={`${getOpenOrderTypeLabel(openOrder.orderType)} • Order #${openOrder.id}`}
          title={openOrder.payerName}
          description={openOrder.itemSummary.join(" · ")}
        />
        <div className="app-text-body-muted">
          This takes it out of active work right away.
        </div>
      </div>
    </ModalShell>
  );
}
