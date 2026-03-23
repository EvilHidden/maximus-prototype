import { describe, expect, it } from "vitest";
import { adaptCustomers } from "../db/adapters";
import { createPrototypeDatabase } from "../db/runtime";
import type { Customer } from "../types";
import { appReducer, createInitialAppState } from "./appState";

const jordan: Customer = {
  id: "C-1001",
  name: "Jordan Patel",
  phone: "555-0101",
  email: "jordan@example.com",
  address: "1 Main St",
  preferredLocation: "Fifth Avenue",
  lastVisit: "Mar 22",
  measurementsStatus: "on_file",
  marketingOptIn: true,
  notes: "VIP fitting",
  isVip: true,
};

const sam: Customer = {
  id: "C-1002",
  name: "Sam Rivera",
  phone: "555-0102",
  email: "sam@example.com",
  address: "2 Main St",
  preferredLocation: "Queens",
  lastVisit: "Mar 20",
  measurementsStatus: "missing",
  marketingOptIn: false,
  notes: "",
};

describe("app state", () => {
  it("adds session customers and selects the new record", () => {
    const database = createPrototypeDatabase();
    database.customers = [
      {
        id: jordan.id,
        name: jordan.name,
        phone: jordan.phone,
        email: jordan.email,
        address: jordan.address,
        preferredLocationId: "loc_fifth_avenue",
        lastVisitLabel: jordan.lastVisit,
        measurementsStatus: jordan.measurementsStatus,
        marketingOptIn: jordan.marketingOptIn,
        notes: jordan.notes,
        isVip: jordan.isVip,
      },
    ];
    const state = createInitialAppState({ database });

    const next = appReducer(state, { type: "addCustomer", customer: sam });

    expect(adaptCustomers(next.database).map((customer) => customer.id)).toEqual(["C-1002", "C-1001"]);
    expect(next.selectedCustomerId).toBe("C-1002");
  });

  it("updates an existing session customer in place", () => {
    const database = createPrototypeDatabase();
    database.customers = [
      {
        id: jordan.id,
        name: jordan.name,
        phone: jordan.phone,
        email: jordan.email,
        address: jordan.address,
        preferredLocationId: "loc_fifth_avenue",
        lastVisitLabel: jordan.lastVisit,
        measurementsStatus: jordan.measurementsStatus,
        marketingOptIn: jordan.marketingOptIn,
        notes: jordan.notes,
        isVip: jordan.isVip,
      },
    ];
    const state = createInitialAppState({ database });

    const next = appReducer(state, {
      type: "updateCustomer",
      customer: {
        ...jordan,
        phone: "555-9999",
        preferredLocation: "Long Island",
      },
    });

    expect(adaptCustomers(next.database)[0]).toMatchObject({
      id: "C-1001",
      phone: "555-9999",
      preferredLocation: "Long Island",
    });
  });

  it("deletes a customer and clears active order references tied to that customer", () => {
    const database = createPrototypeDatabase();
    database.customers = [
      {
        id: jordan.id,
        name: jordan.name,
        phone: jordan.phone,
        email: jordan.email,
        address: jordan.address,
        preferredLocationId: "loc_fifth_avenue",
        lastVisitLabel: jordan.lastVisit,
        measurementsStatus: jordan.measurementsStatus,
        marketingOptIn: jordan.marketingOptIn,
        notes: jordan.notes,
        isVip: jordan.isVip,
      },
      {
        id: sam.id,
        name: sam.name,
        phone: sam.phone,
        email: sam.email,
        address: sam.address,
        preferredLocationId: "loc_queens",
        lastVisitLabel: sam.lastVisit,
        measurementsStatus: sam.measurementsStatus,
        marketingOptIn: sam.marketingOptIn,
        notes: sam.notes,
      },
    ];
    const state = createInitialAppState({ database });
    state.selectedCustomerId = "C-1002";
    state.order.payerCustomerId = "C-1002";
    state.order.custom.draft.wearerCustomerId = "C-1002";
    state.order.custom.draft.linkedMeasurementSetId = "SET-C-1002-V1";
    state.order.custom.draft.measurements = { Chest: "41" };
    state.order.custom.items = [
      {
        ...state.order.custom.draft,
        id: 7,
        selectedGarment: "Dinner jacket",
        wearerName: "Sam Rivera",
        linkedMeasurementLabel: "Version 1",
        measurementSnapshot: { Chest: "41" },
      },
    ];

    const next = appReducer(state, { type: "deleteCustomer", customerId: "C-1002" });

    expect(adaptCustomers(next.database).map((customer) => customer.id)).toEqual(["C-1001"]);
    expect(next.selectedCustomerId).toBeNull();
    expect(next.order.payerCustomerId).toBeNull();
    expect(next.order.custom.draft.wearerCustomerId).toBeNull();
    expect(next.order.custom.draft.linkedMeasurementSetId).toBeNull();
    expect(next.order.custom.draft.measurements).toMatchObject({ Chest: "41" });
    expect(next.order.custom.items[0]).toMatchObject({
      wearerCustomerId: null,
      linkedMeasurementSetId: null,
      wearerName: "Sam Rivera",
      linkedMeasurementLabel: "Version 1",
    });
  });
});
