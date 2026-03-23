import type { AppAction, AppState } from "./types";
import { adaptCustomers } from "../db/adapters";
import {
  cancelOpenOrder,
  cancelAppointmentRecord,
  completeAppointmentRecord,
  completeOpenOrderPickup,
  captureOrderPayment,
  markOrderScopePickupReady,
  saveOrderWorkflowToDatabase,
  startOrderPaymentCollection,
} from "../db/mutations";
import {
  createEmptyMeasurements,
  createInitialCustomDraft,
  createInitialOrderState,
} from "./orderState";

export type OrderReducerOptions = {
  now?: Date;
  idFactory?: () => number;
};

function getNow(options?: OrderReducerOptions) {
  return options?.now ?? new Date();
}

function getNextId(options?: OrderReducerOptions) {
  return options?.idFactory?.() ?? Date.now();
}

export function tryReduceOrderAction(state: AppState, action: AppAction, options?: OrderReducerOptions): AppState | null {
  switch (action.type) {
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
    case "saveOpenOrder":
      {
        const savedOrder = saveOrderWorkflowToDatabase(
          state.database,
          state.order,
          adaptCustomers(state.database),
          action.paymentStatus,
          { now: getNow(options), idFactory: options?.idFactory },
          state.editingOpenOrderId,
        );

        if (!savedOrder) {
          return state;
        }

        return {
          ...state,
          screen: action.openCheckout ? "checkout" : "openOrders",
          checkoutOpenOrderId: action.openCheckout ? savedOrder.openOrderId : null,
          editingOpenOrderId: null,
          database: savedOrder.database,
          order: createInitialOrderState(),
        };
      }
    case "startOpenOrderPayment":
      return {
        ...state,
        database: startOrderPaymentCollection(state.database, action.openOrderId),
      };
    case "captureOpenOrderPayment":
      return {
        ...state,
        database: captureOrderPayment(state.database, action.openOrderId, getNow(options)),
      };
    case "markOpenOrderPickupReady":
      return {
        ...state,
        database: markOrderScopePickupReady(state.database, action.pickupId, getNow(options)),
      };
    case "completeOpenOrderPickup":
      return {
        ...state,
        screen: "openOrders",
        checkoutOpenOrderId: null,
        editingOpenOrderId: null,
        database: completeOpenOrderPickup(state.database, action.openOrderId, getNow(options)),
      };
    case "cancelOpenOrder":
      return {
        ...state,
        screen: "openOrders",
        checkoutOpenOrderId: null,
        editingOpenOrderId: null,
        database: cancelOpenOrder(state.database, action.openOrderId, getNow(options)),
      };
    case "completeAppointment":
      return {
        ...state,
        database: completeAppointmentRecord(state.database, action.appointmentId, getNow(options)),
      };
    case "cancelAppointment":
      return {
        ...state,
        database: cancelAppointmentRecord(state.database, action.appointmentId, getNow(options)),
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
      const itemId = getNextId(options);
      return {
        ...state,
        order: {
          ...state.order,
          alteration: {
            ...state.order.alteration,
            items: [
              ...state.order.alteration.items,
              {
                id: itemId,
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

      const itemId = getNextId(options);
      return {
        ...state,
        order: {
          ...state.order,
          custom: {
            ...state.order.custom,
            items: [
              ...state.order.custom.items,
              {
                id: itemId,
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
        editingOpenOrderId: null,
        order: createInitialOrderState(),
      };
    default:
      return null;
  }
}
