import type { OpenOrder } from "../types";
import { createInitialOrderState } from "./orderState";
import { tryReduceOrderAction } from "./orderReducer";
import type { AppAction, AppState } from "./types";

export type { AppAction, AppState } from "./types";
export { createInitialOrderState } from "./orderState";

export function createInitialAppState(initialOpenOrders: OpenOrder[] = []): AppState {
  return {
    screen: "home",
    selectedCustomerId: null,
    openOrders: initialOpenOrders,
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
    default:
      return tryReduceOrderAction(state, action) ?? state;
  }
}
