import type { DbOrder, DbPaymentRecord, DbSquareLink } from "../../schema";
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

function customDeposit(
  orderId: string,
  amount: number,
  collectedAt: string,
  squarePaymentId: string,
): DbPaymentRecord {
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

function fullBalance(
  orderId: string,
  amount: number,
  collectedAt: string,
  squarePaymentId: string,
): DbPaymentRecord {
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

export function createPayments({ baseDate }: RuntimeSeedDates): DbPaymentRecord[] {
  return [
    // Open orders with a clean custom deposit already taken.
    customDeposit("order-9001", 747.5, toDateTimeString(withOffset(baseDate, 0, 10, 0)), "sq_pay_9001"),
    customDeposit("order-9003", 1120, toDateTimeString(withOffset(baseDate, 0, 11, 30)), "sq_pay_9003"),
    customDeposit("order-9006", 747.5, toDateTimeString(withOffset(baseDate, 0, 10, 30)), "sq_pay_9006"),
    customDeposit("order-9008", 947.5, toDateTimeString(withOffset(baseDate, -4, 14, 0)), "sq_pay_9008"),
    customDeposit("order-9010", 647.5, toDateTimeString(withOffset(baseDate, -6, 10, 45)), "sq_pay_9010"),
    customDeposit("order-9011", 797.5, toDateTimeString(withOffset(baseDate, -3, 12, 0)), "sq_pay_9011"),
    customDeposit("order-9015", 797.5, toDateTimeString(withOffset(baseDate, -3, 15, 30)), "sq_pay_9015"),
    customDeposit("order-9019", 847.5, toDateTimeString(withOffset(baseDate, -2, 16, 35)), "sq_pay_9019"),
    customDeposit("order-9023", 772.5, toDateTimeString(withOffset(baseDate, -5, 14, 30)), "sq_pay_9023"),

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
    fullBalance("order-9013", 1695, "2026-02-26T15:00:00", "sq_pay_9013"),
    fullBalance("order-8821", 1495, "2026-02-28T14:00:00", "sq_pay_8821"),
    fullBalance("order-8610", 65, "2026-01-17T12:00:00", "sq_pay_8610"),
    fullBalance("order-8732", 95, "2026-02-12T13:30:00", "sq_pay_8732"),
    fullBalance("order-8528", 35, "2026-01-08T12:00:00", "sq_pay_8528"),
    fullBalance("order-9017", 150, toDateTimeString(withOffset(baseDate, -1, 13, 20)), "sq_pay_9017"),
    fullBalance("order-9018", 1795, "2026-02-26T14:10:00", "sq_pay_9018"),
    fullBalance("order-9021", 1495, "2026-02-19T14:05:00", "sq_pay_9021"),
    capturedPayment({
      id: "pay-9025-1",
      orderId: "order-9025",
      source: "square",
      status: "captured",
      allocation: "custom_deposit",
      amount: 847.5,
      collectedAt: "2026-02-18T11:40:00",
      squarePaymentId: "sq_pay_9025_1",
    }),
    capturedPayment({
      id: "pay-9025-2",
      orderId: "order-9025",
      source: "square",
      status: "captured",
      allocation: "alteration_balance",
      amount: 95,
      collectedAt: "2026-02-24T13:40:00",
      squarePaymentId: "sq_pay_9025_2",
    }),
    capturedPayment({
      id: "pay-9025-3",
      orderId: "order-9025",
      source: "square",
      status: "captured",
      allocation: "custom_balance",
      amount: 847.5,
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
      amount: 797.5,
      collectedAt: toDateTimeString(withOffset(baseDate, -4, 12, 40)),
      squarePaymentId: "sq_pay_9024_1",
    }),
    capturedPayment({
      id: "pay-9024-2",
      orderId: "order-9024",
      source: "square",
      status: "captured",
      allocation: "alteration_balance",
      amount: 85,
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
