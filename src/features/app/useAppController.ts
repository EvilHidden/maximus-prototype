import { useMemo, useReducer } from "react";
import {
  adaptAppointments,
  adaptClosedOrderHistory,
  adaptCustomerOrders,
  adaptCustomers,
  adaptMeasurementSets,
  adaptOpenOrders,
} from "../../db/adapters";
import { getPickupAppointments } from "../home/selectors";
import { appReducer, createInitialAppState } from "../../state/appState";
import type { Customer } from "../../types";
import { useAppRuntimeData } from "./useAppRuntimeData";
import { useMeasurementSetManager } from "./useMeasurementSetManager";
import { useAppWorkflowActions } from "./useAppWorkflowActions";

export function useAppController() {
  const appRuntime = useAppRuntimeData();
  const {
    referenceData,
    database,
  } = appRuntime;

  const [state, dispatch] = useReducer(
    appReducer,
    { database },
    createInitialAppState,
  );

  const customers = useMemo(() => adaptCustomers(state.database), [state.database]);
  const customerOrders = useMemo(() => adaptCustomerOrders(state.database), [state.database]);
  const appointments = useMemo(() => adaptAppointments(state.database), [state.database]);
  const derivedMeasurementSets = useMemo(() => adaptMeasurementSets(state.database), [state.database]);
  const openOrders = useMemo(() => adaptOpenOrders(state.database), [state.database]);
  const closedOrderHistory = useMemo(() => adaptClosedOrderHistory(state.database), [state.database]);

  const selectedCustomer = useMemo<Customer | null>(
    () => customers.find((customer) => customer.id === state.selectedCustomerId) ?? null,
    [customers, state.selectedCustomerId],
  );
  const payerCustomer = useMemo<Customer | null>(
    () => customers.find((customer) => customer.id === state.order.payerCustomerId) ?? null,
    [customers, state.order.payerCustomerId],
  );
  const checkoutOpenOrder = useMemo(
    () => openOrders.find((openOrder) => openOrder.id === state.checkoutOpenOrderId) ?? null,
    [openOrders, state.checkoutOpenOrderId],
  );
  const pickupAppointments = useMemo(() => getPickupAppointments(appointments), [appointments]);

  const { measurementSets, saveMeasurements, createDraftMeasurements, deleteMeasurementSet } = useMeasurementSetManager({
    measurementSets: derivedMeasurementSets,
    selectedCustomer,
    linkedMeasurementSetId: state.order.custom.draft.linkedMeasurementSetId,
    measurements: state.order.custom.draft.measurements,
    dispatch,
  });
  const { startWorkflow, openWorkflowAppointment, saveDraftOrder, startOpenOrderPayment, captureOpenOrderPayment } = useAppWorkflowActions({ dispatch, order: state.order });

  return {
    state,
    dispatch,
    referenceData,
    customers,
    customerOrders,
    appointments,
    openOrders,
    measurementSets,
    closedOrderHistory,
    selectedCustomer,
    payerCustomer,
    checkoutOpenOrder,
    pickupAppointments,
    startWorkflow,
    openWorkflowAppointment,
    saveMeasurements,
    createDraftMeasurements,
    deleteMeasurementSet,
    saveDraftOrder,
    startOpenOrderPayment,
    captureOpenOrderPayment,
  };
}
