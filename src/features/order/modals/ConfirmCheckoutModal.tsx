import { useEffect, useMemo, useState } from "react";
import { CreditCard } from "lucide-react";
import { ActionButton, ModalShell, cx } from "../../../components/ui/primitives";
import { ModalFooterActions, ModalMetaRow, ModalPanel, ModalSectionHeading, ModalSummaryCard } from "../../../components/ui/modalPatterns";
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

type PaymentOption = {
  mode: Exclude<CheckoutPaymentMode, "none">;
  title: string;
  amount: number;
  detail: string;
  remaining: number;
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
  const hasReadyPickup = openOrder.pickupSchedules.some((pickup) => pickup.readyForPickup && !pickup.pickedUp);
  const isOptionalPrepay = minimumAmountDue <= 0 && fullAmountDue > 0;
  const canPrepayBeyondRequired = fullAmountDue > minimumAmountDue && minimumAmountDue > 0;

  const paymentOptions = useMemo<PaymentOption[]>(() => {
    if (isOptionalPrepay) {
      return [
        {
          mode: "full_balance",
          title: "Take prepayment",
          amount: fullAmountDue,
          detail: "No payment is required today. Use this only if the customer is paying ahead now.",
          remaining: 0,
        },
      ];
    }

    if (canPrepayBeyondRequired) {
      const options: PaymentOption[] = [
        {
          mode: "minimum_due",
          title: hasReadyPickup
            ? "Take payment for ready pieces"
            : openOrder.orderType === "custom" || openOrder.orderType === "mixed"
              ? "Take required deposit"
              : "Take payment due now",
          amount: minimumAmountDue,
          detail: hasReadyPickup
            ? "Collect what is due for the work ready today."
            : openOrder.orderType === "custom" || openOrder.orderType === "mixed"
              ? "Collect the required deposit to keep the order moving."
              : "Collect the amount currently due on the order.",
          remaining: Math.max(openOrder.balanceDue - minimumAmountDue, 0),
        },
      ];

      if (openOrder.orderType === "mixed" && !hasReadyPickup) {
        options.push({
          mode: "deposit_and_alterations",
          title: "Take deposit and alterations",
          amount: depositAndAlterationAmount,
          detail: "Cover the custom deposit and the alteration work now.",
          remaining: Math.max(openOrder.balanceDue - depositAndAlterationAmount, 0),
        });
      }

      options.push({
        mode: "full_balance",
        title: "Take full balance",
        amount: fullAmountDue,
        detail: "Close out the remaining balance on this order now.",
        remaining: 0,
      });

      return options;
    }

    const singleAmount = selectedPaymentMode === "full_balance"
      ? fullAmountDue
      : selectedPaymentMode === "deposit_and_alterations"
        ? depositAndAlterationAmount
        : minimumAmountDue;

    return [
      {
        mode: selectedPaymentMode,
        title: selectedPaymentMode === "full_balance"
          ? "Take full balance"
          : selectedPaymentMode === "deposit_and_alterations"
            ? "Take deposit and alterations"
            : hasReadyPickup
              ? "Take payment for ready pieces"
              : openOrder.orderType === "custom" || openOrder.orderType === "mixed"
                ? "Take required deposit"
                : "Take payment due now",
        amount: singleAmount,
        detail: selectedPaymentMode === "deposit_and_alterations"
          ? "This covers the custom deposit and the alteration work now."
          : selectedPaymentMode === "full_balance"
            ? "This records the full remaining balance."
            : hasReadyPickup
              ? "This records payment for the work ready today."
              : openOrder.orderType === "custom" || openOrder.orderType === "mixed"
                ? "This records the required deposit."
                : "This records the amount due now.",
        remaining: Math.max(openOrder.balanceDue - singleAmount, 0),
      },
    ];
  }, [
    canPrepayBeyondRequired,
    depositAndAlterationAmount,
    fullAmountDue,
    hasReadyPickup,
    isOptionalPrepay,
    minimumAmountDue,
    openOrder.balanceDue,
    openOrder.orderType,
    selectedPaymentMode,
  ]);

  const [activeMode, setActiveMode] = useState<Exclude<CheckoutPaymentMode, "none">>(paymentOptions[0]?.mode ?? selectedPaymentMode);

  useEffect(() => {
    const nextMode = paymentOptions.some((option) => option.mode === selectedPaymentMode)
      ? selectedPaymentMode
      : paymentOptions[0]?.mode ?? selectedPaymentMode;
    setActiveMode(nextMode);
  }, [paymentOptions, selectedPaymentMode]);

  const activeOption = paymentOptions.find((option) => option.mode === activeMode) ?? paymentOptions[0];
  const confirmLabel = isOptionalPrepay ? "Record prepayment" : "Record payment";

  return (
    <ModalShell
      title="Take payment"
      onClose={onClose}
      widthClassName="max-w-[560px]"
      footer={(
        <ModalFooterActions
          leading={<div className="app-text-caption">Only record this after Square shows paid.</div>}
        >
          <ActionButton tone="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton tone="primary" onClick={() => activeOption && onConfirm(activeOption.mode)}>
            <CreditCard className="h-4 w-4" />
            <span>{confirmLabel}</span>
          </ActionButton>
        </ModalFooterActions>
      )}
    >
      <div className="space-y-4">
        <ModalSummaryCard
          eyebrow="Order"
          title={openOrder.payerName}
          description={openOrder.itemSummary.join(" · ")}
          meta={(
            <ModalMetaRow
              items={[
                { content: `${getOpenOrderTypeLabel(openOrder.orderType)} • Order #${openOrder.id}` },
                ...(hasReadyPickup ? [{ content: "Ready pieces included" }] : []),
              ]}
            />
          )}
          aside={activeOption ? (
            <div className="text-right">
              <div className="app-text-overline">Collect now</div>
              <div className="mt-1 app-text-value">{formatCheckoutCurrency(activeOption.amount)}</div>
            </div>
          ) : null}
        />

        {paymentOptions.length > 1 && !lockPaymentMode ? (
          <div className="space-y-3">
            <ModalSectionHeading
              eyebrow="Payment choice"
              title="Choose what to collect"
              description="Pick the amount you are recording from Square."
            />
            <div className="app-modal-choice-list app-checkout-choice-list">
              {paymentOptions.map((option) => (
                <button
                  key={option.mode}
                  type="button"
                  onClick={() => setActiveMode(option.mode)}
                  className={cx(
                    "app-checkout-choice",
                    activeMode === option.mode && "app-checkout-choice--active",
                  )}
                  aria-pressed={activeMode === option.mode}
                >
                  <div className="min-w-0">
                    <div className="app-checkout-choice__topline">
                      <div className="app-text-strong">{option.title}</div>
                      <div className="app-text-value [font-variant-numeric:tabular-nums]">{formatCheckoutCurrency(option.amount)}</div>
                    </div>
                    <div className="mt-1 app-text-caption">{option.detail}</div>
                  </div>
                  <div className="app-checkout-choice__meta">
                    <div className="app-text-overline">Leaves open</div>
                    <div className="app-text-body font-medium [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
                      {option.remaining > 0 ? formatCheckoutCurrency(option.remaining) : "Nothing"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : activeOption ? (
          <ModalPanel tone="muted" className="app-checkout-choice-panel">
            <ModalSectionHeading
              eyebrow="Payment to record"
              title={activeOption.title}
              description={activeOption.detail}
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="app-text-overline">Collect now</div>
                <div className="mt-1 app-text-value [font-variant-numeric:tabular-nums]">
                  {formatCheckoutCurrency(activeOption.amount)}
                </div>
              </div>
              <div>
                <div className="app-text-overline">Leaves open</div>
                <div className="mt-1 app-text-body font-semibold [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
                  {activeOption.remaining > 0 ? formatCheckoutCurrency(activeOption.remaining) : "Nothing"}
                </div>
              </div>
            </div>
          </ModalPanel>
        ) : null}
      </div>
    </ModalShell>
  );
}
