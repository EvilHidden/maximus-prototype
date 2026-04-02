import { describe, expect, it } from "vitest";
import { adaptCustomers } from "./adapters";
import { createPrototypeDatabase } from "./runtime";
import {
  deserializeOrderWorkflowFromRecords,
  serializeOrderWorkflowToRecords,
} from "./orderWorkflowSerializer";
import { createEmptyMeasurements, createInitialOrderState } from "../state/orderState";
import type { OrderWorkflowState } from "../types";

function createAlterationSelection(overrides?: Partial<OrderWorkflowState["alteration"]["items"][number]["modifiers"][number]>) {
  return {
    id: "alteration_service_test_hem",
    name: "Hem",
    price: 35,
    supportsAdjustment: false,
    requiresAdjustment: false,
    deltaInches: null,
    ...overrides,
  };
}

function serializeOrder(order: OrderWorkflowState, orderSequence: number) {
  const database = createPrototypeDatabase(new Date("2026-03-22T12:00:00.000Z"));
  const serialized = serializeOrderWorkflowToRecords({
    order,
    customers: adaptCustomers(database),
    locations: database.locations,
    paymentMode: "none",
    orderSequence,
    now: new Date("2026-03-22T12:00:00.000Z"),
    staffMembers: database.staffMembers,
  });

  expect(serialized).toBeTruthy();

  const roundTripDatabase = {
    ...database,
    orders: [serialized!.orderRecord],
    orderScopes: [...serialized!.scopes],
    orderScopeLines: [...serialized!.scopeLines],
    orderScopeLineComponents: [...serialized!.lineComponents],
    pickupAppointments: [...serialized!.pickupAppointments],
    customerEvents: [...serialized!.customerEvents],
  };

  return {
    serialized: serialized!,
    restored: deserializeOrderWorkflowFromRecords(roundTripDatabase, serialized!.openOrderId),
  };
}

function createCustomOnlyOrder(monogram: { left: string; center: string; right: string }) {
  const order = createInitialOrderState();
  const measurements = {
    ...createEmptyMeasurements(),
    Chest: "40",
  };

  order.activeWorkflow = "custom";
  order.payerCustomerId = "C-1001";
  order.custom.items = [{
    id: 1,
    gender: "male",
    wearerCustomerId: "C-1001",
    isRush: false,
    selectedGarment: "Dinner jacket",
    linkedMeasurementSetId: "SET-C-1001-V1",
    measurements,
    fabricSku: "FAB-MID-001",
    buttonsSku: "BTN-HORN-001",
    liningSku: "LIN-BEMB-001",
    threadsSku: "THR-TONAL-001",
    monogramLeft: monogram.left,
    monogramCenter: monogram.center,
    monogramRight: monogram.right,
    pocketType: "Flap",
    lapel: "Peak",
    canvas: "Full",
    referencePhotoIds: ["photo-custom-1"],
    wearerName: "Jordan Patel",
    linkedMeasurementLabel: "Version 1",
    measurementSnapshot: measurements,
  }];

  return order;
}

describe("order workflow serializer", () => {
  it.each([
    [{ left: "JP", center: "", right: "" }],
    [{ left: "", center: "JP", right: "" }],
    [{ left: "", center: "", right: "JP" }],
    [{ left: "L", center: "C", right: "R" }],
  ])("round-trips sparse monogram positions by label %#", (monogram) => {
    const { restored } = serializeOrder(createCustomOnlyOrder(monogram), 9600);

    expect(restored?.custom.items[0]).toMatchObject({
      monogramLeft: monogram.left,
      monogramCenter: monogram.center,
      monogramRight: monogram.right,
      fabricSku: "FAB-MID-001",
      buttonsSku: "BTN-HORN-001",
      liningSku: "LIN-BEMB-001",
      threadsSku: "THR-TONAL-001",
      referencePhotoIds: ["photo-custom-1"],
    });
  });

  it("creates stable unique editable ids for mixed-order alteration and custom lines", () => {
    const order = createInitialOrderState();
    const measurements = {
      ...createEmptyMeasurements(),
      Chest: "41",
    };

    order.activeWorkflow = "custom";
    order.payerCustomerId = "C-1001";
    order.alteration.items = [{
      id: 1,
      garment: "Trousers",
      modifiers: [createAlterationSelection()],
      subtotal: 35,
      isRush: false,
      photoIds: ["photo-alt-1"],
    }];
    order.custom.items = [{
      id: 1,
      gender: "male",
      wearerCustomerId: "C-1001",
      isRush: false,
      selectedGarment: "Dinner jacket",
      linkedMeasurementSetId: "SET-C-1001-V1",
      measurements,
      fabricSku: "FAB-MID-001",
      buttonsSku: "BTN-HORN-001",
      liningSku: "LIN-BEMB-001",
      threadsSku: "THR-TONAL-001",
      monogramLeft: "",
      monogramCenter: "",
      monogramRight: "",
      pocketType: "Flap",
      lapel: "Peak",
      canvas: "Full",
      referencePhotoIds: [],
      wearerName: "Jordan Patel",
      linkedMeasurementLabel: "Version 1",
      measurementSnapshot: measurements,
    }];
    order.fulfillment.alteration = {
      pickupDate: "2026-03-28",
      pickupTime: "13:30",
      pickupLocation: "Queens",
    };

    const { serialized, restored } = serializeOrder(order, 9601);
    const alterationLineId = serialized.scopeLines.find((line) => line.scopeId.endsWith("-alteration"))?.id;
    const customLineId = serialized.scopeLines.find((line) => line.scopeId.endsWith("-custom"))?.id;

    expect(alterationLineId).toBe("order-9601-alteration-line-1");
    expect(customLineId).toBe("order-9601-custom-line-1");
    expect(restored?.alteration.items[0]?.id).toBe(9601001);
    expect(restored?.custom.items[0]?.id).toBe(9601501);
    expect(restored?.alteration.items[0]?.id).not.toBe(restored?.custom.items[0]?.id);
  });

  it("round-trips alteration service adjustments through saved records", () => {
    const order = createInitialOrderState();
    order.activeWorkflow = "alteration";
    order.payerCustomerId = "C-1001";
    order.alteration.items = [{
      id: 7,
      garment: "Pants",
      modifiers: [
        createAlterationSelection({
          id: "alteration_service_pants_hem",
          name: "Hem",
          price: 30,
          supportsAdjustment: true,
          requiresAdjustment: true,
          deltaInches: -0.375,
        }),
      ],
      subtotal: 30,
      isRush: false,
      photoIds: ["photo-alt-2"],
    }];

    const { serialized, restored } = serializeOrder(order, 9602);

    expect(serialized.lineComponents.find((component) => component.kind === "alteration_service")).toMatchObject({
      value: "Hem",
      referenceId: "alteration_service_pants_hem",
      numericValue: -0.375,
    });
    expect(restored?.alteration.items[0]?.modifiers[0]).toMatchObject({
      id: "alteration_service_pants_hem",
      name: "Hem",
      supportsAdjustment: true,
      deltaInches: -0.375,
    });
    expect(restored?.alteration.items[0]?.photoIds).toEqual(["photo-alt-2"]);
  });
});
