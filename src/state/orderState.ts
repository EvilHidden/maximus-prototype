import { createSeedMeasurementValueMap } from "../db/referenceData";
import type {
  CustomBuilderState,
  CustomGarmentDraft,
  OrderWorkflowState,
} from "../types";

export function createEmptyMeasurements() {
  return createSeedMeasurementValueMap();
}

export function createInitialCustomDraft(): CustomGarmentDraft {
  return {
    gender: null,
    wearerCustomerId: null,
    isRush: false,
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
