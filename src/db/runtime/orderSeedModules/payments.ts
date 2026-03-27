import type { DbOrder, DbOrderScope, DbOrderScopeLine, DbPaymentRecord, DbSquareLink } from "../../schema";
import { roundCurrency } from "../../pricing";
import { RuntimeSeedDates, toDateTimeString, withOffset } from "../support";

function dueLater(orderId: string): DbPaymentRecord {
  return {
    id: `pay-${orderId.replace("order-", "")}`,
    orderId,
    source: "prototype",
    status: "due_later",
    amount: 0,
    collectedAt: null,
    squarePaymentId: null,
  };
}

function customDeposit(orderId: string, amount: number, collectedAt: string, squarePaymentId: string): DbPaymentRecord {
  return {
    id: `pay-${orderId.replace("order-", "")}`,
    orderId,
    source: "square",
    status: "captured",
    allocation: "custom_deposit",
    amount,
    collectedAt,
    squarePaymentId,
  };
}

function fullBalance(orderId: string, amount: number, collectedAt: string, squarePaymentId: string): DbPaymentRecord {
  return {
    id: `pay-${orderId.replace("order-", "")}`,
    orderId,
    source: "square",
    status: "captured",
    allocation: "full_balance",
    amount,
    collectedAt,
    squarePaymentId,
  };
}

function capturedPayment(input: DbPaymentRecord): DbPaymentRecord {
  return input;
}

type DerivedOrderPricing = {
  alterationSubtotal: number;
  customSubtotal: number;
  total: number;
  depositDue: number;
  alterationBalanceDue: number;
  customBalanceDue: number;
};

function createOrderPricingByOrderId(
  orders: DbOrder[],
  orderScopes: DbOrderScope[],
  orderScopeLines: DbOrderScopeLine[],
) {
  const scopeById = new Map(orderScopes.map((scope) => [scope.id, scope]));
  const pricingByOrderId = new Map<string, DerivedOrderPricing>();

  orders.forEach((order) => {
    pricingByOrderId.set(order.id, {
      alterationSubtotal: 0,
      customSubtotal: 0,
      total: 0,
      depositDue: 0,
      alterationBalanceDue: 0,
      customBalanceDue: 0,
    });
  });

  orderScopeLines.forEach((line) => {
    const scope = scopeById.get(line.scopeId);
    if (!scope) {
      return;
    }

    const pricing = pricingByOrderId.get(scope.orderId);
    if (!pricing) {
      return;
    }

    const lineTotal = roundCurrency(line.unitPrice * line.quantity);

    if (scope.workflow === "alteration") {
      pricing.alterationSubtotal = roundCurrency(pricing.alterationSubtotal + lineTotal);
    } else {
      pricing.customSubtotal = roundCurrency(pricing.customSubtotal + lineTotal);
    }

    pricing.total = roundCurrency(pricing.total + lineTotal);
  });

  pricingByOrderId.forEach((pricing) => {
    pricing.depositDue = roundCurrency(pricing.customSubtotal * 0.5);
    pricing.customBalanceDue = roundCurrency(Math.max(pricing.customSubtotal - pricing.depositDue, 0));
    pricing.alterationBalanceDue = roundCurrency(pricing.alterationSubtotal);
  });

  return pricingByOrderId;
}

function getOrderPricing(
  pricingByOrderId: Map<string, DerivedOrderPricing>,
  orderId: string,
): DerivedOrderPricing {
  const pricing = pricingByOrderId.get(orderId);

  if (!pricing) {
    throw new Error(`Missing derived pricing for ${orderId}.`);
  }

  return pricing;
}

export function createPayments(
  { baseDate }: RuntimeSeedDates,
  orders: DbOrder[],
  orderScopes: DbOrderScope[],
  orderScopeLines: DbOrderScopeLine[],
): DbPaymentRecord[] {
  const pricingByOrderId = createOrderPricingByOrderId(orders, orderScopes, orderScopeLines);

  return [
    // Open orders with a clean custom deposit already taken.
    customDeposit("order-9001", getOrderPricing(pricingByOrderId, "order-9001").depositDue, toDateTimeString(withOffset(baseDate, 0, 10, 0)), "sq_pay_9001"),
    customDeposit("order-9003", getOrderPricing(pricingByOrderId, "order-9003").depositDue, toDateTimeString(withOffset(baseDate, 0, 11, 30)), "sq_pay_9003"),
    customDeposit("order-9006", getOrderPricing(pricingByOrderId, "order-9006").depositDue, toDateTimeString(withOffset(baseDate, 0, 10, 30)), "sq_pay_9006"),
    customDeposit("order-9008", getOrderPricing(pricingByOrderId, "order-9008").depositDue, toDateTimeString(withOffset(baseDate, -4, 14, 0)), "sq_pay_9008"),
    customDeposit("order-9010", getOrderPricing(pricingByOrderId, "order-9010").depositDue, toDateTimeString(withOffset(baseDate, -6, 10, 45)), "sq_pay_9010"),
    customDeposit("order-9011", getOrderPricing(pricingByOrderId, "order-9011").depositDue, toDateTimeString(withOffset(baseDate, -3, 12, 0)), "sq_pay_9011"),
    customDeposit("order-9015", getOrderPricing(pricingByOrderId, "order-9015").depositDue, toDateTimeString(withOffset(baseDate, -3, 15, 30)), "sq_pay_9015"),
    customDeposit("order-9019", getOrderPricing(pricingByOrderId, "order-9019").depositDue, toDateTimeString(withOffset(baseDate, -2, 16, 35)), "sq_pay_9019"),
    customDeposit("order-9023", getOrderPricing(pricingByOrderId, "order-9023").depositDue, toDateTimeString(withOffset(baseDate, -5, 14, 30)), "sq_pay_9023"),

    // Open orders with no payment captured yet.
    dueLater("order-9002"),
    dueLater("order-9004"),
    dueLater("order-9005"),
    dueLater("order-9007"),
    dueLater("order-9009"),
    dueLater("order-9012"),
    dueLater("order-8443"),
    dueLater("order-8904"),
    dueLater("order-8940"),
    dueLater("order-9014"),
    dueLater("order-9016"),
    dueLater("order-9020"),
    dueLater("order-9022"),

    // Closed orders already fully paid.
    fullBalance("order-9013", getOrderPricing(pricingByOrderId, "order-9013").total, "2026-02-26T15:00:00", "sq_pay_9013"),
    fullBalance("order-8821", getOrderPricing(pricingByOrderId, "order-8821").total, "2026-02-28T14:00:00", "sq_pay_8821"),
    fullBalance("order-8610", getOrderPricing(pricingByOrderId, "order-8610").total, "2026-01-17T12:00:00", "sq_pay_8610"),
    fullBalance("order-8732", getOrderPricing(pricingByOrderId, "order-8732").total, "2026-02-12T13:30:00", "sq_pay_8732"),
    fullBalance("order-8528", getOrderPricing(pricingByOrderId, "order-8528").total, "2026-01-08T12:00:00", "sq_pay_8528"),
    fullBalance("order-9017", getOrderPricing(pricingByOrderId, "order-9017").total, toDateTimeString(withOffset(baseDate, -1, 13, 20)), "sq_pay_9017"),
    fullBalance("order-9018", getOrderPricing(pricingByOrderId, "order-9018").total, "2026-02-26T14:10:00", "sq_pay_9018"),
    fullBalance("order-9021", getOrderPricing(pricingByOrderId, "order-9021").total, "2026-02-19T14:05:00", "sq_pay_9021"),
    capturedPayment({
      id: "pay-9025-1",
      orderId: "order-9025",
      source: "square",
      status: "captured",
      allocation: "custom_deposit",
      amount: getOrderPricing(pricingByOrderId, "order-9025").depositDue,
      collectedAt: "2026-02-18T11:40:00",
      squarePaymentId: "sq_pay_9025_1",
    }),
    capturedPayment({
      id: "pay-9025-2",
      orderId: "order-9025",
      source: "square",
      status: "captured",
      allocation: "alteration_balance",
      amount: getOrderPricing(pricingByOrderId, "order-9025").alterationBalanceDue,
      collectedAt: "2026-02-24T13:40:00",
      squarePaymentId: "sq_pay_9025_2",
    }),
    capturedPayment({
      id: "pay-9025-3",
      orderId: "order-9025",
      source: "square",
      status: "captured",
      allocation: "custom_balance",
      amount: getOrderPricing(pricingByOrderId, "order-9025").customBalanceDue,
      collectedAt: "2026-02-27T14:35:00",
      squarePaymentId: "sq_pay_9025_3",
    }),

    // Mixed order with alteration already picked up and custom still awaiting final balance.
    capturedPayment({
      id: "pay-9024-1",
      orderId: "order-9024",
      source: "square",
      status: "captured",
      allocation: "custom_deposit",
      amount: getOrderPricing(pricingByOrderId, "order-9024").depositDue,
      collectedAt: toDateTimeString(withOffset(baseDate, -4, 12, 40)),
      squarePaymentId: "sq_pay_9024_1",
    }),
    capturedPayment({
      id: "pay-9024-2",
      orderId: "order-9024",
      source: "square",
      status: "captured",
      allocation: "alteration_balance",
      amount: getOrderPricing(pricingByOrderId, "order-9024").alterationBalanceDue,
      collectedAt: toDateTimeString(withOffset(baseDate, -3, 14, 25)),
      squarePaymentId: "sq_pay_9024_2",
    }),
  ];
}

export function createSquareLinks(orders: DbOrder[]): DbSquareLink[] {
  return orders.map((order) => ({
    orderId: order.id,
    squareOrderId: `sq_order_${order.displayId.toLowerCase()}`,
  }));
}
