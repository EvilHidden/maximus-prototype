import { describe, expect, it } from "vitest";
import type { Appointment } from "../../types";
import {
  compareAppointments,
  getAppointmentDateKey,
  getAppointmentDateLabel,
  getAppointmentTimeLabel,
  getRelativeAppointmentDayLabel,
} from "./selectors";

const baseAppointment: Appointment = {
  id: "apt_1",
  scheduledFor: "2026-03-22T16:30:00.000Z",
  kind: "appointment",
  source: "prototype",
  location: "Fifth Avenue",
  customerId: "C-1001",
  customer: "Jordan Patel",
  durationMinutes: 60,
  typeKey: "custom_consult",
  type: "Custom consult",
  statusKey: "scheduled",
  status: "Upcoming",
  prepFlags: [],
  profileFlags: [],
  contextFlags: [],
  route: "custom",
};

describe("appointment selectors", () => {
  it("formats date and time labels from scheduled timestamps", () => {
    expect(getAppointmentDateKey(baseAppointment)).toBe("2026-03-22");
    expect(getAppointmentTimeLabel(baseAppointment)).toMatch(/12:30 PM|4:30 PM/);
    expect(getAppointmentDateLabel(baseAppointment)).toMatch(/Sun, Mar 22/);
  });

  it("returns relative day labels against a fixed clock", () => {
    expect(getRelativeAppointmentDayLabel(baseAppointment, new Date("2026-03-22T12:00:00.000Z"))).toBe("Today");
    expect(
      getRelativeAppointmentDayLabel(
        { ...baseAppointment, scheduledFor: "2026-03-23T16:30:00.000Z" },
        new Date("2026-03-22T12:00:00.000Z"),
      ),
    ).toBe("Tomorrow");
  });

  it("sorts appointments chronologically by scheduled timestamp", () => {
    const earlier = { ...baseAppointment, id: "apt_0", scheduledFor: "2026-03-22T13:00:00.000Z" };

    expect([baseAppointment, earlier].sort(compareAppointments).map((appointment) => appointment.id)).toEqual(["apt_0", "apt_1"]);
  });
});
