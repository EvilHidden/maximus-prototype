import type {
  CheckoutPaymentMode,
  OpenOrder,
  OpenOrderPaymentStatus,
  OrderType,
  OrderWorkflowState,
  PricingSummary,
} from "../../types";
import type { DbPaymentRecord } from "../../db/schema";
import type { PricingComputationConfig } from "../../db/pricing";
import { getPricingSummary } from "./orderPricing";

export type PaymentSummary = {
  paymentStatus: OpenOrderPaymentStatus;
  paymentDueNow: number;
  totalCollected: number;
  collectedToday: number;
  balanceDue: number;
  total: number;
};

export type PaymentPolicy = {
  minimumDueNow: number;
  depositAndAlterationAmount: number;
  collectibleNow: number;
  suggestedAmount: number;
  remainingAfterSuggested: number;
  allowDeferredPayment: boolean;
  allowFullPrepay: boolean;
};

type MixedPaymentAllocation = {
  depositDue: number;
  depositPaid: number;
  alterationDue: number;
  alterationPaid: number;
  customFinalDue: number;
  customFinalPaid: number;
  taxAmount: number;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function getPaymentRecencyKey(payment: DbPaymentRecord, fallbackIndex: number) {
  if (payment.collectedAt) {
    const collectedAt = new Date(payment.collectedAt).getTime();
    if (!Number.isNaN(collectedAt)) {
      return {
        hasExplicitTimestamp: true,
        timestamp: collectedAt,
        fallbackIndex,
      };
    }
  }

  return {
    hasExplicitTimestamp: false,
    timestamp: Number.NEGATIVE_INFINITY,
    fallbackIndex,
  };
}

function getLatestRecordedPayment(payments: DbPaymentRecord[]) {
  if (!payments.length) {
    return null;
  }

  let latest: DbPaymentRecord | null = null;
  let latestIndex = -1;

  payments.forEach((candidate, candidateIndex) => {
    if (!latest) {
      latest = candidate;
      latestIndex = candidateIndex;
      return;
    }

    const latestRecency = getPaymentRecencyKey(latest, latestIndex);
    const candidateRecency = getPaymentRecencyKey(candidate, candidateIndex);

    if (latestRecency.hasExplicitTimestamp !== candidateRecency.hasExplicitTimestamp) {
      if (candidateRecency.hasExplicitTimestamp) {
        latest = candidate;
        latestIndex = candidateIndex;
      }
      return;
    }

    if (candidateRecency.timestamp > latestRecency.timestamp || (
      candidateRecency.timestamp === latestRecency.timestamp
      && candidateRecency.fallbackIndex > latestRecency.fallbackIndex
    )) {
      latest = candidate;
      latestIndex = candidateIndex;
    }
  });

  return latest;
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

function getReadyScopes(pickupSchedules: Pick<OpenOrder["pickupSchedules"][number], "scope" | "readyForPickup" | "pickedUp">[]) {
  return new Set(
    pickupSchedules
      .filter((pickup) => pickup.readyForPickup && !pickup.pickedUp)
      .map((pickup) => pickup.scope),
  );
}

export function getMixedPaymentAllocation(openOrder: Pick<OpenOrder, "lineItems" | "totalCollected" | "total">): MixedPaymentAllocation {
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

export function getMixedPaymentAllocationFromPayments({
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
  const remainingDepositGap = Math.max(base.depositDue - depositPaid, 0);
  const alterationPaidFromExplicit = Math.min(allocatedAlteration, base.alterationDue);
  const customFinalPaidFromExplicit = Math.min(allocatedCustomBalance, base.customFinalDue);
  const remainingAlterationGap = Math.max(base.alterationDue - alterationPaidFromExplicit, 0);
  const remainingCustomGap = Math.max(base.customFinalDue - customFinalPaidFromExplicit, 0);

  const fullAppliedToDeposit = Math.min(allocatedFullBalance, remainingDepositGap);
  const fullAfterDeposit = Math.max(allocatedFullBalance - fullAppliedToDeposit, 0);
  const fullAppliedToAlteration = Math.min(fullAfterDeposit, remainingAlterationGap);
  const fullAfterAlteration = Math.max(fullAfterDeposit - fullAppliedToAlteration, 0);
  const fullAppliedToCustom = Math.min(fullAfterAlteration, remainingCustomGap);

  return {
    ...base,
    depositPaid: roundCurrency(depositPaid + fullAppliedToDeposit),
    alterationPaid: roundCurrency(alterationPaidFromExplicit + fullAppliedToAlteration),
    customFinalPaid: roundCurrency(customFinalPaidFromExplicit + fullAppliedToCustom),
  };
}

function getPaymentPolicyFromDraftPricing(pricing: PricingSummary, orderType: OrderType | null): PaymentPolicy {
  if (!orderType) {
    return {
      minimumDueNow: 0,
      depositAndAlterationAmount: 0,
      collectibleNow: 0,
      suggestedAmount: 0,
      remainingAfterSuggested: 0,
      allowDeferredPayment: true,
      allowFullPrepay: false,
    };
  }

  if (orderType === "alteration") {
    return {
      minimumDueNow: 0,
      depositAndAlterationAmount: 0,
      collectibleNow: roundCurrency(pricing.total),
      suggestedAmount: 0,
      remainingAfterSuggested: roundCurrency(pricing.total),
      allowDeferredPayment: true,
      allowFullPrepay: pricing.total > 0,
    };
  }

  const minimumDueNow = roundCurrency(
    orderType === "custom"
      ? pricing.depositDue
      : pricing.depositDue,
  );
  const collectibleNow = roundCurrency(pricing.total);

  return {
    minimumDueNow,
    depositAndAlterationAmount: roundCurrency(
      orderType === "mixed"
        ? pricing.depositDue + pricing.alterationsSubtotal + pricing.taxAmount
        : minimumDueNow,
    ),
    collectibleNow,
    suggestedAmount: minimumDueNow,
    remainingAfterSuggested: roundCurrency(Math.max(collectibleNow - minimumDueNow, 0)),
    allowDeferredPayment: minimumDueNow <= 0,
    allowFullPrepay: collectibleNow > minimumDueNow,
  };
}

function getPolicyFromRecordedData({
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
}): PaymentPolicy {
  const totalCollected = roundCurrency(payments.reduce((sum, payment) => (
    payment.status === "captured" ? sum + payment.amount : sum
  ), 0));
  const balanceDue = roundCurrency(Math.max(total - totalCollected, 0));
  const readyScopes = getReadyScopes(pickupSchedules);

  if (balanceDue <= 0) {
    return {
      minimumDueNow: 0,
      depositAndAlterationAmount: 0,
      collectibleNow: 0,
      suggestedAmount: 0,
      remainingAfterSuggested: 0,
      allowDeferredPayment: true,
      allowFullPrepay: false,
    };
  }

  if (readyScopes.size) {
    const minimumDueNow = getOpenOrderPickupBalanceDueFromPayments({
      orderType,
      lineItems,
      pickupSchedules,
      payments,
      total,
    });

    return {
      minimumDueNow,
      depositAndAlterationAmount: minimumDueNow,
      collectibleNow: balanceDue,
      suggestedAmount: minimumDueNow,
      remainingAfterSuggested: roundCurrency(Math.max(balanceDue - minimumDueNow, 0)),
      allowDeferredPayment: minimumDueNow <= 0,
      allowFullPrepay: balanceDue > minimumDueNow,
    };
  }

  if (orderType === "alteration") {
    return {
      minimumDueNow: 0,
      depositAndAlterationAmount: 0,
      collectibleNow: balanceDue,
      suggestedAmount: 0,
      remainingAfterSuggested: balanceDue,
      allowDeferredPayment: true,
      allowFullPrepay: balanceDue > 0,
    };
  }

  if (orderType === "custom") {
    const customSubtotal = lineItems
      .filter((item) => item.kind === "custom")
      .reduce((sum, item) => sum + item.amount, 0);
    const depositDue = roundCurrency(customSubtotal * 0.5);
    const depositPaid = roundCurrency(Math.min(totalCollected, depositDue));
    const minimumDueNow = roundCurrency(Math.max(depositDue - depositPaid, 0));

    return {
      minimumDueNow,
      depositAndAlterationAmount: minimumDueNow,
      collectibleNow: balanceDue,
      suggestedAmount: minimumDueNow,
      remainingAfterSuggested: roundCurrency(Math.max(balanceDue - minimumDueNow, 0)),
      allowDeferredPayment: minimumDueNow <= 0,
      allowFullPrepay: balanceDue > minimumDueNow,
    };
  }

  const mixedAllocation = getMixedPaymentAllocationFromPayments({ payments, lineItems, total });
  const minimumDueNow = roundCurrency(Math.max(mixedAllocation.depositDue - mixedAllocation.depositPaid, 0));
  const depositAndAlterationAmount = roundCurrency(
    Math.max(mixedAllocation.depositDue - mixedAllocation.depositPaid, 0)
      + Math.max(mixedAllocation.alterationDue - mixedAllocation.alterationPaid, 0),
  );

  return {
    minimumDueNow,
    depositAndAlterationAmount,
    collectibleNow: balanceDue,
    suggestedAmount: minimumDueNow,
    remainingAfterSuggested: roundCurrency(Math.max(balanceDue - minimumDueNow, 0)),
    allowDeferredPayment: minimumDueNow <= 0,
    allowFullPrepay: balanceDue > minimumDueNow,
  };
}

function getPaymentStatusFromPolicy({
  latestPayment,
  balanceDue,
  minimumDueNow,
}: {
  latestPayment: DbPaymentRecord | undefined;
  balanceDue: number;
  minimumDueNow: number;
}): OpenOrderPaymentStatus {
  if (latestPayment?.status === "pending") {
    return "pending";
  }

  if (balanceDue <= 0) {
    return "captured";
  }

  return minimumDueNow > 0 ? "ready_to_collect" : "due_later";
}

export function getCheckoutCollectionAmountForPricing(
  pricing: PricingSummary,
  orderType: OrderType | null,
) {
  return getPaymentPolicyFromDraftPricing(pricing, orderType).minimumDueNow;
}

export function getCheckoutCollectionAmount(order: OrderWorkflowState, config: PricingComputationConfig = {}) {
  return getCheckoutCollectionAmountForPricing(getPricingSummary(order, config), getDraftOrderType(order));
}

export function getDraftPaymentPolicy(order: OrderWorkflowState, config: PricingComputationConfig = {}): PaymentPolicy {
  return getPaymentPolicyFromDraftPricing(getPricingSummary(order, config), getDraftOrderType(order));
}

export function getRecordedPaymentPolicy(args: {
  orderType: OpenOrder["orderType"];
  lineItems: OpenOrder["lineItems"];
  pickupSchedules: OpenOrder["pickupSchedules"];
  payments: DbPaymentRecord[];
  total: number;
}): PaymentPolicy {
  return getPolicyFromRecordedData(args);
}

export function getDraftPaymentSummary(
  order: OrderWorkflowState,
  paymentStatus: OpenOrderPaymentStatus,
  config: PricingComputationConfig = {},
): PaymentSummary {
  const pricing = getPricingSummary(order, config);
  const policy = getDraftPaymentPolicy(order, config);
  const totalCollected = paymentStatus === "captured"
    ? (policy.allowFullPrepay ? policy.collectibleNow : policy.minimumDueNow)
    : 0;

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
  lineItems = [],
  pickupSchedules = [],
}: {
  payments: DbPaymentRecord[];
  generatedAt: string;
  orderType: OrderType;
  total: number;
  lineItems?: OpenOrder["lineItems"];
  pickupSchedules?: OpenOrder["pickupSchedules"];
}): PaymentSummary {
  const latest = getLatestRecordedPayment(payments);
  const today = new Date(generatedAt);
  today.setHours(0, 0, 0, 0);

  const totalCollected = roundCurrency(payments.reduce((sum, record) => (
    record.status === "captured" ? sum + record.amount : sum
  ), 0));

  const collectedToday = roundCurrency(payments.reduce((sum, record) => {
    if (record.status !== "captured" || !record.collectedAt) {
      return sum;
    }

    const collectedAt = new Date(record.collectedAt);
    if (Number.isNaN(collectedAt.getTime())) {
      return sum;
    }

    collectedAt.setHours(0, 0, 0, 0);
    return collectedAt.getTime() === today.getTime() ? sum + record.amount : sum;
  }, 0));

  const balanceDue = roundCurrency(Math.max(total - totalCollected, 0));
  const policy = getPolicyFromRecordedData({
    orderType,
    lineItems,
    pickupSchedules,
    payments,
    total,
  });

  return {
    paymentStatus: getPaymentStatusFromPolicy({
      latestPayment: latest,
      balanceDue,
      minimumDueNow: policy.minimumDueNow,
    }),
    paymentDueNow: policy.minimumDueNow,
    totalCollected,
    collectedToday,
    balanceDue,
    total,
  };
}

export function getPaymentAmountFromPolicy(policy: PaymentPolicy, mode: Exclude<CheckoutPaymentMode, "none">) {
  if (mode === "full_balance") {
    return roundCurrency(policy.collectibleNow);
  }

  if (mode === "deposit_and_alterations") {
    return roundCurrency(policy.depositAndAlterationAmount);
  }

  return roundCurrency(policy.minimumDueNow);
}

export function getOpenOrderPickupBalanceDue(
  openOrder: Pick<OpenOrder, "orderType" | "lineItems" | "pickupSchedules" | "totalCollected" | "total">,
) {
  const alterationSubtotal = openOrder.lineItems
    .filter((item) => item.kind === "alteration")
    .reduce((sum, item) => sum + item.amount, 0);
  const customSubtotal = openOrder.lineItems
    .filter((item) => item.kind === "custom")
    .reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = Math.max(openOrder.total - alterationSubtotal - customSubtotal, 0);
  const readyScopes = getReadyScopes(openOrder.pickupSchedules);

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
  const readyScopes = getReadyScopes(pickupSchedules);

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
