import { describe, expect, it } from "vitest";
import type { ClosedOrderHistoryItem } from "../../types";
import { filterClosedOrderHistory } from "./orderQueueSearch";

function createClosedOrder(overrides: Partial<ClosedOrderHistoryItem>): ClosedOrderHistoryItem {
  return {
    id: "ORD-1",
    orderNumber: 1,
    customerName: "Jordan Patel",
    payerName: "Jordan Patel",
    label: "Order",
    createdAt: "2026-03-20T10:00:00.000Z",
    closedAt: "2026-03-22T12:00:00.000Z",
    status: "Picked up",
    total: 100,
    orderType: "alteration",
    pickupSchedules: [{
      id: "pickup-1",
      scope: "alteration",
      label: "Alteration pickup",
      itemSummary: ["Hem"],
      itemCount: 1,
      pickupDate: "2026-03-22",
      pickupTime: "14:00",
      pickupLocation: "Fifth Avenue",
      eventType: "none",
      eventDate: "",
      readyForPickup: false,
    }],
    itemSummary: ["Hem"],
    ...overrides,
  };
}

describe("closed order queue search", () => {
  it("applies query, type, and location filters to closed history", () => {
    const historyItems: ClosedOrderHistoryItem[] = [
      createClosedOrder({
        id: "ORD-1",
        orderNumber: 1,
        payerName: "Jordan Patel",
        customerName: "Jordan Patel",
        orderType: "alteration",
      }),
      createClosedOrder({
        id: "ORD-2",
        orderNumber: 2,
        payerName: "Sam Rivera",
        customerName: "Sam Rivera",
        orderType: "custom",
        pickupSchedules: [{
          id: "pickup-2",
          scope: "custom",
          label: "Custom pickup",
          itemSummary: ["Dinner jacket"],
          itemCount: 1,
          pickupDate: "2026-03-23",
          pickupTime: "11:30",
          pickupLocation: "Queens",
          eventType: "wedding",
          eventDate: "2026-04-02",
          readyForPickup: false,
        }],
        itemSummary: ["Dinner jacket"],
      }),
    ];

    expect(filterClosedOrderHistory(historyItems, {
      query: "sam",
      typeFilter: "custom",
      locationFilter: "Queens",
    })).toHaveLength(1);

    expect(filterClosedOrderHistory(historyItems, {
      query: "",
      typeFilter: "custom",
      locationFilter: "Fifth Avenue",
    })).toHaveLength(0);
  });
});
