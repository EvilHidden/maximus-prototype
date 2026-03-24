import type { PrototypeDatabase } from "../schema";
import type { DeleteMeasurementSetPayload, SaveMeasurementSetPayload } from "./shared";
import {
  createEmptyMeasurementValuesFromDatabase,
  formatMeasurementDateLabel,
  syncCustomerMeasurementStatus,
} from "./shared";

export function createDraftMeasurementSetRecord(
  database: PrototypeDatabase,
  customerId: string | null,
  now = new Date(),
): { database: PrototypeDatabase; linkedMeasurementSetId: string; values: Record<string, string> } {
  const values = createEmptyMeasurementValuesFromDatabase(database);

  if (!customerId) {
    return {
      database,
      linkedMeasurementSetId: "",
      values,
    };
  }

  const customer = database.customers.find((record) => record.id === customerId);
  if (!customer) {
    return {
      database,
      linkedMeasurementSetId: "",
      values,
    };
  }

  const nextMeasurementSetId = `SET-${customer.id}-DRAFT-${now.getTime()}`;
  const dateLabel = formatMeasurementDateLabel(now);
  const draftSet = {
    id: nextMeasurementSetId,
    customerId: customer.id,
    label: "Draft",
    takenAt: dateLabel,
    note: `${dateLabel} • ${customer.name} draft`,
    values,
    isDraft: true,
    suggested: false,
  };

  return {
    linkedMeasurementSetId: nextMeasurementSetId,
    values,
    database: syncCustomerMeasurementStatus({
      ...database,
      measurementSets: [...database.measurementSets, draftSet],
    }, customer.id),
  };
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
  const normalizedTitle = payload.title.trim() || `${customer.name} ${payload.mode === "draft" ? "draft" : "measurements"}`;

  if (payload.mode === "draft" && sameCustomerCurrentSet?.isDraft) {
    const nextDatabase = {
      ...database,
      measurementSets: database.measurementSets.map((set) => (
        set.id === sameCustomerCurrentSet.id
          ? {
              ...set,
              takenAt: dateLabel,
              note: `${dateLabel} • ${normalizedTitle}`,
              values: { ...payload.measurements },
              isDraft: true,
              suggested: false,
            }
          : set
      )),
    };

    return {
      linkedMeasurementSetId: sameCustomerCurrentSet.id,
      database: syncCustomerMeasurementStatus(nextDatabase, customer.id),
    };
  }

  if (payload.mode === "saved" && sameCustomerCurrentSet && !sameCustomerCurrentSet.isDraft && sameCustomerCurrentSet.label.startsWith("Version ")) {
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

  if (payload.mode === "saved") {
    const nextVersion =
      database.measurementSets
        .filter((set) => set.customerId === customer.id)
        .reduce((maxVersion, set) => {
          const match = set.label.match(/^Version (\d+)$/);
          return match ? Math.max(maxVersion, Number.parseInt(match[1], 10)) : maxVersion;
        }, 0) + 1;

    if (sameCustomerCurrentSet?.isDraft) {
      const nextDatabase = {
        ...database,
        measurementSets: database.measurementSets.map((set) => {
          if (set.customerId !== customer.id) {
            return set;
          }

          if (set.id === sameCustomerCurrentSet.id) {
            return {
              ...set,
              label: `Version ${nextVersion}`,
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

  const nextMeasurementSetId = `SET-${customer.id}-DRAFT-${now.getTime()}`;
  const draftSet = {
    id: nextMeasurementSetId,
    customerId: customer.id,
    label: "Draft",
    takenAt: dateLabel,
    note: `${dateLabel} • ${normalizedTitle}`,
    values: { ...payload.measurements },
    isDraft: true,
    suggested: false,
  };

  return {
    linkedMeasurementSetId: nextMeasurementSetId,
    database: syncCustomerMeasurementStatus({
      ...database,
      measurementSets: [...database.measurementSets, draftSet],
    }, customer.id),
  };
}

export function deleteMeasurementSetRecord(
  database: PrototypeDatabase,
  payload: DeleteMeasurementSetPayload,
  now = new Date(),
): { database: PrototypeDatabase; linkedMeasurementSetId: string | null } {
  const remainingSets = database.measurementSets.filter((set) => set.id !== payload.measurementSetId);

  if (payload.linkedMeasurementSetId !== payload.measurementSetId) {
    const nextDatabase = {
      ...database,
      measurementSets: remainingSets,
    };

    return {
      linkedMeasurementSetId: payload.linkedMeasurementSetId,
      database: payload.customerId ? syncCustomerMeasurementStatus(nextDatabase, payload.customerId) : nextDatabase,
    };
  }

  const hasMeasurements = Object.values(payload.measurements).some((value) => value.trim().length > 0);
  const customer = payload.customerId ? database.customers.find((record) => record.id === payload.customerId) ?? null : null;
  if (!hasMeasurements || !customer) {
    const nextDatabase = {
      ...database,
      measurementSets: remainingSets,
    };

    return {
      linkedMeasurementSetId: null,
      database: payload.customerId ? syncCustomerMeasurementStatus(nextDatabase, payload.customerId) : nextDatabase,
    };
  }

  const nextMeasurementSetId = `SET-${customer.id}-DRAFT-${now.getTime()}`;
  const dateLabel = formatMeasurementDateLabel(now);
  const draftSet = {
    id: nextMeasurementSetId,
    customerId: customer.id,
    label: "Draft",
    takenAt: dateLabel,
    note: `${dateLabel} • ${customer.name} draft`,
    values: { ...payload.measurements },
    isDraft: true,
    suggested: false,
  };

  return {
    linkedMeasurementSetId: nextMeasurementSetId,
    database: syncCustomerMeasurementStatus({
      ...database,
      measurementSets: [...remainingSets, draftSet],
    }, customer.id),
  };
}
