import { ActionButton, ModalShell, StatusPill } from "../../../components/ui/primitives";
import type { CheckoutPaymentMode, OpenOrder } from "../../../types";
import { formatCheckoutCurrency } from "../checkoutDisplay";
import { getOpenOrderTypeLabel } from "../selectors";

type ConfirmCheckoutModalProps = {
  openOrder: OpenOrder;
  minimumAmountDue: number;
  depositAndAlterationAmount: number;
  fullAmountDue: number;
  selectedPaymentMode: Exclude<CheckoutPaymentMode, "none">;
  lockPaymentMode?: boolean;
  onConfirm: (paymentMode: Exclude<CheckoutPaymentMode, "none">) => void;
  onClose: () => void;
};

export function ConfirmCheckoutModal({
  openOrder,
  minimumAmountDue,
  depositAndAlterationAmount,
  fullAmountDue,
  selectedPaymentMode,
  lockPaymentMode = false,
  onConfirm,
  onClose,
}: ConfirmCheckoutModalProps) {
  const amountDue = selectedPaymentMode === "full_balance"
    ? fullAmountDue
    : selectedPaymentMode === "deposit_and_alterations"
      ? depositAndAlterationAmount
      : minimumAmountDue;
  const isOptionalPrepay = minimumAmountDue <= 0 && fullAmountDue > 0;
  const canPrepayBeyondRequired = fullAmountDue > minimumAmountDue && minimumAmountDue > 0;
  const hasReadyPickup = openOrder.pickupSchedules.some((pickup) => pickup.readyForPickup && !pickup.pickedUp);
  const isDepositFlow = selectedPaymentMode === "minimum_due" && !hasReadyPickup && (openOrder.orderType === "custom" || openOrder.orderType === "mixed");
  const isDepositAndAlterationsFlow = selectedPaymentMode === "deposit_and_alterations";
  const titleLabel = isOptionalPrepay ? "Remaining balance" : "Amount due now";
  const confirmLabel = isOptionalPrepay
    ? "Mark prepayment collected"
    : selectedPaymentMode === "full_balance"
      ? "Mark full payment collected"
      : isDepositAndAlterationsFlow
        ? "Mark deposit + alteration payment collected"
      : isDepositFlow
        ? "Mark deposit collected"
        : "Mark payment collected";

  return (
    <ModalShell
      title="Take payment"
      subtitle={`Take ${openOrder.payerName}'s payment in Square before marking it collected on the order.`}
      onClose={onClose}
      showCloseButton={false}
      widthClassName="max-w-[500px]"
      footer={
        <div className="flex items-center justify-end gap-2">
          {lockPaymentMode ? (
            <>
              {isOptionalPrepay ? (
                <ActionButton tone="secondary" onClick={onClose}>
                  Leave payment for later
                </ActionButton>
              ) : (
                <ActionButton tone="secondary" onClick={onClose}>
                  Back
                </ActionButton>
              )}
              <ActionButton tone="primary" onClick={() => onConfirm(selectedPaymentMode)}>
                {selectedPaymentMode === "full_balance"
                  ? "Mark full payment collected"
                  : isDepositAndAlterationsFlow
                    ? "Mark deposit + alteration payment collected"
                    : isDepositFlow
                      ? "Mark deposit collected"
                      : "Mark payment collected"}
              </ActionButton>
            </>
          ) : isOptionalPrepay ? (
            <>
              <ActionButton tone="secondary" onClick={onClose}>
                Leave payment for later
              </ActionButton>
              <ActionButton tone="primary" onClick={() => onConfirm("full_balance")}>
                Take prepayment now
              </ActionButton>
            </>
          ) : canPrepayBeyondRequired ? (
            <>
              <ActionButton tone="secondary" onClick={onClose}>
                Back
              </ActionButton>
              <ActionButton tone="secondary" onClick={() => onConfirm("minimum_due")}>
                {isDepositFlow ? "Mark deposit collected" : "Mark required payment collected"}
              </ActionButton>
              {openOrder.orderType === "mixed" && !hasReadyPickup ? (
                <ActionButton tone="secondary" onClick={() => onConfirm("deposit_and_alterations")}>
                  Mark deposit + alteration payment collected
                </ActionButton>
              ) : null}
              <ActionButton tone="primary" onClick={() => onConfirm("full_balance")}>
                Mark full payment collected
              </ActionButton>
            </>
          ) : (
            <>
              <ActionButton tone="secondary" onClick={onClose}>
                Back
              </ActionButton>
              <ActionButton tone="primary" onClick={() => onConfirm(selectedPaymentMode)}>
              {confirmLabel}
              </ActionButton>
            </>
          )}
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
          <div className="app-text-overline">{titleLabel}</div>
          <div className="mt-1 app-text-value">{formatCheckoutCurrency(isOptionalPrepay ? fullAmountDue : amountDue)}</div>
          <div className="app-text-caption mt-1">
            {isOptionalPrepay
              ? `No payment is required yet, but you can take up to ${formatCheckoutCurrency(fullAmountDue)} before pickup.`
              : isDepositAndAlterationsFlow
                ? `This payment takes the custom deposit and prepays the alterations. The remaining ${formatCheckoutCurrency(openOrder.balanceDue - amountDue)} stays on the custom portion until later.`
              : isDepositFlow
                ? `This deposit holds the order now. The remaining ${formatCheckoutCurrency(openOrder.balanceDue - amountDue)} stays on the order until later.`
                : amountDue < openOrder.balanceDue
                  ? `This payment covers what is ready today. ${formatCheckoutCurrency(openOrder.balanceDue - amountDue)} stays with the unfinished work.`
                  : openOrder.itemSummary.join(", ")}
          </div>
        </div>
        {canPrepayBeyondRequired && !lockPaymentMode ? (
          <div className="app-text-caption rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/18 px-3 py-3">
            {openOrder.orderType === "mixed" && !hasReadyPickup
              ? `Collect the required ${formatCheckoutCurrency(minimumAmountDue)} deposit, take ${formatCheckoutCurrency(depositAndAlterationAmount)} to cover the deposit plus alterations, or collect the full remaining ${formatCheckoutCurrency(fullAmountDue)} now.`
              : `Collect ${formatCheckoutCurrency(minimumAmountDue)} now, or take the full remaining ${formatCheckoutCurrency(fullAmountDue)} as prepayment.`}
          </div>
        ) : null}
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
