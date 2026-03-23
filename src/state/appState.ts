import { createPrototypeDatabase } from "../db/runtime";
import {
  addCustomerRecord,
  archiveCustomerRecord,
  createManualAppointmentRecord,
  loadOrderWorkflowForEdit,
  replaceDraftOrderRecords,
  rescheduleAppointmentRecord,
  updateCustomerRecord,
} from "../db/mutations";
import { createEmptyMeasurements } from "./orderState";
import { createInitialOrderState } from "./orderState";
import { tryReduceOrderAction, type OrderReducerOptions } from "./orderReducer";
import type { AppAction, AppState } from "./types";
import type { DraftOrderRecord } from "../types";

export type { AppAction, AppState } from "./types";
export { createInitialOrderState } from "./orderState";

type InitialAppStateData = {
  database?: import("../db/schema").PrototypeDatabase;
};

const ACTIVE_DRAFT_ORDER_ID = "draft-current";

function createDraftOrderRecord(state: Pick<AppState, "order">): DraftOrderRecord {
  return {
    id: ACTIVE_DRAFT_ORDER_ID,
    payerCustomerId: state.order.payerCustomerId,
    updatedAt: new Date().toISOString(),
    snapshot: state.order,
  };
}

function syncDraftOrderRecord(state: AppState): AppState {
  return {
    ...state,
    database: replaceDraftOrderRecords(state.database, [createDraftOrderRecord(state)]),
  };
}

export function createInitialAppState({ database = createPrototypeDatabase() }: InitialAppStateData = {}): AppState {
  const existingDraft = database.draftOrders[0];
  const order = existingDraft?.snapshot ?? createInitialOrderState();
  const nextDatabase = existingDraft
    ? database
    : replaceDraftOrderRecords(database, [{
        id: ACTIVE_DRAFT_ORDER_ID,
        payerCustomerId: order.payerCustomerId,
        updatedAt: new Date().toISOString(),
        snapshot: order,
      }]);

  return {
    screen: "home",
    selectedCustomerId: order.payerCustomerId,
    checkoutOpenOrderId: null,
    editingOpenOrderId: null,
    database: nextDatabase,
    order,
  };
}

export function appReducer(state: AppState, action: AppAction, options?: OrderReducerOptions): AppState {
  switch (action.type) {
    case "setScreen":
      return syncDraftOrderRecord({
        ...state,
        screen: action.screen,
        checkoutOpenOrderId: null,
      });
    case "startOrderForCustomer":
      return syncDraftOrderRecord({
        ...state,
        screen: "order",
        selectedCustomerId: action.customerId,
        checkoutOpenOrderId: null,
        editingOpenOrderId: null,
        order: {
          ...createInitialOrderState(),
          payerCustomerId: action.customerId,
        },
      });
    case "openCheckoutForDraft":
      return syncDraftOrderRecord({
        ...state,
        screen: "checkout",
        checkoutOpenOrderId: null,
      });
    case "openCheckoutForOpenOrder":
      return syncDraftOrderRecord({
        ...state,
        screen: "checkout",
        editingOpenOrderId: null,
        checkoutOpenOrderId: action.openOrderId,
      });
    case "openOrderForEdit": {
      const nextOrder = loadOrderWorkflowForEdit(state.database, action.openOrderId);
      if (!nextOrder) {
        return state;
      }

      return syncDraftOrderRecord({
        ...state,
        screen: "order",
        checkoutOpenOrderId: null,
        editingOpenOrderId: action.openOrderId,
        selectedCustomerId: nextOrder.payerCustomerId,
        order: nextOrder,
      });
    }
    case "setCustomer":
      return syncDraftOrderRecord({
        ...state,
        selectedCustomerId: action.customerId,
      });
    case "addCustomer":
      return syncDraftOrderRecord({
        ...state,
        database: addCustomerRecord(state.database, action.customer),
        selectedCustomerId: action.customer.id,
      });
    case "updateCustomer":
      return syncDraftOrderRecord({
        ...state,
        database: updateCustomerRecord(state.database, action.customer),
      });
    case "createAppointment":
      return syncDraftOrderRecord({
        ...state,
        database: createManualAppointmentRecord(state.database, action.payload),
      });
    case "rescheduleAppointment":
      return syncDraftOrderRecord({
        ...state,
        database: rescheduleAppointmentRecord(state.database, action.payload),
      });
    case "archiveCustomer":
      return syncDraftOrderRecord({
        ...state,
        database: archiveCustomerRecord(state.database, action.customerId),
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
      });
    default:
      return syncDraftOrderRecord(tryReduceOrderAction(state, action, options) ?? state);
  }
}
