import type {
  OpenOrder,
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

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

type MixedPaymentAllocation = {
  depositDue: number;
  depositPaid: number;
  alterationDue: number;
  alterationPaid: number;
  customFinalDue: number;
  customFinalPaid: number;
  taxAmount: number;
};

function getMixedPaymentAllocation(openOrder: Pick<OpenOrder, "lineItems" | "totalCollected" | "total">): MixedPaymentAllocation {
  const alterationSubtotal = openOrder.lineItems
    .filter((item) => item.kind === "alteration")
    .reduce((sum, item) => sum + item.amount, 0);
  const customSubtotal = openOrder.lineItems
    .filter((item) => item.kind === "custom")
    .reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = Math.max(openOrder.total - alterationSubtotal - customSubtotal, 0);
  const depositDue = roundCurrency(customSubtotal * 0.5);
  const alterationDue = roundCurrency(alterationSubtotal + taxAmount);
  const customFinalDue = roundCurrency(Math.max(customSubtotal - depositDue, 0));

  const depositPaid = Math.min(openOrder.totalCollected, depositDue);
  const afterDeposit = Math.max(openOrder.totalCollected - depositPaid, 0);
  const alterationPaid = Math.min(afterDeposit, alterationDue);
  const afterAlteration = Math.max(afterDeposit - alterationPaid, 0);
  const customFinalPaid = Math.min(afterAlteration, customFinalDue);

  return {
    depositDue,
    depositPaid: roundCurrency(depositPaid),
    alterationDue,
    alterationPaid: roundCurrency(alterationPaid),
    customFinalDue,
    customFinalPaid: roundCurrency(customFinalPaid),
    taxAmount: roundCurrency(taxAmount),
  };
}

function getMixedPaymentAllocationFromPayments({
  payments,
  lineItems,
  total,
}: {
  payments: DbPaymentRecord[];
  lineItems: OpenOrder["lineItems"];
  total: number;
}): MixedPaymentAllocation {
  const base = getMixedPaymentAllocation({
    lineItems,
    total,
    totalCollected: 0,
  });
  const capturedPayments = payments.filter((payment) => payment.status === "captured");
  const allocatedDeposit = roundCurrency(capturedPayments
    .filter((payment) => payment.allocation === "custom_deposit")
    .reduce((sum, payment) => sum + payment.amount, 0));
  const allocatedAlteration = roundCurrency(capturedPayments
    .filter((payment) => payment.allocation === "alteration_balance")
    .reduce((sum, payment) => sum + payment.amount, 0));
  const allocatedCustomBalance = roundCurrency(capturedPayments
    .filter((payment) => payment.allocation === "custom_balance")
    .reduce((sum, payment) => sum + payment.amount, 0));
  const allocatedFullBalance = roundCurrency(capturedPayments
    .filter((payment) => payment.allocation === "full_balance")
    .reduce((sum, payment) => sum + payment.amount, 0));

  const depositPaid = Math.min(allocatedDeposit, base.depositDue);
  const afterDepositTarget = Math.max(base.depositDue - depositPaid, 0);
  const alterationPaidFromExplicit = Math.min(allocatedAlteration, base.alterationDue);
  const customFinalPaidFromExplicit = Math.min(allocatedCustomBalance, base.customFinalDue);

  const remainingDepositGap = Math.max(afterDepositTarget, 0);
  const remainingAlterationGap = Math.max(base.alterationDue - alterationPaidFromExplicit, 0);
  const remainingCustomGap = Math.max(base.customFinalDue - customFinalPaidFromExplicit, 0);

  const fullAppliedToDeposit = Math.min(allocatedFullBalance, remainingDepositGap);
  const fullAfterDeposit = Math.max(allocatedFullBalance - fullAppliedToDeposit, 0);
  const fullAppliedToAlteration = Math.min(fullAfterDeposit, remainingAlterationGap);
  const fullAfterAlteration = Math.max(fullAfterDeposit - fullAppliedToAlteration, 0);
  const fullAppliedToCustom = Math.min(fullAfterAlteration, remainingCustomGap);

  const depositAfterExplicit = depositPaid + fullAppliedToDeposit;
  const alterationAfterExplicit = alterationPaidFromExplicit + fullAppliedToAlteration;
  const customAfterExplicit = customFinalPaidFromExplicit + fullAppliedToCustom;

  return {
    ...base,
    depositPaid: roundCurrency(depositAfterExplicit),
    alterationPaid: roundCurrency(alterationAfterExplicit),
    customFinalPaid: roundCurrency(customAfterExplicit),
  };
}

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

export function getOpenOrderPickupBalanceDue(openOrder: Pick<OpenOrder, "orderType" | "lineItems" | "pickupSchedules" | "totalCollected" | "total">) {
  const alterationSubtotal = openOrder.lineItems
    .filter((item) => item.kind === "alteration")
    .reduce((sum, item) => sum + item.amount, 0);
  const customSubtotal = openOrder.lineItems
    .filter((item) => item.kind === "custom")
    .reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = Math.max(openOrder.total - alterationSubtotal - customSubtotal, 0);
  const readyScopes = new Set(
    openOrder.pickupSchedules
      .filter((pickup) => pickup.readyForPickup && !pickup.pickedUp)
      .map((pickup) => pickup.scope),
  );

  if (!readyScopes.size) {
    return 0;
  }

  const mixedAllocation = openOrder.orderType === "mixed"
    ? getMixedPaymentAllocation(openOrder)
    : null;
  const alterationCollectible = openOrder.orderType === "mixed"
    ? mixedAllocation?.alterationDue ?? 0
    : alterationSubtotal > 0
      ? alterationSubtotal + taxAmount
      : 0;
  const alterationCaptured = openOrder.orderType === "mixed"
    ? mixedAllocation?.alterationPaid ?? 0
    : Math.min(openOrder.totalCollected, alterationCollectible);
  const alterationRemaining = Math.max(alterationCollectible - alterationCaptured, 0);

  const customCollectible = openOrder.orderType === "mixed"
    ? mixedAllocation?.customFinalDue ?? 0
    : customSubtotal > 0
      ? customSubtotal + taxAmount
      : 0;
  const customCaptured = openOrder.orderType === "mixed"
    ? mixedAllocation?.customFinalPaid ?? 0
    : openOrder.totalCollected;
  const customRemaining = Math.max(customCollectible - customCaptured, 0);

  let due = 0;
  if (readyScopes.has("alteration")) {
    due += alterationRemaining;
  }
  if (readyScopes.has("custom")) {
    due += customRemaining;
  }

  return roundCurrency(Math.max(due, 0));
}

export function getOpenOrderPickupBalanceDueFromPayments({
  orderType,
  lineItems,
  pickupSchedules,
  payments,
  total,
}: {
  orderType: OpenOrder["orderType"];
  lineItems: OpenOrder["lineItems"];
  pickupSchedules: OpenOrder["pickupSchedules"];
  payments: DbPaymentRecord[];
  total: number;
}) {
  const totalCollected = payments.reduce((sum, payment) => (
    payment.status === "captured" ? sum + payment.amount : sum
  ), 0);
  const readyScopes = new Set(
    pickupSchedules
      .filter((pickup) => pickup.readyForPickup && !pickup.pickedUp)
      .map((pickup) => pickup.scope),
  );

  if (!readyScopes.size) {
    return 0;
  }

  const alterationSubtotal = lineItems
    .filter((item) => item.kind === "alteration")
    .reduce((sum, item) => sum + item.amount, 0);
  const customSubtotal = lineItems
    .filter((item) => item.kind === "custom")
    .reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = Math.max(total - alterationSubtotal - customSubtotal, 0);
  const mixedAllocation = orderType === "mixed"
    ? getMixedPaymentAllocationFromPayments({ payments, lineItems, total })
    : null;
  const alterationCollectible = orderType === "mixed"
    ? mixedAllocation?.alterationDue ?? 0
    : alterationSubtotal > 0
      ? alterationSubtotal + taxAmount
      : 0;
  const alterationCaptured = orderType === "mixed"
    ? mixedAllocation?.alterationPaid ?? 0
    : Math.min(totalCollected, alterationCollectible);
  const customCollectible = orderType === "mixed"
    ? mixedAllocation?.customFinalDue ?? 0
    : customSubtotal > 0
      ? customSubtotal + taxAmount
      : 0;
  const customCaptured = orderType === "mixed"
    ? mixedAllocation?.customFinalPaid ?? 0
    : totalCollected;

  let due = 0;
  if (readyScopes.has("alteration")) {
    due += Math.max(alterationCollectible - alterationCaptured, 0);
  }
  if (readyScopes.has("custom")) {
    due += Math.max(customCollectible - customCaptured, 0);
  }

  return roundCurrency(Math.max(due, 0));
}

export function hasReadyScopesForPickup(openOrder: Pick<OpenOrder, "pickupSchedules">) {
  return openOrder.pickupSchedules.some((pickup) => pickup.readyForPickup && !pickup.pickedUp);
}
