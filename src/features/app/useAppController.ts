import { useMemo, useReducer } from "react";
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
    customers,
    customerOrders,
    appointments: baseAppointments,
    measurementSets: baseMeasurementSets,
    openOrders: initialOpenOrders,
    closedOrderHistory,
  } = appRuntime;

  const [state, dispatch] = useReducer(appReducer, initialOpenOrders, createInitialAppState);

  const selectedCustomer = useMemo<Customer | null>(
    () => customers.find((customer) => customer.id === state.selectedCustomerId) ?? null,
    [customers, state.selectedCustomerId],
  );
  const payerCustomer = useMemo<Customer | null>(
    () => customers.find((customer) => customer.id === state.order.payerCustomerId) ?? null,
    [customers, state.order.payerCustomerId],
  );
  const pickupAppointments = useMemo(() => getPickupAppointments(baseAppointments), [baseAppointments]);

  const { measurementSets, saveMeasurements, createDraftMeasurements, deleteMeasurementSet } = useMeasurementSetManager({
    baseMeasurementSets,
    selectedCustomer,
    linkedMeasurementSetId: state.order.custom.draft.linkedMeasurementSetId,
    measurements: state.order.custom.draft.measurements,
    dispatch,
  });
  const { startWorkflow, openWorkflowAppointment, completeOrder } = useAppWorkflowActions({
    customers,
    dispatch,
    order: state.order,
  });

  return {
    state,
    dispatch,
    referenceData,
    customers,
    customerOrders,
    appointments: baseAppointments,
    measurementSets,
    closedOrderHistory,
    selectedCustomer,
    payerCustomer,
    pickupAppointments,
    startWorkflow,
    openWorkflowAppointment,
    saveMeasurements,
    createDraftMeasurements,
    deleteMeasurementSet,
    completeOrder,
  };
}
