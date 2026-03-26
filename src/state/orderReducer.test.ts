import { describe, expect, it } from "vitest";
import { adaptAppointments, adaptClosedOrderHistory, adaptOpenOrders } from "../db/adapters";
import { createPrototypeDatabase } from "../db/runtime";
import { appReducer, createInitialAppState } from "./appState";
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
      operationalStatus: "accepted",
    });
    expect(next?.database.orderScopes.find((scope) => scope.orderId === "order-9501")).toMatchObject({
      id: "order-9501-alteration",
      orderId: "order-9501",
      workflow: "alteration",
      assigneeStaffId: "staff-tailor-nina",
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
      operationalStatus: "accepted",
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
      operationalStatus: "in_progress",
      holdUntilAllScopesReady: false,
    }];
    database.orderScopes = [{
      id: "pickup-1",
      orderId: "order-55",
      workflow: "alteration",
      phase: "in_progress",
      assigneeStaffId: null,
      promisedReadyAt: null,
      readyAt: null,
      pickedUpAt: null,
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

  it("starts work on an accepted order without leaving checkout", () => {
    const state = createInitialAppState();
    state.order.activeWorkflow = "alteration";
    state.order.payerCustomerId = "C-1042";
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
    };

    const saved = tryReduceOrderAction(
      state,
      { type: "saveOpenOrder", paymentStatus: "due_later", openCheckout: true },
      { now: new Date(2026, 2, 22, 9, 30, 0, 0), idFactory: () => 9502 },
    )!;

    const next = tryReduceOrderAction(
      saved,
      { type: "startOpenOrderWork", openOrderId: 9502 },
      { now: new Date(2026, 2, 22, 9, 45, 0, 0) },
    );

    expect(next?.checkoutOpenOrderId).toBe(9502);
    expect(next?.checkoutJustSavedOpenOrderId).toBeNull();
    expect(next?.database.orders.find((order) => order.displayId === "ORD-9502")).toMatchObject({
      operationalStatus: "in_progress",
    });
    expect(adaptOpenOrders(next!.database).find((order) => order.id === 9502)).toMatchObject({
      operationalStatus: "in_progress",
    });
  });

  it("reassigns in-house tailoring work from the work queue", () => {
    const database = createPrototypeDatabase(new Date("2026-03-22T12:00:00.000Z"));
    const state = createInitialAppState({ database });

    const next = tryReduceOrderAction(
      state,
      { type: "assignOpenOrderTailor", openOrderId: 9005, staffId: "staff-tailor-luis" },
      { now: new Date("2026-03-22T16:15:00.000Z") },
    );

    expect(next?.database.orderScopes.find((scope) => scope.id === "scope-9005-alteration")).toMatchObject({
      assigneeStaffId: "staff-tailor-luis",
    });
    expect(adaptOpenOrders(next!.database).find((order) => order.id === 9005)).toMatchObject({
      inHouseAssignee: {
        id: "staff-tailor-luis",
        name: "Luis Rivera",
      },
    });
  });

  it("records checkout in one step and keeps the order anchored in checkout", () => {
    const database = createPrototypeDatabase(new Date("2026-03-22T12:00:00.000Z"));
    const state = appReducer(createInitialAppState({ database }), { type: "openCheckoutForOpenOrder", openOrderId: 9005 });

    const next = tryReduceOrderAction(
      state,
      { type: "completeOpenOrderCheckout", openOrderId: 9005 },
      { now: new Date("2026-03-22T16:05:00.000Z") },
    );

    expect(next?.checkoutOpenOrderId).toBe(9005);
    expect(next?.checkoutJustCompletedOpenOrderId).toBe(9005);
    expect(next?.database.payments.filter((payment) => payment.orderId === "order-9005")).toMatchObject([
      {
        status: "due_later",
        amount: 0,
      },
      {
        status: "captured",
        amount: 95,
      },
    ]);
    expect(adaptOpenOrders(next!.database).find((order) => order.id === 9005)).toMatchObject({
      balanceDue: 0,
      totalCollected: 95,
    });
  });

  it("checks out only the ready pickup balance for a mixed order", () => {
    const database = createPrototypeDatabase(new Date("2026-03-22T12:00:00.000Z"));
    const targetScope = database.orderScopes.find((scope) => scope.id === "scope-9003-alteration");
    expect(targetScope).toBeTruthy();
    targetScope!.phase = "ready";
    targetScope!.readyAt = "2026-03-22T15:30:00.000Z";
    database.payments = database.payments.filter((payment) => payment.orderId !== "order-9003");

    const state = appReducer(createInitialAppState({ database }), { type: "openCheckoutForOpenOrder", openOrderId: 9003 });
    const before = adaptOpenOrders(state.database).find((order) => order.id === 9003);
    expect(before?.pickupBalanceDue).toBe(120);
    expect(before?.balanceDue).toBeGreaterThan(120);

    const next = tryReduceOrderAction(
      state,
      { type: "completeOpenOrderCheckout", openOrderId: 9003 },
      { now: new Date("2026-03-22T16:10:00.000Z") },
    );

    expect(next?.checkoutJustCompletedOpenOrderId).toBe(9003);
    const after = adaptOpenOrders(next!.database).find((order) => order.id === 9003);
    expect(after).toMatchObject({
      totalCollected: 120,
      balanceDue: 2240,
      pickupBalanceDue: 0,
    });
  });

  it("completes a ready prepaid pickup and closes the order", () => {
    const database = createPrototypeDatabase(new Date("2026-03-22T12:00:00.000Z"));
    const targetOrder = database.orders.find((order) => order.displayId === "ORD-9017");
    expect(targetOrder).toBeTruthy();

    const state = createInitialAppState({ database });
    const next = tryReduceOrderAction(state, { type: "completeOpenOrderPickup", openOrderId: 9017 }, { now: new Date("2026-03-22T16:00:00.000Z") });

    expect(adaptOpenOrders(next!.database).some((order) => order.id === 9017)).toBe(false);
    expect(adaptClosedOrderHistory(next!.database).some((order) => order.id === "ORD-9017")).toBe(true);
  });

  it("cancels a pickup appointment and keeps it out of upcoming pickup work", () => {
    const database = createPrototypeDatabase(new Date("2026-03-22T12:00:00.000Z"));
    const pickupAppointment = database.pickupAppointments[0];
    const state = createInitialAppState({ database });

    const next = tryReduceOrderAction(
      state,
      { type: "cancelAppointment", appointmentId: pickupAppointment.id },
      { now: new Date("2026-03-22T16:00:00.000Z") },
    );

    const appointment = adaptAppointments(next!.database).find((entry) => entry.id === pickupAppointment.id);
    expect(appointment).toMatchObject({
      id: pickupAppointment.id,
      statusKey: "canceled",
      status: "Canceled",
    });
  });

  it("loads a saved order into the builder for editing and resaves it in place without resetting lifecycle state", () => {
    const database = createPrototypeDatabase(new Date("2026-03-22T12:00:00.000Z"));
    const orderRecord = database.orders.find((order) => order.displayId === "ORD-9003");
    const alterationScope = database.orderScopes.find((scope) => scope.id === "scope-9003-alteration");
    const customScope = database.orderScopes.find((scope) => scope.id === "scope-9003-custom");
    const pickupAppointment = database.pickupAppointments.find((appointment) => appointment.id === "pickup-1003");
    expect(orderRecord).toBeTruthy();
    expect(alterationScope).toBeTruthy();
    expect(customScope).toBeTruthy();
    expect(pickupAppointment).toBeTruthy();

    orderRecord!.status = "partially_picked_up";
    orderRecord!.operationalStatus = "in_progress";
    alterationScope!.phase = "picked_up";
    alterationScope!.readyAt = "2026-03-22T15:30:00.000Z";
    alterationScope!.pickedUpAt = "2026-03-22T17:15:00.000Z";
    alterationScope!.assigneeStaffId = "staff-tailor-luis";
    customScope!.phase = "ready";
    customScope!.readyAt = "2026-03-23T11:00:00.000Z";
    pickupAppointment!.statusKey = "completed";
    pickupAppointment!.confirmationStatus = "confirmed";

    const originalCreatedAt = orderRecord!.createdAt;
    let state = createInitialAppState({ database });

    state = appReducer(state, { type: "openOrderForEdit", openOrderId: 9003 });
    expect(state.editingOpenOrderId).toBe(9003);
    expect(state.order.alteration.items.length).toBeGreaterThan(0);
    expect(state.order.custom.items.length).toBeGreaterThan(0);
    expect(state.order.fulfillment.alteration).toMatchObject({
      pickupDate: "2026-03-27",
      pickupTime: "14:15",
      pickupLocation: "Long Island",
    });

    const customItemId = state.order.custom.items[0]?.id;
    expect(customItemId).toBeTruthy();

    state = tryReduceOrderAction(state, { type: "loadCustomItemForEdit", itemId: customItemId! })!;
    state = tryReduceOrderAction(state, { type: "setCustomConfiguration", patch: { fabric: "Ivory Barathea" } })!;
    state = tryReduceOrderAction(state, {
      type: "saveCustomItem",
      payload: {
        itemId: customItemId!,
        wearerName: state.order.custom.items[0]?.wearerName ?? null,
        linkedMeasurementLabel: state.order.custom.items[0]?.linkedMeasurementLabel ?? null,
      },
    })!;
    state = tryReduceOrderAction(
      state,
      { type: "saveOpenOrder", paymentStatus: "ready_to_collect", openCheckout: false },
      { now: new Date("2026-03-22T16:00:00.000Z") },
    )!;

    expect(state.database.orders.filter((order) => order.displayId === "ORD-9003")).toHaveLength(1);
    expect(state.database.orders.find((order) => order.displayId === "ORD-9003")).toMatchObject({
      createdAt: originalCreatedAt,
      status: "partially_picked_up",
      operationalStatus: "in_progress",
      holdUntilAllScopesReady: true,
    });

    const updatedAlterationScope = state.database.orderScopes.find((scope) => (
      scope.orderId === "order-9003" && scope.workflow === "alteration"
    ));
    expect(updatedAlterationScope).toMatchObject({
      phase: "picked_up",
      readyAt: "2026-03-22T15:30:00.000Z",
      pickedUpAt: "2026-03-22T17:15:00.000Z",
      assigneeStaffId: "staff-tailor-luis",
    });

    const updatedCustomScope = state.database.orderScopes.find((scope) => (
      scope.orderId === "order-9003" && scope.workflow === "custom"
    ));
    expect(updatedCustomScope).toMatchObject({
      phase: "ready",
      readyAt: "2026-03-23T11:00:00.000Z",
      pickedUpAt: null,
    });

    const updatedLine = state.database.orderScopeLines.find((line) => line.scopeId === "order-9003-custom" && line.garmentLabel === "Dinner jacket");
    expect(updatedLine).toBeTruthy();
    const updatedFabric = state.database.orderScopeLineComponents.find((component) => component.lineId === updatedLine!.id && component.kind === "fabric");
    expect(updatedFabric?.value).toBe("Ivory Barathea");

    expect(state.database.pickupAppointments.filter((appointment) => appointment.orderId === "order-9003")).toHaveLength(1);
    expect(state.database.pickupAppointments.find((appointment) => appointment.orderId === "order-9003")).toMatchObject({
      id: "pickup-1003",
      scopeId: null,
      statusKey: "completed",
      confirmationStatus: "confirmed",
      locationId: "loc_long_island",
    });
  });

  it("preserves canceled pickup appointments when an alteration order is edited", () => {
    const database = createPrototypeDatabase(new Date("2026-03-22T12:00:00.000Z"));
    const pickupAppointment = database.pickupAppointments.find((appointment) => appointment.id === "pickup-1009");
    expect(pickupAppointment).toBeTruthy();
    pickupAppointment!.statusKey = "canceled";
    pickupAppointment!.confirmationStatus = "unconfirmed";

    let state = createInitialAppState({ database });
    state = appReducer(state, { type: "openOrderForEdit", openOrderId: 9004 });
    state = tryReduceOrderAction(
      state,
      { type: "setAlterationItem", payload: { itemId: state.order.alteration.items[0]!.id, modifiers: [{ name: "Hem", price: 60 }] } },
    )!;
    state = tryReduceOrderAction(
      state,
      { type: "saveOpenOrder", paymentStatus: "due_later", openCheckout: false },
      { now: new Date("2026-03-22T16:00:00.000Z") },
    )!;

    expect(state.database.pickupAppointments.find((appointment) => appointment.orderId === "order-9004")).toMatchObject({
      id: "pickup-1009",
      statusKey: "canceled",
      confirmationStatus: "unconfirmed",
    });
  });

  it("cancels an open order and moves it into closed history", () => {
    const database = createPrototypeDatabase(new Date("2026-03-22T12:00:00.000Z"));
    const state = createInitialAppState({ database });

    const next = tryReduceOrderAction(
      state,
      { type: "cancelOpenOrder", openOrderId: 9003 },
      { now: new Date("2026-03-22T16:00:00.000Z") },
    );

    expect(adaptOpenOrders(next!.database).some((order) => order.id === 9003)).toBe(false);
    expect(adaptClosedOrderHistory(next!.database).find((order) => order.id === "ORD-9003")).toMatchObject({
      status: "Canceled",
    });
    expect(adaptAppointments(next!.database).filter((appointment) => appointment.orderId === "order-9003").every((appointment) => appointment.statusKey === "canceled")).toBe(true);
  });
});
