import { useMemo, useReducer } from "react";
import {
  adaptAppointments,
  adaptClosedOrderHistory,
  adaptCustomerOrders,
  adaptCustomers,
  adaptMeasurementSets,
  adaptOpenOrders,
  adaptStaffMembers,
} from "../../db/adapters";
import { filterActiveAppointments, filterServiceAppointments } from "../appointments/selectors";
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
  const activeAppointments = useMemo(() => filterActiveAppointments(adaptAppointments(state.database)), [state.database]);
  const appointments = useMemo(() => filterServiceAppointments(activeAppointments), [activeAppointments]);
  const derivedMeasurementSets = useMemo(() => adaptMeasurementSets(state.database), [state.database]);
  const openOrders = useMemo(() => adaptOpenOrders(state.database), [state.database]);
  const inHouseTailors = useMemo(() => adaptStaffMembers(state.database), [state.database]);
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

  const { measurementSets, saveMeasurements, createDraftMeasurements, deleteMeasurementSet } = useMeasurementSetManager({
    measurementSets: derivedMeasurementSets,
    dispatch,
  });
  const {
    startWorkflow,
    openWorkflowAppointment,
    saveDraftOrder,
    assignOpenOrderTailor,
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
    inHouseTailors,
    measurementSets,
    closedOrderHistory,
    selectedCustomer,
    payerCustomer,
    checkoutOpenOrder,
    startWorkflow,
    openWorkflowAppointment,
    saveMeasurements,
    createDraftMeasurements,
    deleteMeasurementSet,
    saveDraftOrder,
    assignOpenOrderTailor,
    startOpenOrderWork,
    completeOpenOrderCheckout,
  };
}
