import type { Customer, MeasurementSet } from "../../types";

export type MeasurementSetDisplay = {
  id: string;
  title: string;
  version: string;
  status: string | null;
  subline: string | null;
  isDraft: boolean;
};

export type MeasurementStatusModel = {
  title: string;
  detail: string;
};

export type CustomMeasurementsCardModel =
  | { kind: "no_wearer" }
  | { kind: "linked"; customer: Customer; set: MeasurementSetDisplay }
  | { kind: "empty"; customer: Customer; hasHistory: boolean };

export type MeasurementSaveResult = {
  measurementSets: MeasurementSet[];
  linkedMeasurementSetId: string;
};
