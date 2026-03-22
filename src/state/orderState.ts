import { createSeedReferenceData } from "../db/referenceData";
import type {
  CustomBuilderState,
  CustomGarmentDraft,
  OrderWorkflowState,
} from "../types";

const seedReferenceData = createSeedReferenceData();

export function createEmptyMeasurements() {
  return seedReferenceData.measurementFields.reduce<Record<string, string>>((accumulator, field) => {
    accumulator[field] = "";
    return accumulator;
  }, {});
}

export function createInitialCustomDraft(): CustomGarmentDraft {
  return {
    gender: null,
    wearerCustomerId: null,
    selectedGarment: null,
    linkedMeasurementSetId: null,
    measurements: createEmptyMeasurements(),
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
  };
}

function createInitialCustomState(): CustomBuilderState {
  return {
    draft: createInitialCustomDraft(),
    items: [],
  };
}

export function createInitialOrderState(): OrderWorkflowState {
  return {
    activeWorkflow: null,
    payerCustomerId: null,
    checkoutIntent: null,
    alteration: {
      selectedGarment: "",
      selectedModifiers: [],
      items: [],
    },
    custom: createInitialCustomState(),
    fulfillment: {
      alteration: {
        pickupDate: "",
        pickupTime: "",
        pickupLocation: "",
        eventType: "none",
        eventDate: "",
      },
      custom: {
        pickupDate: "",
        pickupTime: "",
        pickupLocation: "",
        eventType: "none",
        eventDate: "",
      },
    },
  };
}
