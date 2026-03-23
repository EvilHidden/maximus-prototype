import type {
  OpenOrderPaymentStatus,
  OrderType,
  OrderWorkflowState,
  PricingSummary,
} from "../../types";
import type { DbPaymentRecord } from "../../db/schema";
import { getPricingSummary } from "./orderPricing";

export type PaymentSummary = {
  paymentStatus: OpenOrderPaymentStatus;
  paymentDueNow: number;
  totalCollected: number;
  collectedToday: number;
  balanceDue: number;
  total: number;
};

function getDraftOrderType(order: OrderWorkflowState): OrderType | null {
  const hasAlterations = order.alteration.items.length > 0;
  const hasCustom = order.custom.items.length > 0;

  if (hasAlterations && hasCustom) {
    return "mixed";
  }

  if (hasAlterations) {
    return "alteration";
  }

  if (hasCustom) {
    return "custom";
  }

  return null;
}

export function getCheckoutCollectionAmountForPricing(
  pricing: PricingSummary,
  orderType: OrderType | null,
) {
  if (orderType === "custom") {
    return pricing.depositDue;
  }

  if (orderType === "mixed") {
    return pricing.alterationsSubtotal + pricing.taxAmount + pricing.depositDue;
  }

  return pricing.total;
}

export function getCheckoutCollectionAmount(order: OrderWorkflowState) {
  return getCheckoutCollectionAmountForPricing(getPricingSummary(order), getDraftOrderType(order));
}

export function getDraftPaymentSummary(
  order: OrderWorkflowState,
  paymentStatus: OpenOrderPaymentStatus,
): PaymentSummary {
  const pricing = getPricingSummary(order);
  const collectionAmount = getCheckoutCollectionAmountForPricing(pricing, getDraftOrderType(order));
  const totalCollected = paymentStatus === "captured" ? collectionAmount : 0;

  return {
    paymentStatus,
    paymentDueNow: Math.max(pricing.total - totalCollected, 0),
    totalCollected,
    collectedToday: totalCollected,
    balanceDue: Math.max(pricing.total - totalCollected, 0),
    total: pricing.total,
  };
}

export function getRecordedPaymentSummary({
  payments,
  generatedAt,
  orderType,
  total,
}: {
  payments: DbPaymentRecord[];
  generatedAt: string;
  orderType: OrderType;
  total: number;
}): PaymentSummary {
  const latest = payments[payments.length - 1];
  const today = new Date(generatedAt);
  today.setHours(0, 0, 0, 0);

  const totalCollected = payments.reduce((sum, record) => (
    record.status === "captured" ? sum + record.amount : sum
  ), 0);

  const collectedToday = payments.reduce((sum, record) => {
    if (record.status !== "captured" || !record.collectedAt) {
      return sum;
    }

    const collectedAt = new Date(record.collectedAt);
    if (Number.isNaN(collectedAt.getTime())) {
      return sum;
    }

    collectedAt.setHours(0, 0, 0, 0);
    return collectedAt.getTime() === today.getTime() ? sum + record.amount : sum;
  }, 0);

  const paymentStatus = latest?.status === "captured"
    ? ("captured" satisfies OpenOrderPaymentStatus)
    : latest?.status === "pending"
      ? ("pending" satisfies OpenOrderPaymentStatus)
      : orderType === "alteration"
        ? ("due_later" satisfies OpenOrderPaymentStatus)
        : ("ready_to_collect" satisfies OpenOrderPaymentStatus);

  const balanceDue = Math.max(total - totalCollected, 0);

  return {
    paymentStatus,
    paymentDueNow: balanceDue,
    totalCollected,
    collectedToday,
    balanceDue,
    total,
  };
}
