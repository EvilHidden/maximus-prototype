import { describe, expect, it } from "vitest";
import { createInitialOrderState } from "../../state/orderState";
import type { Appointment, Customer, OpenOrder, OrderWorkflowState } from "../../types";
import {
  buildOpenOrder,
  filterOpenOrders,
  getCheckoutCollectionAmount,
  getNeedsAttentionOpenOrders,
  getOpenOrderOperationalPhase,
  getOpenOrderReadinessDetails,
  getOpenOrderStatusPills,
  getOperatorQueueStage,
  getOperatorQueueStageCounts,
  getOrderQueueCounts,
  getPickupAlertState,
  getPickupAppointmentConfirmationState,
  getPickupAppointmentSummary,
  getPickupTimingLabel,
  getPricingSummary,
  getSummaryGuardrail,
  sortOpenOrdersChronologically,
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
    operationalStatus: "accepted",
    inHouseAssignee: null,
    itemCount: 1,
    lineItems: [
      {
        id: "line-1",
        kind: "alteration",
        title: "1. Trouser hem",
        subtitle: "Hem",
        amount: 35,
        sourceLabel: "Trouser hem",
        garmentLabel: "Trousers",
        wearerCustomerId: null,
        wearerName: null,
        linkedMeasurementSetId: null,
        linkedMeasurementLabel: null,
        measurementSnapshot: null,
        components: [
          {
            id: "line-1-service-1",
            kind: "alteration_service",
            label: "Service",
            value: "Hem",
            sortOrder: 1,
          },
        ],
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

  it("formats pickup appointments for operator-facing rows", () => {
    const appointment = createPickupAppointment({
      pickupSummary: "Alterations: jeans, pants • Custom: shirt",
      contextFlags: ["unconfirmed"],
    });

    expect(getPickupAppointmentSummary(appointment)).toBe("jeans, pants, shirt");
    expect(getPickupAppointmentConfirmationState(appointment)).toEqual({
      tone: "warn",
      label: "Unconfirmed",
    });
    expect(getPickupTimingLabel("2026-03-22", new Date(2026, 2, 22, 9, 0, 0, 0))).toBe("Today");
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
    expect(getOrderQueueCounts([dueToday, dueTomorrow, ready], { now })).toEqual({
      all: 3,
      due_today: 1,
      due_tomorrow: 1,
      ready_for_pickup: 1,
      overdue: 0,
      in_house: 3,
      factory: 0,
    });

    expect(
      filterOpenOrders(
        [dueToday, dueTomorrow, ready],
        {
          query: "",
          queue: "due_today",
          typeFilter: "all",
          locationFilter: "all",
          assigneeFilter: "all",
        },
        { now },
      ).map((order) => order.id),
    ).toEqual([1001]);

    expect(getNeedsAttentionOpenOrders([dueToday, dueTomorrow, ready]).map((order) => order.id)).toEqual([1001, 1002]);
  });

  it("sorts open orders from earliest to latest ready time", () => {
    const laterOrder = createOpenOrder({
      id: 1011,
      pickupSchedules: [
        {
          ...createOpenOrder({}).pickupSchedules[0],
          id: "pickup-later",
          pickupDate: "2026-03-24",
          pickupTime: "16:00",
        },
      ],
    });
    const earlierOrder = createOpenOrder({
      id: 1012,
      pickupSchedules: [
        {
          ...createOpenOrder({}).pickupSchedules[0],
          id: "pickup-earlier",
          pickupDate: "2026-03-21",
          pickupTime: "09:00",
        },
      ],
    });

    expect(sortOpenOrdersChronologically([laterOrder, earlierOrder]).map((order) => order.id)).toEqual([1012, 1011]);
    expect(filterOpenOrders([laterOrder, earlierOrder], {
      query: "",
      queue: "all",
      typeFilter: "all",
      locationFilter: "all",
      assigneeFilter: "all",
    }).map((order) => order.id)).toEqual([1012, 1011]);
  });

  it("treats mixed orders with one ready pickup as partially ready", () => {
    const mixedOrder = createOpenOrder({
      id: 1010,
      orderType: "mixed",
      operationalStatus: "partially_ready",
      pickupSchedules: [
        {
          ...createOpenOrder({}).pickupSchedules[0],
          id: "pickup-alteration",
          scope: "alteration",
          label: "Alteration pickup",
          itemSummary: ["Trouser hem"],
          readyForPickup: true,
        },
        {
          ...createOpenOrder({}).pickupSchedules[0],
          id: "pickup-custom",
          scope: "custom",
          label: "Custom pickup",
          itemSummary: ["Dinner jacket"],
          pickupDate: "2026-05-22",
          pickupTime: "12:00",
          readyForPickup: false,
        },
      ],
    });

    expect(getOpenOrderOperationalPhase(mixedOrder)).toBe("Partially ready");
    expect(getOpenOrderReadinessDetails(mixedOrder)).toEqual(["Alterations ready", "Custom in progress"]);
    expect(getOpenOrderStatusPills(mixedOrder)).toEqual([
      { label: "Alterations ready", tone: "success" },
      { label: "Custom in progress", tone: "default" },
    ]);
    expect(getNeedsAttentionOpenOrders([mixedOrder]).map((order) => order.id)).toEqual([1010]);
  });

  it("sorts mixed orders by the earliest pickup across alteration and custom schedules", () => {
    const mixedLaterEarliest = createOpenOrder({
      id: 1013,
      orderType: "mixed",
      pickupSchedules: [
        {
          ...createOpenOrder({}).pickupSchedules[0],
          id: "pickup-1013-alteration",
          scope: "alteration",
          pickupDate: "2026-03-26",
          pickupTime: "15:00",
        },
        {
          ...createOpenOrder({}).pickupSchedules[0],
          id: "pickup-1013-custom",
          scope: "custom",
          label: "Custom pickup",
          itemSummary: ["Dinner jacket"],
          pickupDate: "2026-03-28",
          pickupTime: "11:00",
        },
      ],
    });
    const mixedEarlierEarliest = createOpenOrder({
      id: 1014,
      orderType: "mixed",
      pickupSchedules: [
        {
          ...createOpenOrder({}).pickupSchedules[0],
          id: "pickup-1014-alteration",
          scope: "alteration",
          pickupDate: "2026-03-27",
          pickupTime: "12:00",
        },
        {
          ...createOpenOrder({}).pickupSchedules[0],
          id: "pickup-1014-custom",
          scope: "custom",
          label: "Custom pickup",
          itemSummary: ["Dinner jacket"],
          pickupDate: "2026-03-25",
          pickupTime: "10:00",
        },
      ],
    });

    expect(getNeedsAttentionOpenOrders([mixedLaterEarliest, mixedEarlierEarliest]).map((order) => order.id)).toEqual([1014, 1013]);
  });

  it("filters open orders by in-house tailor assignment", () => {
    const luisOrder = createOpenOrder({
      id: 1004,
      inHouseAssignee: {
        id: "staff-tailor-luis",
        name: "Luis Rivera",
        primaryLocation: "Fifth Avenue",
      },
    });
    const unassignedOrder = createOpenOrder({
      id: 1005,
      inHouseAssignee: null,
    });

    expect(filterOpenOrders([luisOrder, unassignedOrder], {
      query: "",
      queue: "in_house",
      typeFilter: "all",
      locationFilter: "all",
      assigneeFilter: "staff-tailor-luis",
    })).toEqual([luisOrder]);

    expect(filterOpenOrders([luisOrder, unassignedOrder], {
      query: "",
      queue: "in_house",
      typeFilter: "all",
      locationFilter: "all",
      assigneeFilter: "unassigned",
    })).toEqual([unassignedOrder]);
  });

  it("groups in-house work into operator queue stages", () => {
    const needsAssignment = createOpenOrder({ id: 1006, inHouseAssignee: null, operationalStatus: "accepted" });
    const readyToStart = createOpenOrder({
      id: 1007,
      inHouseAssignee: { id: "staff-tailor-luis", name: "Luis Rivera", primaryLocation: "Fifth Avenue" },
      operationalStatus: "accepted",
    });
    const inProgress = createOpenOrder({
      id: 1008,
      inHouseAssignee: { id: "staff-tailor-luis", name: "Luis Rivera", primaryLocation: "Fifth Avenue" },
      operationalStatus: "in_progress",
    });
    const unassignedInProgress = createOpenOrder({
      id: 1010,
      inHouseAssignee: null,
      operationalStatus: "in_progress",
    });
    const ready = createOpenOrder({
      id: 1009,
      inHouseAssignee: { id: "staff-tailor-luis", name: "Luis Rivera", primaryLocation: "Fifth Avenue" },
      pickupSchedules: [
        {
          ...createOpenOrder({}).pickupSchedules[0],
          id: "pickup-ready",
          readyForPickup: true,
        },
      ],
    });

    expect(getOperatorQueueStage(needsAssignment)).toBe("needs_assignment");
    expect(getOperatorQueueStage(readyToStart)).toBe("ready_to_start");
    expect(getOperatorQueueStage(inProgress)).toBe("in_progress");
    expect(getOperatorQueueStage(unassignedInProgress)).toBe("needs_assignment");
    expect(getOperatorQueueStage(ready)).toBe("ready");

    expect(getOperatorQueueStageCounts([needsAssignment, readyToStart, inProgress, unassignedInProgress, ready])).toEqual({
      needs_assignment: 2,
      ready_to_start: 1,
      in_progress: 1,
      ready: 1,
    });
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
      operationalStatus: "accepted",
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
