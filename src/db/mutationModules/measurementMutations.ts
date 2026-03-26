import type { PrototypeDatabase } from "../schema";
import type { DeleteMeasurementSetPayload, SaveMeasurementSetPayload } from "./shared";
import {
  formatMeasurementDateLabel,
  syncCustomerMeasurementStatus,
} from "./shared";

function getExistingSetTitle(note: string) {
  const noteParts = note.split(" • ");
  if (noteParts.length > 1) {
    return noteParts.slice(1).join(" • ");
  }

  return note;
}

function getNextMeasurementVersion(database: PrototypeDatabase, customerId: string) {
  return (
    database.measurementSets
      .filter((set) => set.customerId === customerId)
      .reduce((maxVersion, set) => {
        const match = set.label.match(/^Version (\d+)$/);
        return match ? Math.max(maxVersion, Number.parseInt(match[1], 10)) : maxVersion;
      }, 0) + 1
  );
}

export function saveMeasurementSetRecord(
  database: PrototypeDatabase,
  payload: SaveMeasurementSetPayload,
  now = new Date(),
): { database: PrototypeDatabase; linkedMeasurementSetId: string } {
  const customer = database.customers.find((record) => record.id === payload.customerId);
  if (!customer) {
    return {
      database,
      linkedMeasurementSetId: payload.measurementSetId ?? "",
    };
  }

  const dateLabel = formatMeasurementDateLabel(now);
  const currentSet = database.measurementSets.find((set) => set.id === payload.measurementSetId) ?? null;
  const sameCustomerCurrentSet = currentSet?.customerId === customer.id ? currentSet : null;
  const currentTitle = sameCustomerCurrentSet ? getExistingSetTitle(sameCustomerCurrentSet.note) : "";
  const normalizedTitle = payload.title?.trim() || currentTitle || `${customer.name} measurements`;
  const shouldUpdateExisting =
    payload.mode === "update"
    && Boolean(sameCustomerCurrentSet)
    && !sameCustomerCurrentSet?.isDraft
    && sameCustomerCurrentSet?.label.startsWith("Version ");

  if (shouldUpdateExisting && sameCustomerCurrentSet) {
    const nextDatabase = {
      ...database,
      measurementSets: database.measurementSets.map((set) => {
        if (set.customerId !== customer.id) {
          return set;
        }

        if (set.id === sameCustomerCurrentSet.id) {
          return {
            ...set,
            takenAt: dateLabel,
            note: `${dateLabel} • ${normalizedTitle}`,
            values: { ...payload.measurements },
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

    return {
      linkedMeasurementSetId: sameCustomerCurrentSet.id,
      database: syncCustomerMeasurementStatus(nextDatabase, customer.id),
    };
  }

  const nextVersion = getNextMeasurementVersion(database, customer.id);
  const nextMeasurementSetId = `SET-${customer.id}-V${nextVersion}-${now.getTime()}`;
  const nextSet = {
    id: nextMeasurementSetId,
    customerId: customer.id,
    label: `Version ${nextVersion}`,
    takenAt: dateLabel,
    note: `${dateLabel} • ${normalizedTitle}`,
    values: { ...payload.measurements },
    isDraft: false,
    suggested: true,
  };

  const nextDatabase = {
    ...database,
    measurementSets: [
      ...database.measurementSets.map((set) => (
        set.customerId === customer.id
          ? {
              ...set,
              suggested: false,
            }
          : set
      )),
      nextSet,
    ],
  };

  return {
    linkedMeasurementSetId: nextMeasurementSetId,
    database: syncCustomerMeasurementStatus(nextDatabase, customer.id),
  };
}

export function deleteMeasurementSetRecord(
  database: PrototypeDatabase,
  payload: DeleteMeasurementSetPayload,
): { database: PrototypeDatabase; linkedMeasurementSetId: string | null } {
  const remainingSets = database.measurementSets.filter((set) => set.id !== payload.measurementSetId);
  const nextDatabase = {
    ...database,
    measurementSets: remainingSets,
  };

  return {
    linkedMeasurementSetId: payload.linkedMeasurementSetId === payload.measurementSetId ? null : payload.linkedMeasurementSetId,
    database: payload.customerId ? syncCustomerMeasurementStatus(nextDatabase, payload.customerId) : nextDatabase,
  };
}
