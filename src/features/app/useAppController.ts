import { useMemo, useReducer } from "react";
import {
  adaptAppointments,
  adaptClosedOrderDetail,
  adaptClosedOrderHistory,
  adaptCustomerOrders,
  adaptCustomers,
  adaptMeasurementSets,
  adaptOpenOrders,
} from "../../db/adapters";
import { createReferenceData } from "../../db";
import { filterActiveAppointments, filterServiceAppointments } from "../appointments/selectors";
import { appReducer, createInitialAppState } from "../../state/appState";
import type { Customer } from "../../types";
import { useAppRuntimeData } from "./useAppRuntimeData";
import { useMeasurementSetManager } from "./useMeasurementSetManager";
import { useAppWorkflowActions } from "./useAppWorkflowActions";

export function useAppController() {
  const appRuntime = useAppRuntimeData();
  const { database } = appRuntime;

  const [state, dispatch] = useReducer(
    appReducer,
    { database },
    createInitialAppState,
  );

  const referenceData = useMemo(() => createReferenceData(state.database), [state.database]);

  const customers = useMemo(() => adaptCustomers(state.database), [state.database]);
  const customerOrders = useMemo(() => adaptCustomerOrders(state.database), [state.database]);
  const activeAppointments = useMemo(() => filterActiveAppointments(adaptAppointments(state.database)), [state.database]);
  const appointments = useMemo(() => filterServiceAppointments(activeAppointments), [activeAppointments]);
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
  const checkoutClosedOrder = useMemo(
    () => adaptClosedOrderDetail(state.database, state.checkoutOpenOrderId),
    [state.checkoutOpenOrderId, state.database],
  );

  const { measurementSets, saveMeasurements, startNewMeasurementSet, deleteMeasurementSet } = useMeasurementSetManager({
    measurementSets: derivedMeasurementSets,
    dispatch,
  });
  const {
    startWorkflow,
    openWorkflowAppointment,
    saveDraftOrder,
    saveEditedOrder,
    startOpenOrderWork,
    completeOpenOrderCheckout,
  } = useAppWorkflowActions({ dispatch });

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
    checkoutClosedOrder,
    startWorkflow,
    openWorkflowAppointment,
    saveMeasurements,
    startNewMeasurementSet,
    deleteMeasurementSet,
    saveDraftOrder,
    saveEditedOrder,
    startOpenOrderWork,
    completeOpenOrderCheckout,
  };
}
