import { describe, expect, it } from "vitest";
import { createInitialOrderState } from "../../state/orderState";
import type { Appointment, Customer, OpenOrder, OrderWorkflowState } from "../../types";
import {
  buildOpenOrder,
  filterOpenOrders,
  getCheckoutCollectionAmount,
  getOrderQueueCounts,
  getPickupAlertState,
  getPricingSummary,
  getSummaryGuardrail,
} from "./selectors";

const customers: Customer[] = [
  {
    id: "cus_1",
    name: "Jordan Patel",
    phone: "555-0101",
    email: "jordan@example.com",
    address: "1 Main St",
    preferredLocation: "Fifth Avenue",
    lastVisit: "Mar 1",
    measurementsStatus: "on_file",
    marketingOptIn: true,
    notes: "",
  },
  {
    id: "cus_2",
    name: "Sam Rivera",
    phone: "555-0102",
    email: "sam@example.com",
    address: "2 Main St",
    preferredLocation: "Queens",
    lastVisit: "Mar 2",
    measurementsStatus: "missing",
    marketingOptIn: false,
    notes: "",
  },
];

function createMixedOrderState(): OrderWorkflowState {
  const order = createInitialOrderState();

  return {
    ...order,
    payerCustomerId: "cus_1",
    alteration: {
      ...order.alteration,
      items: [
        {
          id: 1,
          garment: "Trousers",
          modifiers: [
            { name: "Hem", price: 20 },
            { name: "Waist", price: 15 },
          ],
          subtotal: 35,
        },
      ],
    },
    custom: {
      ...order.custom,
      items: [
        {
          ...order.custom.draft,
          id: 2,
          gender: "male",
          wearerCustomerId: "cus_2",
          selectedGarment: "Dinner jacket",
          linkedMeasurementSetId: "SET-2-V1",
          measurements: { Chest: "40" },
          fabric: "Midnight navy",
          buttons: "Horn",
          lining: "Bemberg",
          threads: "Tonal",
          lapel: "Peak",
          pocketType: "Flap",
          canvas: "Full",
          wearerName: "Sam Rivera",
          linkedMeasurementLabel: "Version 1",
          measurementSnapshot: { Chest: "40" },
        },
      ],
      draft: {
        ...order.custom.draft,
        gender: "male",
      },
    },
    fulfillment: {
      alteration: {
        pickupDate: "2026-03-22",
        pickupTime: "14:00",
        pickupLocation: "Fifth Avenue",
        eventType: "none",
        eventDate: "",
      },
      custom: {
        pickupDate: "",
        pickupTime: "",
        pickupLocation: "Queens",
        eventType: "wedding",
        eventDate: "2026-04-12",
      },
    },
  };
}

function createOpenOrder(overrides: Partial<OpenOrder>): OpenOrder {
  return {
    id: 1001,
    payerCustomerId: "cus_1",
    payerName: "Jordan Patel",
    orderType: "alteration",
    itemCount: 1,
    lineItems: [
      {
        id: "line-1",
        kind: "alteration",
        title: "1. Trouser hem",
        subtitle: "Alterations",
        amount: 35,
      },
    ],
    itemSummary: ["Trouser hem"],
    pickupSchedules: [
      {
        id: "pickup-a",
        scope: "alteration",
        label: "Alteration pickup",
        itemSummary: ["Trouser hem"],
        itemCount: 1,
        pickupDate: "2026-03-22",
        pickupTime: "14:00",
        pickupLocation: "Fifth Avenue",
        eventType: "none",
        eventDate: "",
        readyForPickup: false,
      },
    ],
    paymentStatus: "due_later",
    paymentDueNow: 0,
    totalCollected: 0,
    collectedToday: 0,
    balanceDue: 35,
    total: 35,
    createdAt: "2026-03-20T15:00:00.000Z",
    ...overrides,
  };
}

function createPickupAppointment(overrides: Partial<Appointment>): Appointment {
  return {
    id: "apt_1",
    scheduledFor: "2026-03-22T16:00:00.000Z",
    kind: "pickup",
    source: "prototype",
    location: "Fifth Avenue",
    customer: "Jordan Patel",
    durationMinutes: 30,
    typeKey: "pickup",
    type: "Pickup appointment",
    statusKey: "scheduled",
    status: "Upcoming",
    prepFlags: [],
    profileFlags: [],
    contextFlags: [],
    route: "pickup",
    ...overrides,
  };
}

describe("order selectors", () => {
  it("calculates mixed-order totals and collection amount", () => {
    const order = createMixedOrderState();

    expect(getPricingSummary(order)).toEqual({
      alterationsSubtotal: 35,
      customSubtotal: 1495,
      taxAmount: 135.7875,
      depositDue: 747.5,
      total: 1665.7875,
    });
    expect(getCheckoutCollectionAmount(order)).toBe(918.2875);
  });

  it("reports missing guardrails for incomplete custom drafts and absent pickup details", () => {
    const order = createInitialOrderState();
    order.custom.draft.selectedGarment = "Dinner jacket";
    order.custom.draft.gender = "male";

    expect(getSummaryGuardrail(order, null)).toEqual({
      missingCustomer: true,
      missingPickup: false,
      customIncomplete: true,
    });
  });

  it("uses fixed time inputs for pickup alerts", () => {
    const now = new Date(2026, 2, 22, 13, 30, 0, 0);

    expect(getPickupAlertState("2026-03-22", "14:00", false, now)).toEqual({
      tone: "warn",
      label: "Promised ready within 1 hour",
    });
    expect(getPickupAlertState("2026-03-21", "12:00", false, now)).toEqual({
      tone: "danger",
      label: "Past promised ready time",
    });
    expect(getPickupAlertState("2026-03-23", "10:00", true, now)).toEqual({
      tone: "success",
      label: "Ready for pickup",
    });
  });

  it("counts and filters queues against a fixed clock", () => {
    const now = new Date(2026, 2, 22, 9, 0, 0, 0);
    const dueToday = createOpenOrder({});
    const dueTomorrow = createOpenOrder({
      id: 1002,
      pickupSchedules: [
        {
          ...createOpenOrder({}).pickupSchedules[0],
          id: "pickup-b",
          pickupDate: "2026-03-23",
        },
      ],
    });
    const ready = createOpenOrder({
      id: 1003,
      pickupSchedules: [
        {
          ...createOpenOrder({}).pickupSchedules[0],
          id: "pickup-c",
          readyForPickup: true,
        },
      ],
    });
    const pickupAppointments = [createPickupAppointment({ id: "apt_2" })];

    expect(getOrderQueueCounts([dueToday, dueTomorrow, ready], pickupAppointments, { now })).toEqual({
      all: 4,
      due_today: 2,
      due_tomorrow: 1,
      ready_for_pickup: 1,
      overdue: 0,
      in_house: 3,
      factory: 0,
      scheduled_pickups: 1,
    });

    expect(
      filterOpenOrders(
        [dueToday, dueTomorrow, ready],
        {
          query: "",
          queue: "due_today",
          typeFilter: "all",
          locationFilter: "all",
        },
        { now },
      ).map((order) => order.id),
    ).toEqual([1001, 1003]);
  });

  it("builds open orders deterministically for tests", () => {
    const order = createMixedOrderState();
    const now = new Date(2026, 2, 22, 10, 15, 0, 0);

    const openOrder = buildOpenOrder(order, customers, "captured", {
      now,
      idFactory: () => 4242,
    });

    expect(openOrder).toMatchObject({
      id: 4242,
      payerCustomerId: "cus_1",
      payerName: "Jordan Patel",
      orderType: "mixed",
      paymentStatus: "captured",
      paymentDueNow: 747.4999999999999,
      totalCollected: 918.2875,
      collectedToday: 918.2875,
      balanceDue: 747.4999999999999,
      createdAt: now.toISOString(),
    });
    expect(openOrder?.pickupSchedules.map((pickup) => pickup.id)).toEqual([
      "4242-alteration",
      "4242-custom",
    ]);
  });
});
