import { describe, expect, it } from "vitest";
import { adaptClosedOrderDetail, adaptClosedOrderHistory } from "./adapters";
import { createPrototypeDatabase } from "./runtime";

describe("db adapters", () => {
  it("sorts closed history by canonical close time and exposes the recorded close timestamp", () => {
    const database = createPrototypeDatabase(new Date("2026-03-22T12:00:00.000Z"));
    const completedOrder = database.orders.find((order) => order.id === "order-9001");
    const canceledOrder = database.orders.find((order) => order.id === "order-9002");
    const completedScope = database.orderScopes.find((scope) => scope.orderId === "order-9001");

    expect(completedOrder).toBeTruthy();
    expect(canceledOrder).toBeTruthy();
    expect(completedScope).toBeTruthy();

    completedOrder!.status = "complete";
    completedOrder!.completedAt = "2026-03-24T10:30:00.000Z";
    canceledOrder!.status = "canceled";
    canceledOrder!.canceledAt = "2026-03-23T08:15:00.000Z";
    completedScope!.pickedUpAt = "2026-03-21T09:00:00.000Z";

    const closedHistory = adaptClosedOrderHistory(database);

    expect(closedHistory[0]).toMatchObject({
      id: "ORD-9001",
      closedAt: "2026-03-24T10:30:00.000Z",
      completedAt: "2026-03-24T10:30:00.000Z",
      status: "Picked up",
    });
    expect(closedHistory[1]).toMatchObject({
      id: "ORD-9002",
      closedAt: "2026-03-23T08:15:00.000Z",
      status: "Canceled",
    });
  });

  it("builds a read-only closed-order detail from canonical database records", () => {
    const database = createPrototypeDatabase(new Date("2026-03-22T12:00:00.000Z"));
    const targetOrder = database.orders.find((order) => order.id === "order-9003");

    expect(targetOrder).toBeTruthy();
    targetOrder!.status = "canceled";
    targetOrder!.canceledAt = "2026-03-22T18:45:00.000Z";

    const detail = adaptClosedOrderDetail(database, 9003);

    expect(detail).toMatchObject({
      id: 9003,
      displayId: "ORD-9003",
      closedAt: "2026-03-22T18:45:00.000Z",
      status: "Canceled",
    });
    expect(detail?.timeline.length).toBeGreaterThan(0);
  });
});
