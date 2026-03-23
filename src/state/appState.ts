import { createPrototypeDatabase } from "../db/runtime";
import {
  addCustomerRecord,
  deleteCustomerRecord,
  updateCustomerRecord,
} from "../db/mutations";
import { createEmptyMeasurements } from "./orderState";
import { createInitialOrderState } from "./orderState";
import { tryReduceOrderAction, type OrderReducerOptions } from "./orderReducer";
import type { AppAction, AppState } from "./types";

export type { AppAction, AppState } from "./types";
export { createInitialOrderState } from "./orderState";

type InitialAppStateData = {
  database?: import("../db/schema").PrototypeDatabase;
};

export function createInitialAppState({ database = createPrototypeDatabase() }: InitialAppStateData = {}): AppState {
  return {
    screen: "home",
    selectedCustomerId: null,
    checkoutOpenOrderId: null,
    database,
    order: createInitialOrderState(),
  };
}

export function appReducer(state: AppState, action: AppAction, options?: OrderReducerOptions): AppState {
  switch (action.type) {
    case "setScreen":
      return {
        ...state,
        screen: action.screen,
        checkoutOpenOrderId: null,
      };
    case "openCheckoutForDraft":
      return {
        ...state,
        screen: "checkout",
        checkoutOpenOrderId: null,
      };
    case "openCheckoutForOpenOrder":
      return {
        ...state,
        screen: "checkout",
        checkoutOpenOrderId: action.openOrderId,
      };
    case "setCustomer":
      return {
        ...state,
        selectedCustomerId: action.customerId,
      };
    case "addCustomer":
      return {
        ...state,
        database: addCustomerRecord(state.database, action.customer),
        selectedCustomerId: action.customer.id,
      };
    case "updateCustomer":
      return {
        ...state,
        database: updateCustomerRecord(state.database, action.customer),
      };
    case "deleteCustomer":
      return {
        ...state,
        database: deleteCustomerRecord(state.database, action.customerId),
        selectedCustomerId: state.selectedCustomerId === action.customerId ? null : state.selectedCustomerId,
        order: {
          ...state.order,
          payerCustomerId: state.order.payerCustomerId === action.customerId ? null : state.order.payerCustomerId,
          custom: {
            ...state.order.custom,
            draft: state.order.custom.draft.wearerCustomerId === action.customerId
              ? {
                  ...state.order.custom.draft,
                  wearerCustomerId: null,
                  linkedMeasurementSetId: null,
                  measurements: {
                    ...createEmptyMeasurements(),
                    ...state.order.custom.draft.measurements,
                  },
                }
              : state.order.custom.draft,
            items: state.order.custom.items.map((item) => (
              item.wearerCustomerId === action.customerId
                ? {
                    ...item,
                    wearerCustomerId: null,
                    linkedMeasurementSetId: null,
                  }
                : item
            )),
          },
        },
      };
    default:
      return tryReduceOrderAction(state, action, options) ?? state;
  }
}
