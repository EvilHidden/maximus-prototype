import { ActionButton, ModalShell, StatusPill } from "../../../components/ui/primitives";
import type { OpenOrder } from "../../../types";
import { formatCheckoutCurrency } from "../checkoutDisplay";
import { getOpenOrderTypeLabel } from "../selectors";

type ConfirmCheckoutModalProps = {
  openOrder: OpenOrder;
  amountDue: number;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmCheckoutModal({
  openOrder,
  amountDue,
  onConfirm,
  onClose,
}: ConfirmCheckoutModalProps) {
  return (
    <ModalShell
      title="Take payment"
      subtitle={`Take ${openOrder.payerName}'s payment in Square before marking it collected on the order.`}
      onClose={onClose}
      showCloseButton={false}
      widthClassName="max-w-[500px]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <ActionButton tone="secondary" onClick={onClose}>
            Back
          </ActionButton>
          <ActionButton tone="primary" onClick={onConfirm}>
            Mark payment collected
          </ActionButton>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="warn">Square</StatusPill>
          <div className="app-text-caption">
            {getOpenOrderTypeLabel(openOrder.orderType)} • Order #{openOrder.id}
          </div>
        </div>
        <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/18 px-3 py-3">
          <div className="app-text-overline">Amount due now</div>
          <div className="mt-1 app-text-value">{formatCheckoutCurrency(amountDue)}</div>
          <div className="app-text-caption mt-1">
            {amountDue < openOrder.balanceDue
              ? `This payment covers what is ready today. ${formatCheckoutCurrency(openOrder.balanceDue - amountDue)} stays with the unfinished work.`
              : openOrder.itemSummary.join(", ")}
          </div>
        </div>
        <div className="app-text-body">
          1. Go to the Square terminal and take the customer's payment.
        </div>
        <div className="app-text-body">
          2. Come back here only after the terminal payment is complete.
        </div>
        <div className="app-text-body">
          3. Then mark the payment collected to keep this order in sync.
        </div>
      </div>
    </ModalShell>
  );
}
