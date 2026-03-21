import { measurementFields } from "../data";
import type {
  AlterationCheckoutIntent,
  AlterationService,
  CustomOrderEventType,
  CustomBuilderState,
  CustomGarmentDraft,
  CustomGarmentGender,
  OpenOrder,
  OrderWorkflowState,
  PickupLocation,
  Screen,
  WorkflowMode,
} from "../types";

export type AppState = {
  screen: Screen;
  selectedCustomerId: string | null;
  openOrders: OpenOrder[];
  order: OrderWorkflowState;
};

type SetAlterationItemPayload = {
  itemId: number;
  garment?: string;
  modifiers?: AlterationService[];
};

type SetPickupSchedulePayload = {
  scope: WorkflowMode;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: PickupLocation | "";
  eventType: CustomOrderEventType;
  eventDate: string;
};

type AddCustomItemPayload = {
  wearerName: string | null;
  linkedMeasurementLabel: string | null;
};

type SaveCustomItemPayload = AddCustomItemPayload & {
  itemId: number;
};

function createInitialCustomDraft(): CustomGarmentDraft {
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

export type AppAction =
  | { type: "setScreen"; screen: Screen }
  | { type: "setCustomer"; customerId: string | null }
  | { type: "setOrderPayer"; customerId: string | null }
  | { type: "activateWorkflow"; workflow: WorkflowMode }
  | { type: "setAlterationCheckoutIntent"; intent: AlterationCheckoutIntent }
  | { type: "completeOpenOrder"; openOrder: OpenOrder }
  | { type: "markOpenOrderPickupReady"; openOrderId: number; pickupId: string }
  | { type: "selectAlterationGarment"; garment: string }
  | { type: "toggleAlterationModifier"; modifier: AlterationService }
  | { type: "addAlterationItem" }
  | { type: "setAlterationItem"; payload: SetAlterationItemPayload }
  | { type: "removeAlterationItem"; itemId: number }
  | { type: "setPickupSchedule"; payload: SetPickupSchedulePayload }
  | { type: "selectCustomGender"; gender: CustomGarmentGender | null }
  | { type: "selectCustomWearer"; customerId: string | null }
  | { type: "selectCustomGarment"; garment: string | null }
  | { type: "setCustomConfiguration"; patch: Partial<OrderWorkflowState["custom"]["draft"]> }
  | { type: "addCustomItem"; payload: AddCustomItemPayload }
  | { type: "loadCustomItemForEdit"; itemId: number }
  | { type: "saveCustomItem"; payload: SaveCustomItemPayload }
  | { type: "resetCustomDraft" }
  | { type: "removeCustomItem"; itemId: number }
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

export function createInitialAppState(): AppState {
  return {
    screen: "home",
    selectedCustomerId: null,
    openOrders: [],
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
      };
    case "setOrderPayer":
      return {
        ...state,
        order: {
          ...state.order,
          payerCustomerId: action.customerId,
        },
      };
    case "activateWorkflow":
      return {
        ...state,
        order: {
          ...state.order,
          activeWorkflow: action.workflow,
          checkoutIntent: null,
          payerCustomerId: state.order.payerCustomerId ?? state.selectedCustomerId,
          custom:
            action.workflow === "custom" && !state.order.custom.draft.wearerCustomerId
              ? {
                  ...state.order.custom,
                  draft: {
                    ...state.order.custom.draft,
                    wearerCustomerId: state.order.payerCustomerId ?? state.selectedCustomerId,
                  },
                }
              : state.order.custom,
        },
      };
    case "setAlterationCheckoutIntent":
      return {
        ...state,
        order: {
          ...state.order,
          checkoutIntent: action.intent,
        },
      };
    case "completeOpenOrder":
      return {
        ...state,
        screen: "openOrders",
        openOrders: [action.openOrder, ...state.openOrders],
        order: createInitialOrderState(),
      };
    case "markOpenOrderPickupReady":
      return {
        ...state,
        openOrders: state.openOrders.map((openOrder) => (
          openOrder.id === action.openOrderId
            ? {
                ...openOrder,
                pickupSchedules: openOrder.pickupSchedules.map((pickup) => (
                  pickup.id === action.pickupId
                    ? {
                        ...pickup,
                        readyForPickup: true,
                        pickupDate: pickup.pickupDate || new Date().toISOString().slice(0, 10),
                        pickupTime: pickup.pickupTime || new Date().toTimeString().slice(0, 5),
                      }
                    : pickup
                )),
              }
            : openOrder
        )),
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
          fulfillment: {
            ...state.order.fulfillment,
            [action.payload.scope]: {
              pickupDate: action.payload.pickupDate,
              pickupTime: action.payload.pickupTime,
              pickupLocation: action.payload.pickupLocation,
              eventType: action.payload.eventType,
              eventDate: action.payload.eventDate,
            },
          },
        },
      };
    case "selectCustomGender":
      return {
        ...state,
        order: {
          ...state.order,
          activeWorkflow: "custom",
          custom: {
            ...state.order.custom,
            draft: {
              ...createInitialCustomDraft(),
              gender: action.gender,
              wearerCustomerId: state.order.custom.draft.wearerCustomerId ?? state.order.payerCustomerId ?? state.selectedCustomerId,
            },
          },
        },
      };
    case "selectCustomWearer":
      return {
        ...state,
        order: {
          ...state.order,
          activeWorkflow: "custom",
          custom: {
            ...state.order.custom,
            draft: {
              ...state.order.custom.draft,
              wearerCustomerId: action.customerId,
              linkedMeasurementSetId: null,
              measurements: createEmptyMeasurements(),
            },
          },
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
            draft: {
              ...state.order.custom.draft,
              selectedGarment: action.garment,
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
            },
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
            draft: {
              ...state.order.custom.draft,
              ...action.patch,
            },
          },
        },
      };
    case "addCustomItem": {
      const draft = state.order.custom.draft;
      if (!draft.selectedGarment || !draft.wearerCustomerId) {
        return state;
      }

      return {
        ...state,
        order: {
          ...state.order,
          custom: {
            ...state.order.custom,
            items: [
              ...state.order.custom.items,
              {
                id: Date.now(),
                ...draft,
                wearerName: action.payload.wearerName,
                linkedMeasurementLabel: action.payload.linkedMeasurementLabel,
                measurementSnapshot: { ...draft.measurements },
              },
            ],
            draft: {
              ...createInitialCustomDraft(),
              gender: draft.gender,
            },
          },
        },
      };
    }
    case "loadCustomItemForEdit": {
      const item = state.order.custom.items.find((customItem) => customItem.id === action.itemId);
      if (!item) {
        return state;
      }

      return {
        ...state,
        order: {
          ...state.order,
          activeWorkflow: "custom",
          custom: {
            ...state.order.custom,
            draft: {
              ...item,
              measurements: { ...item.measurementSnapshot },
            },
          },
        },
      };
    }
    case "saveCustomItem": {
      const draft = state.order.custom.draft;
      if (!draft.selectedGarment || !draft.wearerCustomerId) {
        return state;
      }

      return {
        ...state,
        order: {
          ...state.order,
          custom: {
            ...state.order.custom,
            items: state.order.custom.items.map((item) =>
              item.id === action.payload.itemId
                ? {
                    ...item,
                    ...draft,
                    wearerName: action.payload.wearerName,
                    linkedMeasurementLabel: action.payload.linkedMeasurementLabel,
                    measurementSnapshot: { ...draft.measurements },
                  }
                : item,
            ),
            draft: {
              ...createInitialCustomDraft(),
              gender: draft.gender,
            },
          },
        },
      };
    }
    case "resetCustomDraft":
      return {
        ...state,
        order: {
          ...state.order,
          custom: {
            ...state.order.custom,
            draft: createInitialCustomDraft(),
          },
        },
      };
    case "removeCustomItem":
      return {
        ...state,
        order: {
          ...state.order,
          custom: {
            ...state.order.custom,
            items: state.order.custom.items.filter((item) => item.id !== action.itemId),
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
            draft: {
              ...state.order.custom.draft,
              measurements: {
                ...state.order.custom.draft.measurements,
                [action.field]: action.value,
              },
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
            draft: {
              ...state.order.custom.draft,
              linkedMeasurementSetId: action.measurementSetId,
              measurements: {
                ...createEmptyMeasurements(),
                ...action.values,
              },
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
            draft: {
              ...state.order.custom.draft,
              linkedMeasurementSetId: action.measurementSetId,
            },
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
