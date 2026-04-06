import { createPrototypeDatabase } from "../db/runtime";
import {
  addCustomerRecord,
  addAlterationServiceDefinition,
  addLocationRecord,
  addMeasurementFieldDefinition,
  archiveCustomerRecord,
  createManualAppointmentRecord,
  deleteMeasurementSetRecord,
  moveMeasurementFieldDefinition,
  loadOrderWorkflowForEdit,
  revertAcceptedOrderSave,
  replaceDraftOrderRecords,
  rescheduleAppointmentRecord,
  saveMeasurementSetRecord,
  updateAlterationServiceDefinition,
  updateAppointmentRecord,
  updateCustomerRecord,
  updateCatalogModifierOption,
  updateCustomPricingTier,
  updateCustomPricingTierGarmentPrice,
  updateLocationRecord,
  updateMeasurementFieldDefinition,
  updateOrganizationSettings,
} from "../db/mutations";
import { createEmptyMeasurements, createInitialOrderState, syncMeasurementFieldsInOrder } from "./orderState";
import { getMeasurementFieldLabels } from "../db/referenceData";
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
  const measurementFields = getMeasurementFieldLabels(database);
  const order = existingDraft?.snapshot
    ? syncMeasurementFieldsInOrder(existingDraft.snapshot, measurementFields)
    : createInitialOrderState(measurementFields);
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
    checkoutRequestedPaymentMode: null,
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
        checkoutRequestedPaymentMode: null,
      });
    case "startOrderForCustomer":
      return syncDraftOrderRecord({
        ...state,
        screen: "order",
        selectedCustomerId: action.customerId,
        checkoutOpenOrderId: null,
        checkoutJustSavedOpenOrderId: null,
        checkoutJustCompletedOpenOrderId: null,
        checkoutRequestedPaymentMode: null,
        editingOpenOrderId: null,
        order: {
          ...createInitialOrderState(getMeasurementFieldLabels(state.database)),
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
        checkoutRequestedPaymentMode: null,
      });
    case "openOrderDetails":
      return syncDraftOrderRecord({
        ...state,
        screen: "orderDetails",
        editingOpenOrderId: null,
        checkoutOpenOrderId: action.openOrderId,
        checkoutJustSavedOpenOrderId: null,
        checkoutJustCompletedOpenOrderId: null,
        checkoutRequestedPaymentMode: null,
      });
    case "openCheckoutForOpenOrder":
      return syncDraftOrderRecord({
        ...state,
        screen: "orderDetails",
        editingOpenOrderId: null,
        checkoutOpenOrderId: action.openOrderId,
        checkoutJustSavedOpenOrderId: null,
        checkoutJustCompletedOpenOrderId: null,
        checkoutRequestedPaymentMode: null,
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
        checkoutRequestedPaymentMode: null,
        editingOpenOrderId: action.openOrderId,
        selectedCustomerId: nextOrder.payerCustomerId,
        order: nextOrder,
      });
    }
    case "clearCheckoutPaymentRequest":
      return syncDraftOrderRecord({
        ...state,
        checkoutRequestedPaymentMode: null,
      });
    case "revertAcceptedOrderSave": {
      const restoredOrder = loadOrderWorkflowForEdit(state.database, action.openOrderId);
      if (!restoredOrder) {
        return state;
      }

      return syncDraftOrderRecord({
        ...state,
        screen: "checkout",
        selectedCustomerId: restoredOrder.payerCustomerId,
        checkoutOpenOrderId: null,
        checkoutJustSavedOpenOrderId: null,
        checkoutJustCompletedOpenOrderId: null,
        checkoutRequestedPaymentMode: null,
        editingOpenOrderId: null,
        database: revertAcceptedOrderSave(state.database, action.openOrderId),
        order: restoredOrder,
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
    case "updateOrganizationSettings":
      return syncDraftOrderRecord({
        ...state,
        database: updateOrganizationSettings(state.database, action.payload),
      });
    case "addLocation":
      return syncDraftOrderRecord({
        ...state,
        database: addLocationRecord(state.database, action.name),
      });
    case "updateLocation":
      return syncDraftOrderRecord({
        ...state,
        database: updateLocationRecord(state.database, action.payload.locationId, action.payload.patch),
      });
    case "addMeasurementField": {
      const nextDatabase = addMeasurementFieldDefinition(state.database, action.label);
      const measurementFields = getMeasurementFieldLabels(nextDatabase);
      return syncDraftOrderRecord({
        ...state,
        database: nextDatabase,
        order: syncMeasurementFieldsInOrder(state.order, measurementFields),
      });
    }
    case "updateMeasurementField": {
      const previousField = state.database.measurementFieldDefinitions.find((field) => field.id === action.payload.fieldId) ?? null;
      const nextDatabase = updateMeasurementFieldDefinition(state.database, action.payload.fieldId, action.payload.patch);
      const nextField = nextDatabase.measurementFieldDefinitions.find((field) => field.id === action.payload.fieldId) ?? null;
      const nextOrder = previousField && nextField && previousField.label !== nextField.label
        ? syncMeasurementFieldsInOrder(
            {
              ...state.order,
              custom: {
                ...state.order.custom,
                draft: {
                  ...state.order.custom.draft,
                  measurements: Object.fromEntries(
                    Object.entries(state.order.custom.draft.measurements).map(([key, value]) => [key === previousField.label ? nextField.label : key, value]),
                  ),
                },
                items: state.order.custom.items.map((item) => ({
                  ...item,
                  measurements: Object.fromEntries(
                    Object.entries(item.measurements).map(([key, value]) => [key === previousField.label ? nextField.label : key, value]),
                  ),
                  measurementSnapshot: Object.fromEntries(
                    Object.entries(item.measurementSnapshot).map(([key, value]) => [key === previousField.label ? nextField.label : key, value]),
                  ),
                })),
              },
            },
            getMeasurementFieldLabels(nextDatabase),
          )
        : syncMeasurementFieldsInOrder(state.order, getMeasurementFieldLabels(nextDatabase));

      return syncDraftOrderRecord({
        ...state,
        database: nextDatabase,
        order: nextOrder,
      });
    }
    case "moveMeasurementField": {
      const nextDatabase = moveMeasurementFieldDefinition(state.database, action.fieldId, action.direction);
      return syncDraftOrderRecord({
        ...state,
        database: nextDatabase,
        order: syncMeasurementFieldsInOrder(state.order, getMeasurementFieldLabels(nextDatabase)),
      });
    }
    case "addAlterationServiceDefinition":
      return syncDraftOrderRecord({
        ...state,
        database: addAlterationServiceDefinition(state.database, action.payload),
      });
    case "updateAlterationServiceDefinition":
      return syncDraftOrderRecord({
        ...state,
        database: updateAlterationServiceDefinition(state.database, action.payload.serviceId, action.payload.patch),
      });
    case "updateCustomPricingTier":
      return syncDraftOrderRecord({
        ...state,
        database: updateCustomPricingTier(state.database, action.payload.tierKey, action.payload.patch),
      });
    case "updateCustomPricingTierGarmentPrice":
      return syncDraftOrderRecord({
        ...state,
        database: updateCustomPricingTierGarmentPrice(state.database, action.tierKey, action.garment, action.price),
      });
    case "updateCatalogModifierOption":
      return syncDraftOrderRecord({
        ...state,
        database: updateCatalogModifierOption(
          state.database,
          action.payload.optionId,
          action.payload.patch,
        ),
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
              measurements: createEmptyMeasurements(getMeasurementFieldLabels(state.database)),
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
