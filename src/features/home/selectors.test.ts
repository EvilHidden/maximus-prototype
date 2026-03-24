import { describe, expect, it } from "vitest";
import type { Appointment } from "../../types";
import { getPickupAppointments, getTodayAppointments, getTomorrowAppointments } from "./selectors";

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

  it("sorts pickups from earliest to latest", () => {
    const pickups = [
      createAppointment({ id: "late", kind: "pickup", scheduledFor: "2026-03-24T17:00:00.000Z" }),
      createAppointment({ id: "early", kind: "pickup", scheduledFor: "2026-03-24T11:00:00.000Z" }),
      createAppointment({ id: "middle", kind: "pickup", scheduledFor: "2026-03-25T09:00:00.000Z" }),
    ];

    expect(getPickupAppointments(pickups).map((appointment) => appointment.id)).toEqual(["early", "late", "middle"]);
  });
});
