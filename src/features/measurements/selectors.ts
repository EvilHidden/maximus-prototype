import type { Customer, MeasurementSet, MeasurementSetOption } from "../../types";
import type { CustomMeasurementsCardModel, MeasurementSetDisplay, MeasurementStatusModel } from "./types";

function compactVersionLabel(label: string) {
  return label.replace(/^Version\s+/i, "V");
}

export function getMeasurementSetDisplay(set: MeasurementSet): MeasurementSetDisplay {
  const noteParts = set.note.split(" • ");

  if (noteParts.length > 1) {
    const [date, ...rest] = noteParts;
    return {
      id: set.id,
      title: rest.join(" • "),
      version: compactVersionLabel(set.label),
      status: set.suggested ? "Latest on file" : null,
      subline: date,
    };
  }

  return {
    id: set.id,
    title: "Measurement set",
    version: compactVersionLabel(set.label),
    status: set.suggested ? set.note : null,
    subline: !set.suggested ? set.note : null,
  };
}

export function getLinkedMeasurementSet(measurementSets: MeasurementSet[], measurementSetId: string | null) {
  if (!measurementSetId) {
    return null;
  }

  return measurementSets.find((set) => set.id === measurementSetId) ?? null;
}

export function getSuggestedMeasurementSet(measurementSets: MeasurementSet[], customerId: string | null) {
  if (!customerId) {
    return null;
  }

  return measurementSets.find((set) => set.customerId === customerId && set.suggested) ?? null;
}

export function getMeasurementStatusModel(
  activeSet: MeasurementSet | null,
  hasEnteredMeasurements: boolean,
): MeasurementStatusModel {
  if (activeSet) {
    const display = getMeasurementSetDisplay(activeSet);
    return {
      title: display.title,
      detail: display.version,
    };
  }

  if (hasEnteredMeasurements) {
    return {
      title: "New measurement set",
      detail: "Unsaved draft",
    };
  }

  return {
    title: "No measurement set selected",
    detail: "Choose a saved set or start a new one.",
  };
}

export function getMeasurementOptions(
  measurementSets: MeasurementSet[],
  customer: Customer | null,
): MeasurementSetOption[] {
  if (!customer) {
    return [];
  }

  return measurementSets
    .filter((set) => set.customerId === customer.id)
    .map((set) => ({ ...set, kind: "history" as const }));
}

export function getMeasurementSetLabel(measurementSets: MeasurementSet[], measurementSetId: string | null) {
  const linkedSet = getLinkedMeasurementSet(measurementSets, measurementSetId);
  if (!linkedSet) {
    return null;
  }

  const display = getMeasurementSetDisplay(linkedSet);
  return {
    title: display.title,
    version: display.version,
    status: display.status,
    subline: display.subline,
  };
}

export function getCustomMeasurementsCardModel(
  customer: Customer | null,
  linkedSet: MeasurementSet | null,
  measurementSets: MeasurementSet[],
): CustomMeasurementsCardModel {
  if (!customer) {
    return { kind: "no_wearer" };
  }

  if (linkedSet) {
    return {
      kind: "linked",
      customer,
      set: getMeasurementSetDisplay(linkedSet),
    };
  }

  const hasHistory = measurementSets.some((set) => set.customerId === customer.id);
  return {
    kind: "empty",
    customer,
    hasHistory,
  };
}
