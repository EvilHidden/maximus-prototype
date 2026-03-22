import { createSeedReferenceData } from "../../db/referenceData";
import type { Customer, MeasurementSet } from "../../types";
import type { MeasurementSaveResult } from "./types";

const seedReferenceData = createSeedReferenceData();

export function createEmptyMeasurementValues() {
  return seedReferenceData.measurementFields.reduce<Record<string, string>>((accumulator, field) => {
    accumulator[field] = "";
    return accumulator;
  }, {});
}

export function parseMeasurementValue(value: string) {
  if (!value) {
    return { inches: 0, fraction: 0 };
  }

  const numericValue = Number.parseFloat(value);
  if (Number.isNaN(numericValue)) {
    return { inches: 0, fraction: 0 };
  }

  const inches = Math.floor(numericValue);
  const roundedFraction = Math.round((numericValue - inches) * 4) / 4;
  return {
    inches,
    fraction: roundedFraction >= 1 ? 0 : roundedFraction,
  };
}

export function formatMeasurementValue(inches: number, fraction: number) {
  const total = inches + fraction;
  return Number.isInteger(total) ? String(total) : total.toFixed(2).replace(/0$/, "");
}

function formatDateLabel(now: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(now);
}

export function createDraftMeasurementSet(
  currentSets: MeasurementSet[],
  customer: Customer | null,
  now = new Date(),
): MeasurementSaveResult & { values: Record<string, string> } {
  const values = createEmptyMeasurementValues();

  if (!customer) {
    return {
      measurementSets: currentSets,
      linkedMeasurementSetId: "",
      values,
    };
  }

  const nextMeasurementSetId = `SET-${customer.id}-DRAFT-${now.getTime()}`;
  const draftSet: MeasurementSet = {
    id: nextMeasurementSetId,
    customerId: customer.id,
    label: "Draft",
    takenAt: formatDateLabel(now),
    note: `${formatDateLabel(now)} • ${customer.name} draft`,
    values,
    isDraft: true,
    suggested: false,
  };

  return {
    measurementSets: [...currentSets, draftSet],
    linkedMeasurementSetId: nextMeasurementSetId,
    values,
  };
}

export function saveMeasurementSet(
  currentSets: MeasurementSet[],
  customer: Customer,
  measurementSetId: string | null,
  measurements: Record<string, string>,
  mode: "draft" | "saved",
  title: string,
  now = new Date(),
): MeasurementSaveResult {
  const dateLabel = formatDateLabel(now);
  const currentSet = currentSets.find((set) => set.id === measurementSetId) ?? null;
  const sameCustomerCurrentSet = currentSet?.customerId === customer.id ? currentSet : null;
  const normalizedTitle = title.trim() || `${customer.name} ${mode === "draft" ? "draft" : "measurements"}`;

  if (mode === "draft" && sameCustomerCurrentSet?.isDraft) {
    return {
      linkedMeasurementSetId: sameCustomerCurrentSet.id,
      measurementSets: currentSets.map((set) =>
        set.id === sameCustomerCurrentSet.id
          ? {
              ...set,
              takenAt: dateLabel,
              note: `${dateLabel} • ${normalizedTitle}`,
              values: { ...measurements },
              isDraft: true,
              suggested: false,
            }
          : set,
      ),
    };
  }

  if (mode === "saved" && sameCustomerCurrentSet && !sameCustomerCurrentSet.isDraft && sameCustomerCurrentSet.label.startsWith("Version ")) {
    return {
      linkedMeasurementSetId: sameCustomerCurrentSet.id,
      measurementSets: currentSets.map((set) => {
        if (set.customerId !== customer.id) {
          return set;
        }

        if (set.id === sameCustomerCurrentSet.id) {
          return {
            ...set,
            takenAt: dateLabel,
            note: `${dateLabel} • ${normalizedTitle}`,
            values: { ...measurements },
            isDraft: false,
            suggested: true,
          };
        }

        return {
          ...set,
          suggested: false,
        };
      }),
    };
  }

  if (mode === "saved") {
    const nextVersion =
      currentSets
        .filter((set) => set.customerId === customer.id)
        .reduce((maxVersion, set) => {
          const match = set.label.match(/^Version (\d+)$/);
          return match ? Math.max(maxVersion, Number.parseInt(match[1], 10)) : maxVersion;
        }, 0) + 1;

    if (sameCustomerCurrentSet?.isDraft) {
      return {
        linkedMeasurementSetId: sameCustomerCurrentSet.id,
        measurementSets: currentSets.map((set) => {
          if (set.customerId !== customer.id) {
            return set;
          }

          if (set.id === sameCustomerCurrentSet.id) {
            return {
              ...set,
              label: `Version ${nextVersion}`,
              takenAt: dateLabel,
              note: `${dateLabel} • ${normalizedTitle}`,
              values: { ...measurements },
              isDraft: false,
              suggested: true,
            };
          }

          return {
            ...set,
            suggested: false,
          };
        }),
      };
    }

    const nextMeasurementSetId = `SET-${customer.id}-V${nextVersion}-${now.getTime()}`;
    const nextSet: MeasurementSet = {
      id: nextMeasurementSetId,
      customerId: customer.id,
      label: `Version ${nextVersion}`,
      takenAt: dateLabel,
      note: `${dateLabel} • ${normalizedTitle}`,
      values: { ...measurements },
      isDraft: false,
      suggested: true,
    };

    return {
      linkedMeasurementSetId: nextMeasurementSetId,
      measurementSets: [
        ...currentSets.map((set) =>
          set.customerId === customer.id
            ? {
                ...set,
                suggested: false,
              }
            : set,
        ),
        nextSet,
      ],
    };
  }

  const nextMeasurementSetId = `SET-${customer.id}-DRAFT-${now.getTime()}`;
  const draftSet: MeasurementSet = {
    id: nextMeasurementSetId,
    customerId: customer.id,
    label: "Draft",
    takenAt: dateLabel,
    note: `${dateLabel} • ${normalizedTitle}`,
    values: { ...measurements },
    isDraft: true,
    suggested: false,
  };

  return {
    linkedMeasurementSetId: nextMeasurementSetId,
    measurementSets: [...currentSets, draftSet],
  };
}

export function deleteMeasurementSet(currentSets: MeasurementSet[], measurementSetId: string) {
  return currentSets.filter((set) => set.id !== measurementSetId);
}

export function deleteMeasurementSetAndPreserveDraft(
  currentSets: MeasurementSet[],
  measurementSetId: string,
  linkedMeasurementSetId: string | null,
  customer: Customer | null,
  measurements: Record<string, string>,
  now = new Date(),
): MeasurementSaveResult {
  const remainingSets = currentSets.filter((set) => set.id !== measurementSetId);

  if (linkedMeasurementSetId !== measurementSetId) {
    return {
      measurementSets: remainingSets,
      linkedMeasurementSetId,
    };
  }

  const hasMeasurements = Object.values(measurements).some((value) => value.trim().length > 0);
  if (!hasMeasurements || !customer) {
    return {
      measurementSets: remainingSets,
      linkedMeasurementSetId: null,
    };
  }

  const nextMeasurementSetId = `SET-${customer.id}-DRAFT-${now.getTime()}`;
  const draftSet: MeasurementSet = {
    id: nextMeasurementSetId,
    customerId: customer.id,
    label: "Draft",
    takenAt: formatDateLabel(now),
    note: `${formatDateLabel(now)} • ${customer.name} draft`,
    values: { ...measurements },
    isDraft: true,
    suggested: false,
  };

  return {
    measurementSets: [...remainingSets, draftSet],
    linkedMeasurementSetId: nextMeasurementSetId,
  };
}
