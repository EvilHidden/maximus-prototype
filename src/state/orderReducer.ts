import type { AppAction, AppState } from "./types";
import { adaptCustomers, adaptOpenOrders } from "../db/adapters";
import {
  assignOpenOrderTailor,
  cancelOpenOrder,
  cancelAppointmentRecord,
  completeAppointmentRecord,
  confirmAppointmentRecord,
  completeOpenOrderCheckout,
  completeOpenOrderPickup,
  markOrderScopePickupReady,
  saveOrderWorkflowToDatabase,
  startOpenOrderWork,
} from "../db/mutations";
import {
  createEmptyMeasurements,
  createInitialCustomDraft,
  createInitialOrderState,
} from "./orderState";
import { hasMissingRequiredAlterationAdjustments, normalizeAlterationAdjustment } from "../features/order/alterationAdjustments";

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

function getAlterationSubtotal(modifiers: AppState["order"]["alteration"]["selectedModifiers"]) {
  return modifiers.reduce((sum, modifier) => sum + modifier.price, 0);
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
    case "saveOpenOrder":
      {
        const shouldRequestCheckoutPayment = action.openCheckout && action.paymentMode !== "none";
        const savedOrder = saveOrderWorkflowToDatabase(
          state.database,
          state.order,
          adaptCustomers(state.database),
          shouldRequestCheckoutPayment ? "none" : action.paymentMode,
          { now: getNow(options), idFactory: options?.idFactory },
          state.editingOpenOrderId,
        );

        if (!savedOrder) {
          return state;
        }

        return {
          ...state,
          screen: action.openCheckout ? "orderDetails" : "openOrders",
          checkoutOpenOrderId: action.openCheckout ? savedOrder.openOrderId : null,
          checkoutJustSavedOpenOrderId: action.openCheckout ? savedOrder.openOrderId : null,
          checkoutJustCompletedOpenOrderId: null,
          checkoutRequestedPaymentMode: shouldRequestCheckoutPayment && action.paymentMode !== "none" ? action.paymentMode : null,
          editingOpenOrderId: null,
          database: savedOrder.database,
          order: createInitialOrderState(),
        };
      }
    case "saveEditedOpenOrder":
      {
        if (!state.editingOpenOrderId) {
          return state;
        }

        const savedOrder = saveOrderWorkflowToDatabase(
          state.database,
          state.order,
          adaptCustomers(state.database),
          "none",
          { now: getNow(options), idFactory: options?.idFactory },
          state.editingOpenOrderId,
        );

        if (!savedOrder) {
          return state;
        }

        return {
          ...state,
          screen: "orderDetails",
          checkoutOpenOrderId: savedOrder.openOrderId,
          checkoutJustSavedOpenOrderId: null,
          checkoutJustCompletedOpenOrderId: null,
          checkoutRequestedPaymentMode: null,
          editingOpenOrderId: null,
          database: savedOrder.database,
          order: createInitialOrderState(),
        };
      }
    case "assignOpenOrderTailor":
      return {
        ...state,
        database: assignOpenOrderTailor(state.database, action.openOrderId, action.staffId, getNow(options)),
      };
    case "startOpenOrderWork":
      return {
        ...state,
        checkoutJustSavedOpenOrderId: null,
        checkoutJustCompletedOpenOrderId: null,
        database: startOpenOrderWork(state.database, action.openOrderId, getNow(options)),
      };
    case "completeOpenOrderCheckout":
      return {
        ...state,
        checkoutJustSavedOpenOrderId: null,
        checkoutJustCompletedOpenOrderId: action.openOrderId,
        checkoutRequestedPaymentMode: null,
        database: completeOpenOrderCheckout(state.database, action.openOrderId, action.paymentMode, getNow(options)),
      };
    case "markOpenOrderPickupReady":
      return {
        ...state,
        checkoutJustCompletedOpenOrderId: null,
        checkoutRequestedPaymentMode: null,
        database: markOrderScopePickupReady(state.database, action.pickupId, getNow(options)),
      };
    case "completeOpenOrderPickup":
      return {
        ...state,
        screen: "openOrders",
        checkoutOpenOrderId: null,
        checkoutJustSavedOpenOrderId: null,
        checkoutJustCompletedOpenOrderId: null,
        checkoutRequestedPaymentMode: null,
        editingOpenOrderId: null,
        database: completeOpenOrderPickup(state.database, action.openOrderId, getNow(options)),
      };
    case "cancelOpenOrder":
      return {
        ...state,
        screen: "openOrders",
        checkoutOpenOrderId: null,
        checkoutJustSavedOpenOrderId: null,
        checkoutJustCompletedOpenOrderId: null,
        checkoutRequestedPaymentMode: null,
        editingOpenOrderId: null,
        database: cancelOpenOrder(state.database, action.openOrderId, getNow(options)),
      };
    case "completeAppointment":
      return {
        ...state,
        database: completeAppointmentRecord(state.database, action.appointmentId, getNow(options)),
      };
    case "confirmAppointment":
      return {
        ...state,
        database: confirmAppointmentRecord(state.database, action.appointmentId, getNow(options)),
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
      const isSelected = state.order.alteration.selectedModifiers.some((modifier) => modifier.id === action.modifier.id);
      return {
        ...state,
        order: {
          ...state.order,
          alteration: {
            ...state.order.alteration,
            selectedModifiers: isSelected
              ? state.order.alteration.selectedModifiers.filter((modifier) => modifier.id !== action.modifier.id)
              : [...state.order.alteration.selectedModifiers, {
                  ...action.modifier,
                  deltaInches: null,
                }],
          },
        },
      };
    }
    case "setAlterationModifierAdjustment":
      return {
        ...state,
        order: {
          ...state.order,
          alteration: {
            ...state.order.alteration,
            selectedModifiers: state.order.alteration.selectedModifiers.map((modifier) => (
              modifier.id !== action.modifierId
                ? modifier
                : {
                    ...modifier,
                    deltaInches: action.deltaInches === null ? null : normalizeAlterationAdjustment(action.deltaInches),
                  }
            )),
          },
        },
      };
    case "toggleAlterationRush":
      return {
        ...state,
        order: {
          ...state.order,
          alteration: {
            ...state.order.alteration,
            selectedRush: !state.order.alteration.selectedRush,
          },
        },
      };
    case "addAlterationItem": {
      if (
        !state.order.alteration.selectedGarment
        || state.order.alteration.selectedModifiers.length === 0
        || hasMissingRequiredAlterationAdjustments(state.order.alteration.selectedModifiers)
      ) {
        return state;
      }

      const subtotal = getAlterationSubtotal(state.order.alteration.selectedModifiers);
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
                modifiers: state.order.alteration.selectedModifiers.map((modifier) => ({ ...modifier })),
                subtotal,
                isRush: state.order.alteration.selectedRush,
              },
            ],
            selectedModifiers: [],
            selectedRush: false,
          },
        },
      };
    }
    case "loadAlterationItemForEdit": {
      const item = state.order.alteration.items.find((candidate) => candidate.id === action.itemId);
      if (!item) {
        return state;
      }

      return {
        ...state,
        order: {
          ...state.order,
          activeWorkflow: "alteration",
          alteration: {
            ...state.order.alteration,
            selectedGarment: item.garment,
            selectedModifiers: item.modifiers.map((modifier) => ({ ...modifier })),
            selectedRush: item.isRush,
          },
        },
      };
    }
    case "saveAlterationItem": {
      if (
        !state.order.alteration.selectedGarment
        || state.order.alteration.selectedModifiers.length === 0
        || hasMissingRequiredAlterationAdjustments(state.order.alteration.selectedModifiers)
      ) {
        return state;
      }

      return {
        ...state,
        order: {
          ...state.order,
          alteration: {
            ...state.order.alteration,
            items: state.order.alteration.items.map((item) => (
              item.id !== action.itemId
                ? item
                : {
                    ...item,
                    garment: state.order.alteration.selectedGarment,
                    modifiers: state.order.alteration.selectedModifiers.map((modifier) => ({ ...modifier })),
                    subtotal: getAlterationSubtotal(state.order.alteration.selectedModifiers),
                    isRush: state.order.alteration.selectedRush,
                  }
            )),
            selectedGarment: "",
            selectedModifiers: [],
            selectedRush: false,
          },
        },
      };
    }
    case "resetAlterationDraft":
      return {
        ...state,
        order: {
          ...state.order,
          alteration: {
            ...state.order.alteration,
            selectedGarment: "",
            selectedModifiers: [],
            selectedRush: false,
          },
        },
      };
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
                subtotal: getAlterationSubtotal(modifiers),
                isRush: action.payload.isRush ?? item.isRush,
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
    case "setAlterationPickup":
      return {
        ...state,
        order: {
          ...state.order,
          fulfillment: {
            ...state.order.fulfillment,
            alteration: {
              pickupDate: action.payload.pickupDate,
              pickupTime: action.payload.pickupTime,
              pickupLocation: action.payload.pickupLocation,
            },
          },
        },
      };
    case "setCustomOccasion":
      return {
        ...state,
        order: {
          ...state.order,
          fulfillment: {
            ...state.order.fulfillment,
            custom: {
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
