import { describe, expect, it } from "vitest";
import type { Customer, MeasurementSet } from "../../types";
import {
  createDraftMeasurementSet,
  deleteMeasurementSetAndPreserveDraft,
  saveMeasurementSet,
} from "./service";

const customer: Customer = {
  id: "cus_1",
  name: "Jordan Patel",
  phone: "555-0101",
  email: "jordan@example.com",
  address: "1 Main St",
  preferredLocation: "Fifth Avenue",
  lastVisit: "Mar 1",
  measurementsStatus: "on_file",
  notes: "",
};

describe("measurement service", () => {
  it("creates deterministic draft measurement sets", () => {
    const now = new Date("2026-03-22T10:15:00.000Z");
    const result = createDraftMeasurementSet([], customer, now);

    expect(result.linkedMeasurementSetId).toBe("SET-cus_1-DRAFT-1774174500000");
    expect(result.measurementSets[0]).toMatchObject({
      label: "Draft",
      customerId: "cus_1",
      takenAt: "Mar 22",
      note: "Mar 22 • Jordan Patel draft",
      isDraft: true,
    });
  });

  it("promotes a linked draft into the next saved version", () => {
    const currentSets: MeasurementSet[] = [
      {
        id: "SET-cus_1-DRAFT-1",
        customerId: "cus_1",
        label: "Draft",
        note: "Draft",
        values: { Chest: "40" },
        isDraft: true,
        suggested: false,
      },
    ];

    const result = saveMeasurementSet(
      currentSets,
      customer,
      "SET-cus_1-DRAFT-1",
      { Chest: "41" },
      "saved",
      "Wedding fit",
      new Date("2026-03-22T11:00:00.000Z"),
    );

    expect(result.linkedMeasurementSetId).toBe("SET-cus_1-DRAFT-1");
    expect(result.measurementSets[0]).toMatchObject({
      label: "Version 1",
      note: "Mar 22 • Wedding fit",
      values: { Chest: "41" },
      isDraft: false,
      suggested: true,
    });
  });

  it("updates an existing saved version in place and clears older suggestions", () => {
    const currentSets: MeasurementSet[] = [
      {
        id: "SET-cus_1-V1",
        customerId: "cus_1",
        label: "Version 1",
        note: "Old",
        values: { Chest: "40" },
        isDraft: false,
        suggested: false,
      },
      {
        id: "SET-cus_1-V2",
        customerId: "cus_1",
        label: "Version 2",
        note: "Current",
        values: { Chest: "41" },
        isDraft: false,
        suggested: true,
      },
    ];

    const result = saveMeasurementSet(
      currentSets,
      customer,
      "SET-cus_1-V2",
      { Chest: "42" },
      "saved",
      "Updated set",
      new Date("2026-03-23T11:00:00.000Z"),
    );

    expect(result.measurementSets).toEqual([
      {
        ...currentSets[0],
        suggested: false,
      },
      {
        ...currentSets[1],
        takenAt: "Mar 23",
        note: "Mar 23 • Updated set",
        values: { Chest: "42" },
        isDraft: false,
        suggested: true,
      },
    ]);
  });

  it("preserves entered measurements as a new draft when deleting the linked set", () => {
    const result = deleteMeasurementSetAndPreserveDraft(
      [
        {
          id: "SET-cus_1-V2",
          customerId: "cus_1",
          label: "Version 2",
          note: "Current",
          values: { Chest: "41" },
          isDraft: false,
          suggested: true,
        },
      ],
      "SET-cus_1-V2",
      "SET-cus_1-V2",
      customer,
      { Chest: "43" },
      new Date("2026-03-24T12:00:00.000Z"),
    );

    expect(result.linkedMeasurementSetId).toBe("SET-cus_1-DRAFT-1774353600000");
    expect(result.measurementSets[0]).toMatchObject({
      label: "Draft",
      note: "Mar 24 • Jordan Patel draft",
      values: { Chest: "43" },
      isDraft: true,
    });
  });
});
