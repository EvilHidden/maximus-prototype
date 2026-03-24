import { CheckCircle2 } from "lucide-react";
import { formatCheckoutCurrency } from "../../checkoutDisplay";

type CheckoutAcceptedBannerProps = {
  openOrderId: number;
  payerName: string;
  balanceDue: number;
  acceptedOrderNeedsPayment: boolean;
};

export function CheckoutAcceptedBanner({
  openOrderId,
  payerName,
  balanceDue,
  acceptedOrderNeedsPayment,
}: CheckoutAcceptedBannerProps) {
  return (
    <div className="border-t border-[var(--app-border)]/45 px-4 py-4">
      <div className="rounded-[var(--app-radius-md)] border border-emerald-200/80 bg-emerald-50/85 px-4 py-4 text-emerald-900 shadow-[0_14px_34px_-28px_rgba(5,150,105,0.55)]">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="app-text-overline text-emerald-700">All set</div>
            <div className="mt-1 text-[1.05rem] font-semibold tracking-[-0.015em] text-emerald-950">
              Order #{openOrderId} has been accepted.
            </div>
            <div className="mt-1 text-sm leading-relaxed text-emerald-800/90">
              {acceptedOrderNeedsPayment
                ? `${payerName}'s order is saved, the due date is set, and the team can start work. No payment was collected, so ${formatCheckoutCurrency(balanceDue)} will be due later or at pickup.`
                : `${payerName}'s order is saved, the due date is set, and the payment is already in. The team can start work.`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
