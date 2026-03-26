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

  it("archives a customer and clears active draft-order references tied to that customer", () => {
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

    const next = appReducer(state, { type: "archiveCustomer", customerId: "C-1002" });

    expect(adaptCustomers(next.database).map((customer) => customer.id)).toEqual(["C-1001", "C-1002"]);
    expect(adaptCustomers(next.database).find((customer) => customer.id === "C-1002")?.archived).toBe(true);
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

  it("starts a fresh order for a selected customer with the payer prefilled", () => {
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
    state.screen = "customer";
    state.order.activeWorkflow = "custom";
    state.order.custom.items = [
      {
        ...state.order.custom.draft,
        id: 1,
        selectedGarment: "Dinner jacket",
        wearerName: "Jordan Patel",
        linkedMeasurementLabel: "Current set",
        measurementSnapshot: { Chest: "41" },
      },
    ];

    const next = appReducer(state, { type: "startOrderForCustomer", customerId: "C-1001" });

    expect(next.screen).toBe("order");
    expect(next.selectedCustomerId).toBe("C-1001");
    expect(next.order.payerCustomerId).toBe("C-1001");
    expect(next.order.activeWorkflow).toBeNull();
    expect(next.order.custom.items).toEqual([]);
    expect(next.database.draftOrders[0]?.payerCustomerId).toBe("C-1001");
  });

  it("hydrates the current draft from canonical draft records when present", () => {
    const database = createPrototypeDatabase();
    database.draftOrders = [{
      id: "draft-current",
      payerCustomerId: "C-1001",
      updatedAt: "2026-03-22T12:00:00.000Z",
      snapshot: {
        activeWorkflow: "alteration",
        payerCustomerId: "C-1001",
        alteration: {
          selectedGarment: "Trousers",
          selectedModifiers: [{ name: "Hem", price: 20 }],
          items: [{
            id: 11,
            garment: "Trousers",
            modifiers: [{ name: "Hem", price: 20 }],
            subtotal: 20,
          }],
        },
        custom: {
          draft: {
            gender: null,
            wearerCustomerId: null,
            selectedGarment: null,
            linkedMeasurementSetId: null,
            measurements: { Chest: "" },
            fabric: null,
            buttons: null,
            lining: null,
            threads: null,
            monogramLeft: "",
            monogramCenter: "",
            monogramRight: "",
            pocketType: null,
            lapel: null,
            canvas: null,
          },
          items: [],
        },
        fulfillment: {
          alteration: {
            pickupDate: "2026-03-24",
            pickupTime: "15:00",
            pickupLocation: "Queens",
          },
          custom: {
            eventType: "none",
            eventDate: "",
          },
        },
      },
    }];

    const state = createInitialAppState({ database });

    expect(state.selectedCustomerId).toBe("C-1001");
    expect(state.order.alteration.items[0]).toMatchObject({
      garment: "Trousers",
      subtotal: 20,
    });
  });

  it("starts a new measurement workspace without creating a measurement record", () => {
    const database = createPrototypeDatabase();
    database.customers.push({
      id: "C-1999",
      name: "Taylor Brooks",
      phone: "555-0199",
      email: "taylor@example.com",
      address: "99 New St",
      preferredLocationId: "loc_fifth_avenue",
      lastVisitLabel: "New",
      measurementsStatus: "missing",
      marketingOptIn: true,
      notes: "",
      status: "active",
    });
    const state = createInitialAppState({ database });
    const targetCustomer = database.customers.find((customer) => customer.id === "C-1999")!;
    state.selectedCustomerId = targetCustomer.id;
    state.order.custom.draft.linkedMeasurementSetId = "SET-C1001-V1";
    state.order.custom.draft.measurements = { Chest: "38" };

    const next = appReducer(state, { type: "startNewMeasurementSet" });

    expect(next.order.custom.draft.linkedMeasurementSetId).toBeNull();
    expect(next.order.custom.draft.measurements.Chest).toBe("");
    expect(next.database.measurementSets).toHaveLength(database.measurementSets.length);
    expect(adaptCustomers(next.database).find((customer) => customer.id === targetCustomer.id)?.measurementsStatus).toBe("missing");
  });

  it("saves and deletes measurement sets through canonical db mutations", () => {
    const database = createPrototypeDatabase();
    database.customers.push({
      id: "C-1998",
      name: "Avery Stone",
      phone: "555-0198",
      email: "avery@example.com",
      address: "98 New St",
      preferredLocationId: "loc_queens",
      lastVisitLabel: "New",
      measurementsStatus: "missing",
      marketingOptIn: true,
      notes: "",
      status: "active",
    });
    const state = createInitialAppState({ database });
    const targetCustomer = database.customers.find((customer) => customer.id === "C-1998")!;
    state.selectedCustomerId = targetCustomer.id;
    state.order.custom.draft.measurements = { Chest: "41" };
    const saved = appReducer(state, {
      type: "saveMeasurementSet",
      payload: { mode: "update", title: "Wedding fit" },
    });

    const savedId = saved.order.custom.draft.linkedMeasurementSetId;
    expect(saved.database.measurementSets.find((set) => set.id === savedId)).toMatchObject({
      label: "Version 1",
      isDraft: false,
      suggested: true,
    });
    expect(adaptCustomers(saved.database).find((customer) => customer.id === targetCustomer.id)?.measurementsStatus).toBe("on_file");

    const deleted = appReducer(saved, {
      type: "deleteMeasurementSet",
      measurementSetId: savedId!,
    });

    expect(deleted.order.custom.draft.linkedMeasurementSetId).toBeNull();
    expect(deleted.order.custom.draft.measurements).toMatchObject({ Chest: "41" });
    expect(adaptCustomers(deleted.database).find((customer) => customer.id === targetCustomer.id)?.measurementsStatus).toBe("missing");
  });

  it("creates a manual service appointment for an active customer", () => {
    const database = createPrototypeDatabase();
    const state = createInitialAppState({ database });
    const targetCustomer = database.customers[0];

    const next = appReducer(state, {
      type: "createAppointment",
      payload: {
        customerId: targetCustomer.id,
        typeKey: "custom_consult",
        location: "Queens",
        scheduledFor: "2026-03-25T15:00",
      },
    });

    const created = next.database.serviceAppointments.find((appointment) => appointment.source === "manual");
    expect(created).toMatchObject({
      customerId: targetCustomer.id,
      typeKey: "custom_consult",
      locationId: "loc_queens",
      scheduledFor: "2026-03-25T15:00",
      source: "manual",
    });
  });

  it("reschedules an existing appointment in place", () => {
    const database = createPrototypeDatabase();
    const targetAppointment = database.serviceAppointments[0];
    const state = createInitialAppState({ database });

    const next = appReducer(state, {
      type: "rescheduleAppointment",
      payload: {
        appointmentId: targetAppointment.id,
        location: "Long Island",
        scheduledFor: "2026-03-29T11:30",
      },
    });

    expect(next.database.serviceAppointments.find((appointment) => appointment.id === targetAppointment.id)).toMatchObject({
      locationId: "loc_long_island",
      scheduledFor: "2026-03-29T11:30",
      statusKey: "scheduled",
    });
  });
});
