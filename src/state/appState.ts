import type { Customer, OpenOrder } from "../types";
import { createEmptyMeasurements } from "./orderState";
import { createInitialOrderState } from "./orderState";
import { tryReduceOrderAction, type OrderReducerOptions } from "./orderReducer";
import type { AppAction, AppState } from "./types";

export type { AppAction, AppState } from "./types";
export { createInitialOrderState } from "./orderState";

type InitialAppStateData = {
  customers?: Customer[];
  openOrders?: OpenOrder[];
};

export function createInitialAppState({ customers = [], openOrders = [] }: InitialAppStateData = {}): AppState {
  return {
    screen: "home",
    selectedCustomerId: null,
    checkoutOpenOrderId: null,
    customers,
    openOrders,
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
        customers: [action.customer, ...state.customers],
        selectedCustomerId: action.customer.id,
      };
    case "updateCustomer":
      return {
        ...state,
        customers: state.customers.map((customer) => (
          customer.id === action.customer.id ? action.customer : customer
        )),
      };
    case "deleteCustomer":
      return {
        ...state,
        customers: state.customers.filter((customer) => customer.id !== action.customerId),
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
