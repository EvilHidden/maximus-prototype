import { ReceiptText } from "lucide-react";
import { ActionButton, ModalShell, StatusPill } from "../../../components/ui/primitives";
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
      subtitle={`Stop working on ${openOrder.payerName}'s order?`}
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
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="danger">Canceling</StatusPill>
          <div className="app-text-caption">
            {getOpenOrderTypeLabel(openOrder.orderType)} • Order #{openOrder.id}
          </div>
        </div>
        <ModalSummaryCard
          eyebrow="Paying customer"
          title={openOrder.payerName}
          description={openOrder.itemSummary.join(" · ")}
          aside={
            <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 bg-[var(--app-surface)] px-3 py-2 text-[var(--app-text-soft)]">
              <ReceiptText className="h-4 w-4" />
            </div>
          }
        />
        <div className="app-text-body-muted">
          The order comes out of active work as soon as you confirm. Only do this if the order is really canceled.
        </div>
      </div>
    </ModalShell>
  );
}
