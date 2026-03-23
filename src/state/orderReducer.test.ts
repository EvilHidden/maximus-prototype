import { describe, expect, it } from "vitest";
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

  it("marks pickup ready using the injected clock when schedule values are empty", () => {
    const state = createInitialAppState({
      openOrders: [
        {
          id: 55,
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
              id: "pickup-1",
              scope: "alteration",
              label: "Alteration pickup",
              itemSummary: ["Trouser hem"],
              itemCount: 1,
              pickupDate: "",
              pickupTime: "",
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
        },
      ],
    });

    const next = tryReduceOrderAction(
      state,
      { type: "markOpenOrderPickupReady", openOrderId: 55, pickupId: "pickup-1" },
      { now: new Date(2026, 2, 22, 10, 45, 0, 0) },
    );

    expect(next?.openOrders[0].pickupSchedules[0]).toMatchObject({
      readyForPickup: true,
      pickupDate: "2026-03-22",
      pickupTime: "10:45",
    });
  });
});
