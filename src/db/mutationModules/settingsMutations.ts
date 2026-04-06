import type {
  DbAlterationServiceDefinition,
  DbCustomPricingBook,
  DbMeasurementFieldDefinition,
  PrototypeDatabase,
} from "../schema";

type UpdateOrganizationSettingsPatch = Partial<PrototypeDatabase["organizationSettings"]>;

type AddAlterationServiceInput = {
  category: string;
  name: string;
  price: number;
  supportsAdjustment: boolean;
  requiresAdjustment: boolean;
};

type UpdateAlterationServicePatch = Partial<Pick<
  DbAlterationServiceDefinition,
  "category" | "name" | "price" | "supportsAdjustment" | "requiresAdjustment" | "isActive"
>>;

type UpdateMeasurementFieldPatch = Partial<Pick<DbMeasurementFieldDefinition, "label" | "isActive">>;

type UpdateLocationPatch = {
  name?: string;
  isActive?: boolean;
};

type UpdateCustomPricingBookPatch = Partial<Pick<DbCustomPricingBook, "label" | "manufacturer" | "bookType" | "vestPrice" | "isActive">>;

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function createUniqueId(existingIds: string[], prefix: string, value: string) {
  const baseId = `${prefix}_${slugify(value) || "item"}`;
  if (!existingIds.includes(baseId)) {
    return baseId;
  }

  let suffix = 2;
  while (existingIds.includes(`${baseId}_${suffix}`)) {
    suffix += 1;
  }

  return `${baseId}_${suffix}`;
}

function addMeasurementKey(values: Record<string, string>, label: string) {
  if (label in values) {
    return values;
  }

  return {
    ...values,
    [label]: "",
  };
}

function renameMeasurementKey(values: Record<string, string>, previousLabel: string, nextLabel: string) {
  if (previousLabel === nextLabel || !(previousLabel in values)) {
    return values;
  }

  const nextValues: Record<string, string> = {};
  Object.entries(values).forEach(([key, value]) => {
    if (key === previousLabel) {
      nextValues[nextLabel] = value;
      return;
    }

    nextValues[key] = value;
  });

  if (!(nextLabel in nextValues)) {
    nextValues[nextLabel] = values[previousLabel] ?? "";
  }

  return nextValues;
}

function syncMeasurementLabelInOrder(
  order: PrototypeDatabase["draftOrders"][number]["snapshot"],
  previousLabel: string,
  nextLabel: string,
) {
  return {
    ...order,
    custom: {
      ...order.custom,
      draft: {
        ...order.custom.draft,
        measurements: renameMeasurementKey(order.custom.draft.measurements, previousLabel, nextLabel),
      },
      items: order.custom.items.map((item) => ({
        ...item,
        measurements: renameMeasurementKey(item.measurements, previousLabel, nextLabel),
        measurementSnapshot: renameMeasurementKey(item.measurementSnapshot, previousLabel, nextLabel),
      })),
    },
  };
}

function syncNewMeasurementLabelInOrder(
  order: PrototypeDatabase["draftOrders"][number]["snapshot"],
  label: string,
) {
  return {
    ...order,
    custom: {
      ...order.custom,
      draft: {
        ...order.custom.draft,
        measurements: addMeasurementKey(order.custom.draft.measurements, label),
      },
      items: order.custom.items.map((item) => ({
        ...item,
        measurements: addMeasurementKey(item.measurements, label),
        measurementSnapshot: addMeasurementKey(item.measurementSnapshot, label),
      })),
    },
  };
}

function normalizeMeasurementSortOrder(fields: DbMeasurementFieldDefinition[]) {
  return fields
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((field, index) => ({
      ...field,
      sortOrder: index,
    }));
}

function getNextDefaultLocationId(locations: PrototypeDatabase["locations"], currentDefaultLocationId: string) {
  const currentDefault = locations.find((location) => location.id === currentDefaultLocationId);
  if (currentDefault?.isActive) {
    return currentDefault.id;
  }

  return locations.find((location) => location.isActive)?.id ?? currentDefaultLocationId;
}

export function updateOrganizationSettings(database: PrototypeDatabase, patch: UpdateOrganizationSettingsPatch): PrototypeDatabase {
  return {
    ...database,
    organizationSettings: {
      ...database.organizationSettings,
      ...patch,
    },
  };
}

export function addLocationRecord(database: PrototypeDatabase, name: string): PrototypeDatabase {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return database;
  }

  const nextLocation = {
    id: createUniqueId(database.locations.map((location) => location.id), "loc", trimmedName),
    name: trimmedName,
    isActive: true,
  };

  return {
    ...database,
    locations: [...database.locations, nextLocation],
  };
}

export function updateLocationRecord(database: PrototypeDatabase, locationId: string, patch: UpdateLocationPatch): PrototypeDatabase {
  const locations = database.locations.map((location) => (
    location.id === locationId
      ? {
          ...location,
          ...patch,
          name: patch.name?.trim() || location.name,
        }
      : location
  ));

  return {
    ...database,
    locations,
    organizationSettings: {
      ...database.organizationSettings,
      defaultLocationId: getNextDefaultLocationId(locations, database.organizationSettings.defaultLocationId),
    },
  };
}

export function addMeasurementFieldDefinition(database: PrototypeDatabase, label: string): PrototypeDatabase {
  const trimmedLabel = label.trim();
  if (!trimmedLabel) {
    return database;
  }

  const nextField: DbMeasurementFieldDefinition = {
    id: createUniqueId(database.measurementFieldDefinitions.map((field) => field.id), "measurement_field", trimmedLabel),
    label: trimmedLabel,
    sortOrder: database.measurementFieldDefinitions.length,
    isActive: true,
  };

  return {
    ...database,
    measurementFieldDefinitions: [...database.measurementFieldDefinitions, nextField],
    measurementSets: database.measurementSets.map((set) => ({
      ...set,
      values: addMeasurementKey(set.values, trimmedLabel),
    })),
    orderScopeLines: database.orderScopeLines.map((line) => ({
      ...line,
      measurementSnapshot: line.measurementSnapshot ? addMeasurementKey(line.measurementSnapshot, trimmedLabel) : null,
    })),
    draftOrders: database.draftOrders.map((draftOrder) => ({
      ...draftOrder,
      snapshot: syncNewMeasurementLabelInOrder(draftOrder.snapshot, trimmedLabel),
    })),
  };
}

export function updateMeasurementFieldDefinition(
  database: PrototypeDatabase,
  fieldId: string,
  patch: UpdateMeasurementFieldPatch,
): PrototypeDatabase {
  const existingField = database.measurementFieldDefinitions.find((field) => field.id === fieldId);
  if (!existingField) {
    return database;
  }

  const nextLabel = patch.label?.trim() || existingField.label;
  const didRename = nextLabel !== existingField.label;
  const measurementFieldDefinitions = database.measurementFieldDefinitions.map((field) => (
    field.id === fieldId
      ? {
          ...field,
          ...patch,
          label: nextLabel,
        }
      : field
  ));

  return {
    ...database,
    measurementFieldDefinitions,
    measurementSets: didRename
      ? database.measurementSets.map((set) => ({
          ...set,
          values: renameMeasurementKey(set.values, existingField.label, nextLabel),
        }))
      : database.measurementSets,
    orderScopeLines: didRename
      ? database.orderScopeLines.map((line) => ({
          ...line,
          measurementSnapshot: line.measurementSnapshot
            ? renameMeasurementKey(line.measurementSnapshot, existingField.label, nextLabel)
            : null,
        }))
      : database.orderScopeLines,
    draftOrders: didRename
      ? database.draftOrders.map((draftOrder) => ({
          ...draftOrder,
          snapshot: syncMeasurementLabelInOrder(draftOrder.snapshot, existingField.label, nextLabel),
        }))
      : database.draftOrders,
  };
}

export function moveMeasurementFieldDefinition(
  database: PrototypeDatabase,
  fieldId: string,
  direction: "up" | "down",
): PrototypeDatabase {
  const sortedFields = database.measurementFieldDefinitions.slice().sort((left, right) => left.sortOrder - right.sortOrder);
  const currentIndex = sortedFields.findIndex((field) => field.id === fieldId);
  if (currentIndex < 0) {
    return database;
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= sortedFields.length) {
    return database;
  }

  const reorderedFields = sortedFields.slice();
  const [field] = reorderedFields.splice(currentIndex, 1);
  reorderedFields.splice(targetIndex, 0, field);

  return {
    ...database,
    measurementFieldDefinitions: normalizeMeasurementSortOrder(reorderedFields),
  };
}

export function addAlterationServiceDefinition(database: PrototypeDatabase, input: AddAlterationServiceInput): PrototypeDatabase {
  const category = input.category.trim();
  const name = input.name.trim();
  if (!category || !name) {
    return database;
  }

  const nextService: DbAlterationServiceDefinition = {
    id: createUniqueId(database.alterationServiceDefinitions.map((service) => service.id), "alteration_service", `${category}_${name}`),
    category,
    name,
    price: input.price,
    supportsAdjustment: input.supportsAdjustment,
    requiresAdjustment: input.requiresAdjustment,
    isActive: true,
  };

  return {
    ...database,
    alterationServiceDefinitions: [...database.alterationServiceDefinitions, nextService],
  };
}

export function updateAlterationServiceDefinition(
  database: PrototypeDatabase,
  serviceId: string,
  patch: UpdateAlterationServicePatch,
): PrototypeDatabase {
  return {
    ...database,
    alterationServiceDefinitions: database.alterationServiceDefinitions.map((service) => (
      service.id === serviceId
        ? {
            ...service,
            ...patch,
            category: patch.category?.trim() || service.category,
            name: patch.name?.trim() || service.name,
          }
        : service
    )),
  };
}

export function updateCustomPricingBook(
  database: PrototypeDatabase,
  bookKey: string,
  patch: UpdateCustomPricingBookPatch,
): PrototypeDatabase {
  return {
    ...database,
    customPricingBooks: database.customPricingBooks.map((book) => (
      book.key === bookKey
        ? {
            ...book,
            ...patch,
            label: patch.label?.trim() || book.label,
            manufacturer: patch.manufacturer?.trim() || book.manufacturer,
            bookType: patch.bookType?.trim() || book.bookType,
          }
        : book
    )),
  };
}

export function updateCustomPricingBookGarmentPrice(
  database: PrototypeDatabase,
  bookKey: string,
  garment: keyof DbCustomPricingBook["basePrices"],
  price: number,
): PrototypeDatabase {
  return {
    ...database,
    customPricingBooks: database.customPricingBooks.map((book) => (
      book.key === bookKey
        ? {
            ...book,
            basePrices: {
              ...book.basePrices,
              [garment]: price,
            },
          }
        : book
    )),
  };
}

export function updateCustomPricingBookCanvasSurcharge(
  database: PrototypeDatabase,
  bookKey: string,
  canvas: keyof DbCustomPricingBook["canvasSurcharges"],
  price: number,
): PrototypeDatabase {
  return {
    ...database,
    customPricingBooks: database.customPricingBooks.map((book) => (
      book.key === bookKey
        ? {
            ...book,
            canvasSurcharges: {
              ...book.canvasSurcharges,
              [canvas]: price,
            },
          }
        : book
    )),
  };
}
