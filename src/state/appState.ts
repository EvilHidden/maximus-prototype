import { createPrototypeDatabase } from "../db/runtime";
import {
  addCustomerRecord,
  archiveCustomerRecord,
  createManualAppointmentRecord,
  deleteMeasurementSetRecord,
  loadOrderWorkflowForEdit,
  replaceDraftOrderRecords,
  rescheduleAppointmentRecord,
  saveMeasurementSetRecord,
  updateAppointmentRecord,
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

function createDraftOrderRecord(state: Pick<AppState, "order" | "selectedCustomerId">): DraftOrderRecord {
  return {
    id: ACTIVE_DRAFT_ORDER_ID,
    payerCustomerId: state.order.payerCustomerId,
    selectedCustomerId: state.selectedCustomerId,
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
        selectedCustomerId: order.payerCustomerId,
        updatedAt: new Date().toISOString(),
        snapshot: order,
      }]);

  return {
    screen: "home",
    selectedCustomerId: existingDraft?.selectedCustomerId ?? order.payerCustomerId,
    checkoutOpenOrderId: null,
    checkoutJustSavedOpenOrderId: null,
    checkoutJustCompletedOpenOrderId: null,
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
        checkoutJustSavedOpenOrderId: null,
        checkoutJustCompletedOpenOrderId: null,
      });
    case "startOrderForCustomer":
      return syncDraftOrderRecord({
        ...state,
        screen: "order",
        selectedCustomerId: action.customerId,
        checkoutOpenOrderId: null,
        checkoutJustSavedOpenOrderId: null,
        checkoutJustCompletedOpenOrderId: null,
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
        checkoutJustSavedOpenOrderId: null,
        checkoutJustCompletedOpenOrderId: null,
      });
    case "openOrderDetails":
      return syncDraftOrderRecord({
        ...state,
        screen: "orderDetails",
        editingOpenOrderId: null,
        checkoutOpenOrderId: action.openOrderId,
        checkoutJustSavedOpenOrderId: null,
        checkoutJustCompletedOpenOrderId: null,
      });
    case "openCheckoutForOpenOrder":
      return syncDraftOrderRecord({
        ...state,
        screen: "orderDetails",
        editingOpenOrderId: null,
        checkoutOpenOrderId: action.openOrderId,
        checkoutJustSavedOpenOrderId: null,
        checkoutJustCompletedOpenOrderId: null,
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
        checkoutJustSavedOpenOrderId: null,
        checkoutJustCompletedOpenOrderId: null,
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
    case "updateAppointment":
      return syncDraftOrderRecord({
        ...state,
        database: updateAppointmentRecord(state.database, action.payload),
      });
    case "startNewMeasurementSet":
      return syncDraftOrderRecord({
        ...state,
        order: {
          ...state.order,
          custom: {
            ...state.order.custom,
            draft: {
              ...state.order.custom.draft,
              linkedMeasurementSetId: null,
              measurements: createEmptyMeasurements(),
            },
          },
        },
      });
    case "saveMeasurementSet": {
      if (!state.selectedCustomerId) {
        return state;
      }

      const result = saveMeasurementSetRecord(state.database, {
        customerId: state.selectedCustomerId,
        measurementSetId: state.order.custom.draft.linkedMeasurementSetId,
        measurements: state.order.custom.draft.measurements,
        mode: action.payload.mode,
        title: action.payload.title,
      });

      return syncDraftOrderRecord({
        ...state,
        database: result.database,
        order: {
          ...state.order,
          custom: {
            ...state.order.custom,
            draft: {
              ...state.order.custom.draft,
              linkedMeasurementSetId: result.linkedMeasurementSetId || null,
            },
          },
        },
      });
    }
    case "deleteMeasurementSet": {
      const result = deleteMeasurementSetRecord(state.database, {
        measurementSetId: action.measurementSetId,
        linkedMeasurementSetId: state.order.custom.draft.linkedMeasurementSetId,
        customerId: state.selectedCustomerId,
        measurements: state.order.custom.draft.measurements,
      });

      return syncDraftOrderRecord({
        ...state,
        database: result.database,
        order: {
          ...state.order,
          custom: {
            ...state.order.custom,
            draft: {
              ...state.order.custom.draft,
              linkedMeasurementSetId: result.linkedMeasurementSetId,
            },
          },
        },
      });
    }
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
