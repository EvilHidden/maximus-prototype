import { describe, expect, it } from "vitest";
import { adaptOpenOrders } from "../db/adapters";
import { createPrototypeDatabase } from "../db/runtime";
import { createInitialAppState } from "./appState";
import { tryReduceOrderAction } from "./orderReducer";
import type { AppState } from "./types";

function createReducerState(): AppState {
  const state = createInitialAppState();
  state.order.alteration.selectedGarment = "Trousers";
  state.order.alteration.selectedModifiers = [{ name: "Hem", price: 20 }];
  state.order.custom.draft.gender = "male";
  state.order.custom.draft.wearerCustomerId = "cus_2";
  state.order.custom.draft.selectedGarment = "Dinner jacket";
  state.order.custom.draft.linkedMeasurementSetId = "SET-2-V1";
  state.order.custom.draft.fabric = "Midnight navy";
  state.order.custom.draft.buttons = "Horn";
  state.order.custom.draft.lining = "Bemberg";
  state.order.custom.draft.threads = "Tonal";
  state.order.custom.draft.lapel = "Peak";
  state.order.custom.draft.pocketType = "Flap";
  state.order.custom.draft.canvas = "Full";
  state.order.custom.draft.measurements = { Chest: "40" };

  return state;
}

describe("order reducer", () => {
  it("adds alteration items with deterministic ids", () => {
    const state = createReducerState();

    const next = tryReduceOrderAction(state, { type: "addAlterationItem" }, { idFactory: () => 101 });

    expect(next?.order.alteration.items).toEqual([
      {
        id: 101,
        garment: "Trousers",
        modifiers: [{ name: "Hem", price: 20 }],
        subtotal: 20,
      },
    ]);
  });

  it("adds custom items with deterministic ids and snapshots", () => {
    const state = createReducerState();

    const next = tryReduceOrderAction(
      state,
      {
        type: "addCustomItem",
        payload: {
          wearerName: "Sam Rivera",
          linkedMeasurementLabel: "Version 1",
        },
      },
      { idFactory: () => 202 },
    );

    expect(next?.order.custom.items[0]).toMatchObject({
      id: 202,
      selectedGarment: "Dinner jacket",
      wearerName: "Sam Rivera",
      linkedMeasurementLabel: "Version 1",
      measurementSnapshot: { Chest: "40" },
    });
  });

  it("saves a draft order into canonical database records", () => {
    const state = createInitialAppState();
    state.order.activeWorkflow = "alteration";
    state.order.payerCustomerId = "C-1042";
    state.order.alteration.selectedGarment = "Trousers";
    state.order.alteration.selectedModifiers = [{ name: "Hem", price: 35 }];
    state.order.alteration.items = [
      {
        id: 101,
        garment: "Trousers",
        modifiers: [{ name: "Hem", price: 35 }],
        subtotal: 35,
      },
    ];
    state.order.fulfillment.alteration = {
      pickupDate: "2026-03-24",
      pickupTime: "15:30",
      pickupLocation: "Queens",
      eventType: "none",
      eventDate: "",
    };

    const next = tryReduceOrderAction(
      state,
      { type: "saveOpenOrder", paymentStatus: "due_later", openCheckout: false },
      { now: new Date(2026, 2, 22, 9, 30, 0, 0), idFactory: () => 9501 },
    );

    expect(next?.database.orders[0]).toMatchObject({
      id: "order-9501",
      displayId: "ORD-9501",
      payerCustomerId: "C-1042",
      orderType: "alteration",
    });
    expect(next?.database.orderScopes.find((scope) => scope.orderId === "order-9501")).toMatchObject({
      id: "order-9501-alteration",
      orderId: "order-9501",
      workflow: "alteration",
    });
    expect(next?.database.orderScopeLines.find((line) => line.scopeId === "order-9501-alteration")).toMatchObject({
      scopeId: "order-9501-alteration",
      label: "Trousers Hem",
      garmentLabel: "Trousers",
      unitPrice: 35,
    });
    expect(next?.database.orderScopeLineComponents.find((component) => component.lineId === "order-9501-alteration-line-1")).toMatchObject({
      lineId: "order-9501-alteration-line-1",
      kind: "alteration_service",
      value: "Hem",
    });
    expect(next?.database.pickupAppointments.find((appointment) => appointment.orderId === "order-9501")).toMatchObject({
      orderId: "order-9501",
      scopeId: "order-9501-alteration",
      locationId: "loc_queens",
    });

    const openOrders = adaptOpenOrders(next!.database);
    expect(openOrders[0]).toMatchObject({
      id: 9501,
      paymentStatus: "due_later",
      balanceDue: 35,
      payerCustomerId: "C-1042",
    });
  });

  it("marks pickup ready using the injected clock when schedule values are empty", () => {
    const database = createPrototypeDatabase(new Date(2026, 2, 22, 10, 0, 0, 0));
    database.orders = [{
      id: "order-55",
      displayId: "ORD-55",
      payerCustomerId: "cus_1",
      payerName: "Jordan Patel",
      orderType: "alteration",
      createdAt: "2026-03-20T15:00:00",
      status: "open",
      holdUntilAllScopesReady: false,
    }];
    database.orderScopes = [{
      id: "pickup-1",
      orderId: "order-55",
      workflow: "alteration",
      phase: "in_progress",
      promisedReadyAt: null,
      readyAt: null,
      eventId: null,
      appointmentOptional: false,
    }];
    database.orderScopeLines = [{
      id: "line-1",
      scopeId: "pickup-1",
      label: "Trouser hem",
      garmentLabel: "Trousers",
      quantity: 1,
      unitPrice: 35,
      wearerCustomerId: null,
      wearerName: null,
      measurementSetId: null,
      measurementSetLabel: null,
      measurementSnapshot: null,
    }];
    database.orderScopeLineComponents = [{
      id: "line-1-service-1",
      lineId: "line-1",
      kind: "alteration_service",
      label: "Service",
      value: "Hem",
      sortOrder: 1,
    }];
    const state = createInitialAppState({ database });

    const next = tryReduceOrderAction(
      state,
      { type: "markOpenOrderPickupReady", openOrderId: 55, pickupId: "pickup-1" },
      { now: new Date(2026, 2, 22, 10, 45, 0, 0) },
    );

    const openOrders = adaptOpenOrders(next!.database);
    expect(openOrders[0].pickupSchedules[0]).toMatchObject({
      readyForPickup: true,
      pickupDate: "2026-03-22",
      pickupTime: "10:45 AM",
    });
  });
});
