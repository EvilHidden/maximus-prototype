import { describe, expect, it } from "vitest";
import { createAppRuntime } from "./appRuntime";

describe("app runtime", () => {
  it("builds stable runtime data from a fixed reference date", () => {
    const runtime = createAppRuntime(new Date("2026-03-22T12:00:00.000Z"));

    expect(runtime.customers.length).toBeGreaterThan(0);
    expect(runtime.appointments.length).toBeGreaterThan(0);
    expect(runtime.openOrders.length).toBeGreaterThan(0);
    expect(runtime.closedOrderHistory.length).toBeGreaterThan(0);

    const pickupAppointment = runtime.appointments.find((appointment) => appointment.kind === "pickup");
    expect(pickupAppointment).toBeTruthy();
    expect(pickupAppointment?.route).toBe("pickup");

    const openOrder = runtime.openOrders[0];
    expect(openOrder).toMatchObject({
      payerName: expect.any(String),
      orderType: expect.stringMatching(/alteration|custom|mixed/),
      pickupSchedules: expect.any(Array),
    });
    expect(openOrder.pickupSchedules[0]).toMatchObject({
      label: expect.stringMatching(/pickup/i),
      pickupLocation: expect.any(String),
    });
  });
});
