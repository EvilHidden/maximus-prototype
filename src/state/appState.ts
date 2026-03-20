import { measurementFields } from "../data";
import type {
  AlterationService,
  OrderWorkflowState,
  PickupLocation,
  Screen,
  WorkflowMode,
} from "../types";

export type AppState = {
  screen: Screen;
  selectedCustomerId: string | null;
  order: OrderWorkflowState;
};

type SetAlterationItemPayload = {
  itemId: number;
  garment?: string;
  modifiers?: AlterationService[];
};

type SetPickupSchedulePayload = {
  pickupDate: string;
  pickupTime: string;
  pickupLocation: PickupLocation | "";
};

export type AppAction =
  | { type: "setScreen"; screen: Screen }
  | { type: "setCustomer"; customerId: string | null }
  | { type: "activateWorkflow"; workflow: WorkflowMode }
  | { type: "selectAlterationGarment"; garment: string }
  | { type: "toggleAlterationModifier"; modifier: AlterationService }
  | { type: "addAlterationItem" }
  | { type: "setAlterationItem"; payload: SetAlterationItemPayload }
  | { type: "removeAlterationItem"; itemId: number }
  | { type: "setPickupSchedule"; payload: SetPickupSchedulePayload }
  | { type: "selectCustomGarment"; garment: string | null }
  | { type: "setCustomConfiguration"; patch: Partial<OrderWorkflowState["custom"]> }
  | { type: "updateMeasurements"; field: string; value: string }
  | { type: "replaceMeasurements"; values: Record<string, string>; measurementSetId: string | null }
  | { type: "linkMeasurementSet"; measurementSetId: string | null }
  | { type: "clearOrder" };

function createEmptyMeasurements() {
  return measurementFields.reduce<Record<string, string>>((accumulator, field) => {
    accumulator[field] = "";
    return accumulator;
  }, {});
}

export function createInitialOrderState(): OrderWorkflowState {
  return {
    activeWorkflow: null,
    alteration: {
      selectedGarment: "",
      selectedModifiers: [],
      items: [],
    },
    custom: {
      selectedGarment: null,
      fabric: null,
      buttonType: null,
      lining: null,
      threads: null,
      monograms: "",
      pocketType: null,
      cuffs: null,
      lapels: null,
      customNotes: "",
      pricingBand: null,
      linkedMeasurementSetId: null,
      measurements: createEmptyMeasurements(),
    },
    fulfillment: {
      pickupDate: "",
      pickupTime: "",
      pickupLocation: "",
    },
  };
}

export function createInitialAppState(): AppState {
  return {
    screen: "home",
    selectedCustomerId: null,
    order: createInitialOrderState(),
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "setScreen":
      return { ...state, screen: action.screen };
    case "setCustomer":
      return {
        ...state,
        selectedCustomerId: action.customerId,
        order: {
          ...state.order,
          custom: {
            ...state.order.custom,
            linkedMeasurementSetId: null,
          },
        },
      };
    case "activateWorkflow":
      return {
        ...state,
        order: {
          ...state.order,
          activeWorkflow: action.workflow,
        },
      };
    case "selectAlterationGarment":
      return {
        ...state,
        order: {
          ...state.order,
          activeWorkflow: "alteration",
          alteration: {
            ...state.order.alteration,
            selectedGarment: action.garment,
            selectedModifiers: [],
          },
        },
      };
    case "toggleAlterationModifier": {
      const isSelected = state.order.alteration.selectedModifiers.some((modifier) => modifier.name === action.modifier.name);
      return {
        ...state,
        order: {
          ...state.order,
          alteration: {
            ...state.order.alteration,
            selectedModifiers: isSelected
              ? state.order.alteration.selectedModifiers.filter((modifier) => modifier.name !== action.modifier.name)
              : [...state.order.alteration.selectedModifiers, action.modifier],
          },
        },
      };
    }
    case "addAlterationItem": {
      if (!state.order.alteration.selectedGarment || state.order.alteration.selectedModifiers.length === 0) {
        return state;
      }

      const subtotal = state.order.alteration.selectedModifiers.reduce((sum, modifier) => sum + modifier.price, 0);
      return {
        ...state,
        order: {
          ...state.order,
          alteration: {
            ...state.order.alteration,
            items: [
              ...state.order.alteration.items,
              {
                id: Date.now(),
                garment: state.order.alteration.selectedGarment,
                modifiers: [...state.order.alteration.selectedModifiers],
                subtotal,
              },
            ],
            selectedModifiers: [],
          },
        },
      };
    }
    case "setAlterationItem":
      return {
        ...state,
        order: {
          ...state.order,
          alteration: {
            ...state.order.alteration,
            items: state.order.alteration.items.map((item) => {
              if (item.id !== action.payload.itemId) {
                return item;
              }

              const garment = action.payload.garment ?? item.garment;
              const modifiers = action.payload.modifiers ?? item.modifiers;
              return {
                ...item,
                garment,
                modifiers,
                subtotal: modifiers.reduce((sum, modifier) => sum + modifier.price, 0),
              };
            }),
          },
        },
      };
    case "removeAlterationItem":
      return {
        ...state,
        order: {
          ...state.order,
          alteration: {
            ...state.order.alteration,
            items: state.order.alteration.items.filter((item) => item.id !== action.itemId),
          },
        },
      };
    case "setPickupSchedule":
      return {
        ...state,
        order: {
          ...state.order,
          fulfillment: action.payload,
        },
      };
    case "selectCustomGarment":
      return {
        ...state,
        order: {
          ...state.order,
          activeWorkflow: "custom",
          custom: {
            ...state.order.custom,
            selectedGarment: action.garment,
            fabric: null,
            buttonType: null,
            lining: null,
            threads: null,
            monograms: "",
            pocketType: null,
            cuffs: null,
            lapels: null,
            customNotes: "",
            pricingBand: null,
          },
        },
      };
    case "setCustomConfiguration":
      return {
        ...state,
        order: {
          ...state.order,
          custom: {
            ...state.order.custom,
            ...action.patch,
          },
        },
      };
    case "updateMeasurements":
      return {
        ...state,
        order: {
          ...state.order,
          custom: {
            ...state.order.custom,
            measurements: {
              ...state.order.custom.measurements,
              [action.field]: action.value,
            },
          },
        },
      };
    case "replaceMeasurements":
      return {
        ...state,
        order: {
          ...state.order,
          custom: {
            ...state.order.custom,
            linkedMeasurementSetId: action.measurementSetId,
            measurements: {
              ...createEmptyMeasurements(),
              ...action.values,
            },
          },
        },
      };
    case "linkMeasurementSet":
      return {
        ...state,
        order: {
          ...state.order,
          custom: {
            ...state.order.custom,
            linkedMeasurementSetId: action.measurementSetId,
          },
        },
      };
    case "clearOrder":
      return {
        ...state,
        order: createInitialOrderState(),
      };
    default:
      return state;
  }
}
