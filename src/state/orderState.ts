import { createMeasurementValueMap, createSeedMeasurementValueMap } from "../db/referenceData";
import type {
  CustomGarmentItem,
  CustomBuilderState,
  CustomGarmentDraft,
  OrderWorkflowState,
} from "../types";

export function createEmptyMeasurements(measurementFields?: string[]) {
  return measurementFields ? createMeasurementValueMap(measurementFields) : createSeedMeasurementValueMap();
}

export function syncMeasurementFieldsInCustomItem(item: CustomGarmentItem, measurementFields: string[]) {
  return {
    ...item,
    measurements: {
      ...createEmptyMeasurements(measurementFields),
      ...item.measurements,
    },
    measurementSnapshot: {
      ...createEmptyMeasurements(measurementFields),
      ...item.measurementSnapshot,
    },
  };
}

export function syncMeasurementFieldsInOrder(order: OrderWorkflowState, measurementFields: string[]) {
  return {
    ...order,
    custom: {
      ...order.custom,
      draft: {
        ...order.custom.draft,
        measurements: {
          ...createEmptyMeasurements(measurementFields),
          ...order.custom.draft.measurements,
        },
      },
      items: order.custom.items.map((item) => syncMeasurementFieldsInCustomItem(item, measurementFields)),
    },
  };
}

export function createInitialCustomDraft(measurementFields?: string[]): CustomGarmentDraft {
  return {
    gender: null,
    wearerCustomerId: null,
    isRush: false,
    selectedGarment: null,
    linkedMeasurementSetId: null,
    measurements: createEmptyMeasurements(measurementFields),
    fabricSku: null,
    buttonsSku: null,
    liningSku: null,
    threadsSku: null,
    monogramLeft: "",
    monogramCenter: "",
    monogramRight: "",
    pocketType: null,
    lapel: null,
    canvas: null,
    referencePhotoIds: [],
  };
}

function createInitialCustomState(measurementFields?: string[]): CustomBuilderState {
  return {
    draft: createInitialCustomDraft(measurementFields),
    items: [],
  };
}

export function createInitialOrderState(measurementFields?: string[]): OrderWorkflowState {
  return {
    activeWorkflow: null,
    payerCustomerId: null,
    alteration: {
      selectedGarment: "",
      selectedModifiers: [],
      selectedRush: false,
      items: [],
    },
    custom: createInitialCustomState(),
    fulfillment: {
      alteration: {
        pickupDate: "",
        pickupTime: "",
        pickupLocation: "",
      },
      custom: {
        eventType: "none",
        eventDate: "",
      },
    },
  };
}
