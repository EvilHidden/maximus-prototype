import { CircleDollarSign, ReceiptText } from "lucide-react";
import { ActionButton, Callout, ModalShell, StatusPill } from "../../../components/ui/primitives";
import {
  ModalFooterActions,
  ModalSummaryCard,
} from "../../../components/ui/modalPatterns";
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
  const amountDisplay = formatCheckoutCurrency(isOptionalPrepay ? fullAmountDue : amountDue);
  const amountExplanation = isOptionalPrepay
    ? `No payment is required yet, but you can take up to ${formatCheckoutCurrency(fullAmountDue)} before pickup.`
    : isDepositAndAlterationsFlow
      ? `This takes the custom deposit and pays for the alterations now. The other ${formatCheckoutCurrency(openOrder.balanceDue - amountDue)} stays on the custom work for later.`
      : isDepositFlow
        ? `This deposit gets the order going now. The other ${formatCheckoutCurrency(openOrder.balanceDue - amountDue)} stays for later.`
        : amountDue < openOrder.balanceDue
          ? `This pays for what is ready now. ${formatCheckoutCurrency(openOrder.balanceDue - amountDue)} stays with the unfinished work.`
          : openOrder.itemSummary.join(", ");
  const branchGuidance = canPrepayBeyondRequired && !lockPaymentMode
    ? openOrder.orderType === "mixed" && !hasReadyPickup
      ? `Collect the required ${formatCheckoutCurrency(minimumAmountDue)} deposit, take ${formatCheckoutCurrency(depositAndAlterationAmount)} to cover the deposit plus alterations, or collect the full remaining ${formatCheckoutCurrency(fullAmountDue)} now.`
      : `Collect ${formatCheckoutCurrency(minimumAmountDue)} now, or take the full remaining ${formatCheckoutCurrency(fullAmountDue)} as prepayment.`
    : null;

  return (
    <ModalShell
      title="Take payment"
      onClose={onClose}
      showCloseButton={false}
      widthClassName="max-w-[500px]"
      footer={
        <ModalFooterActions
          leading={
            <div className="app-text-caption">
              Only mark this after Square says the payment went through.
            </div>
          }
        >
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
        </ModalFooterActions>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="warn">Square</StatusPill>
          <div className="app-text-caption">
            {getOpenOrderTypeLabel(openOrder.orderType)} • Order #{openOrder.id}
          </div>
        </div>
        <ModalSummaryCard
          eyebrow="Paying customer"
          title={openOrder.payerName}
          description={openOrder.itemSummary.join(" · ")}
          aside={
            <div className="text-right">
              <div className="app-text-overline">{titleLabel}</div>
              <div className="mt-1 app-text-value">{amountDisplay}</div>
            </div>
          }
        />
        <Callout tone="default" icon={CircleDollarSign} title={<span className="app-text-strong">What this covers</span>}>
          <div className="app-text-caption">{amountExplanation}</div>
        </Callout>
        {branchGuidance ? (
          <Callout tone="warn" icon={ReceiptText} title={<span className="app-text-strong">Payment choices</span>}>
            <div className="app-text-caption">{branchGuidance}</div>
          </Callout>
        ) : null}
        <div className="space-y-1.5 border-t border-[var(--app-border)]/35 pt-3">
          <div className="app-text-overline">Before you confirm</div>
          <div className="app-text-body">Take the payment in Square first.</div>
          <div className="app-text-caption">Only mark it here after the terminal says the payment went through.</div>
        </div>
      </div>
    </ModalShell>
  );
}
