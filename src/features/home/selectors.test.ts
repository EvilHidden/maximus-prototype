import { describe, expect, it } from "vitest";
import type { Appointment, OpenOrder } from "../../types";
import { getReadyPickupQueue, getTodayAppointments, getTomorrowAppointments } from "./selectors";

function createAppointment(overrides: Partial<Appointment>): Appointment {
  return {
    id: overrides.id ?? "appt-1",
    scheduledFor: overrides.scheduledFor ?? "2026-03-24T10:00:00.000Z",
    kind: overrides.kind ?? "appointment",
    source: overrides.source ?? "prototype",
    location: overrides.location ?? "Fifth Avenue",
    customerId: overrides.customerId,
    customer: overrides.customer ?? "Test Customer",
    orderId: overrides.orderId ?? null,
    scopeId: overrides.scopeId ?? null,
    scopeLineId: overrides.scopeLineId ?? null,
    durationMinutes: overrides.durationMinutes ?? 30,
    typeKey: overrides.typeKey ?? (overrides.kind === "pickup" ? "pickup" : "alteration_fitting"),
    type: overrides.type ?? (overrides.kind === "pickup" ? "Pickup" : "Alteration fitting"),
    statusKey: overrides.statusKey ?? "scheduled",
    pickupSummary: overrides.pickupSummary,
    status: overrides.status ?? "Scheduled",
    prepFlags: overrides.prepFlags ?? [],
    profileFlags: overrides.profileFlags ?? [],
    contextFlags: overrides.contextFlags ?? [],
    route: overrides.route ?? (overrides.kind === "pickup" ? "pickup" : "alteration"),
  };
}

describe("home selectors", () => {
  it("sorts today's appointments from earliest to latest", () => {
    const now = new Date("2026-03-24T09:00:00.000Z");
    const appointments = [
      createAppointment({ id: "late", scheduledFor: "2026-03-24T15:00:00.000Z" }),
      createAppointment({ id: "early", scheduledFor: "2026-03-24T10:00:00.000Z" }),
      createAppointment({ id: "middle", scheduledFor: "2026-03-24T12:30:00.000Z" }),
    ];

    expect(getTodayAppointments(appointments, now).map((appointment) => appointment.id)).toEqual(["early", "middle", "late"]);
  });

  it("sorts tomorrow's appointments from earliest to latest", () => {
    const now = new Date("2026-03-24T09:00:00.000Z");
    const appointments = [
      createAppointment({ id: "late", scheduledFor: "2026-03-25T16:00:00.000Z" }),
      createAppointment({ id: "early", scheduledFor: "2026-03-25T09:30:00.000Z" }),
      createAppointment({ id: "middle", scheduledFor: "2026-03-25T13:00:00.000Z" }),
    ];

    expect(getTomorrowAppointments(appointments, now).map((appointment) => appointment.id)).toEqual(["early", "middle", "late"]);
  });

  it("sorts ready pickups oldest ready first and excludes not-ready work", () => {
    const openOrders: OpenOrder[] = [
      {
        id: 9001,
        payerCustomerId: "C-1",
        payerName: "Later Ready",
        orderType: "alteration",
        operationalStatus: "ready_for_pickup",
        inHouseAssignee: null,
        itemCount: 1,
        lineItems: [],
        itemSummary: ["Alteration - Dress hem"],
        paymentStatus: "captured",
        paymentDueNow: 0,
        totalCollected: 120,
        collectedToday: 0,
        balanceDue: 0,
        total: 120,
        createdAt: "2026-03-20T10:00:00.000Z",
        pickupSchedules: [
          {
            id: "scope-late",
            scope: "alteration",
            label: "Alteration pickup",
            itemSummary: ["Dress hem"],
            itemCount: 1,
            pickupDate: "2026-03-25",
            pickupTime: "5:00 PM",
            pickupLocation: "Fifth Avenue",
            eventType: "none",
            eventDate: "",
            readyAt: "2026-03-24T14:00:00.000Z",
            readyForPickup: true,
          },
        ],
      },
      {
        id: 9002,
        payerCustomerId: "C-2",
        payerName: "Earlier Ready",
        orderType: "custom",
        operationalStatus: "ready_for_pickup",
        inHouseAssignee: null,
        itemCount: 1,
        lineItems: [],
        itemSummary: ["Custom garment - Dinner jacket"],
        paymentStatus: "ready_to_collect",
        paymentDueNow: 0,
        totalCollected: 0,
        collectedToday: 0,
        balanceDue: 240,
        total: 240,
        createdAt: "2026-03-18T10:00:00.000Z",
        pickupSchedules: [
          {
            id: "scope-early",
            scope: "custom",
            label: "Custom pickup",
            itemSummary: ["Dinner jacket"],
            itemCount: 1,
            pickupDate: "2026-03-24",
            pickupTime: "11:00 AM",
            pickupLocation: "Queens",
            eventType: "none",
            eventDate: "",
            readyAt: "2026-03-23T10:00:00.000Z",
            readyForPickup: true,
          },
          {
            id: "scope-not-ready",
            scope: "alteration",
            label: "Alteration pickup",
            itemSummary: ["Trouser hem"],
            itemCount: 1,
            pickupDate: "2026-03-26",
            pickupTime: "2:00 PM",
            pickupLocation: "Queens",
            eventType: "none",
            eventDate: "",
            readyAt: null,
            readyForPickup: false,
          },
        ],
      },
    ];

    expect(getReadyPickupQueue(openOrders).map((pickup) => pickup.key)).toEqual(["9002-scope-early", "9001-scope-late"]);
  });
});
