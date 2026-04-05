import { describe, expect, it } from "vitest";
import type { DbPaymentRecord } from "../../db/schema";
import { getRecordedPaymentSummary } from "./paymentSummary";

function createPaymentRecord(overrides: Partial<DbPaymentRecord>): DbPaymentRecord {
  return {
    id: "payment-1",
    orderId: "order-1",
    source: "prototype",
    status: "captured",
    allocation: "full_balance",
    amount: 50,
    collectedAt: "2026-03-22T10:00:00.000Z",
    squarePaymentId: null,
    ...overrides,
  };
}

describe("payment summary", () => {
  it("uses the newest recorded payment status even when the caller passes payments unsorted", () => {
    const summary = getRecordedPaymentSummary({
      payments: [
        createPaymentRecord({
          id: "payment-pending-newest",
          status: "pending",
          amount: 50,
          collectedAt: "2026-03-22T13:00:00.000Z",
        }),
        createPaymentRecord({
          id: "payment-captured-oldest",
          status: "captured",
          amount: 50,
          collectedAt: "2026-03-22T09:00:00.000Z",
        }),
      ],
      generatedAt: "2026-03-22T16:00:00.000Z",
      orderType: "alteration",
      total: 100,
    });

    expect(summary.paymentStatus).toBe("pending");
    expect(summary.totalCollected).toBe(50);
    expect(summary.balanceDue).toBe(50);
  });

  it("falls back to the latest undated payment when none of the records have collected timestamps", () => {
    const summary = getRecordedPaymentSummary({
      payments: [
        createPaymentRecord({
          id: "payment-captured-earlier",
          status: "captured",
          amount: 50,
          collectedAt: null,
        }),
        createPaymentRecord({
          id: "payment-pending-latest",
          status: "pending",
          amount: 50,
          collectedAt: null,
        }),
      ],
      generatedAt: "2026-03-22T16:00:00.000Z",
      orderType: "alteration",
      total: 100,
    });

    expect(summary.paymentStatus).toBe("pending");
    expect(summary.totalCollected).toBe(50);
  });
});
