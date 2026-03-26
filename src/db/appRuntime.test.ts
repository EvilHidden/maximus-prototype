import { describe, expect, it } from "vitest";
import { adaptAppointments, adaptClosedOrderHistory, adaptCustomers, adaptOpenOrders } from "./adapters";
import { createAppRuntime } from "./appRuntime";

describe("app runtime", () => {
  it("builds stable runtime data from a fixed reference date", () => {
    const runtime = createAppRuntime(new Date("2026-03-22T12:00:00.000Z"));
    const customers = adaptCustomers(runtime.database);
    const appointments = adaptAppointments(runtime.database);
    const openOrders = adaptOpenOrders(runtime.database);
    const closedOrderHistory = adaptClosedOrderHistory(runtime.database);

    expect(customers.length).toBeGreaterThan(0);
    expect(appointments.length).toBeGreaterThan(0);
    expect(openOrders.length).toBeGreaterThan(0);
    expect(closedOrderHistory.length).toBeGreaterThan(0);

    const pickupAppointment = appointments.find((appointment) => appointment.kind === "pickup");
    expect(pickupAppointment).toBeTruthy();
    expect(pickupAppointment?.route).toBe("pickup");

    const openOrder = openOrders[0];
    expect(openOrder).toMatchObject({
      payerName: expect.any(String),
      orderType: expect.stringMatching(/alteration|custom|mixed/),
      pickupSchedules: expect.any(Array),
    });
    expect(openOrder.pickupSchedules[0]).toMatchObject({
      label: expect.stringMatching(/pickup/i),
      pickupLocation: expect.any(String),
    });

    const closedOrder = closedOrderHistory[0];
    expect(closedOrder).toMatchObject({
      payerName: expect.any(String),
      orderType: expect.stringMatching(/alteration|custom|mixed/),
      pickupSchedules: expect.any(Array),
      displayId: expect.any(String),
    });

    const maria = customers.find((customer) => customer.id === "C-1078");
    expect(maria?.measurementsStatus).toBe("on_file");

    const mariaMixedOrder = openOrders.find((order) => order.id === 8904);
    expect(mariaMixedOrder?.lineItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "alteration",
          garmentLabel: "Jacket",
          components: expect.arrayContaining([
            expect.objectContaining({ kind: "alteration_service", value: "Bicep" }),
            expect.objectContaining({ kind: "alteration_service", value: "Lining replacement" }),
          ]),
        }),
        expect.objectContaining({
          kind: "custom",
          components: expect.arrayContaining([
            expect.objectContaining({ kind: "measurement_set", value: "Version 1" }),
            expect.objectContaining({ kind: "fabric", value: "Ivory stretch wool" }),
          ]),
        }),
      ]),
    );
  });
});
