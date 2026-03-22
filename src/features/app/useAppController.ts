import { useMemo, useReducer, useState } from "react";
import { createAppRuntime } from "../../db";
import { buildOpenOrder } from "../order/selectors";
import { getPickupAppointments } from "../home/selectors";
import {
  createDraftMeasurementSet,
  deleteMeasurementSetAndPreserveDraft,
  saveMeasurementSet,
} from "../measurements/service";
import { appReducer, createInitialAppState } from "../../state/appState";
import type { Appointment, Customer, MeasurementSet, WorkflowMode } from "../../types";

export function useAppController() {
  const appRuntime = useMemo(() => createAppRuntime(), []);
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
  const [measurementSets, setMeasurementSets] = useState<MeasurementSet[]>(baseMeasurementSets);

  const selectedCustomer = useMemo<Customer | null>(
    () => customers.find((customer) => customer.id === state.selectedCustomerId) ?? null,
    [customers, state.selectedCustomerId],
  );
  const payerCustomer = useMemo<Customer | null>(
    () => customers.find((customer) => customer.id === state.order.payerCustomerId) ?? null,
    [customers, state.order.payerCustomerId],
  );
  const pickupAppointments = useMemo(() => getPickupAppointments(baseAppointments), [baseAppointments]);

  const startWorkflow = (workflow: WorkflowMode) => {
    dispatch({ type: "clearOrder" });
    dispatch({ type: "activateWorkflow", workflow });
    dispatch({ type: "setScreen", screen: "order" });
  };

  const openWorkflowAppointment = (appointment: Appointment) => {
    if (appointment.route !== "alteration" && appointment.route !== "custom") {
      return;
    }

    dispatch({ type: "clearOrder" });
    if (appointment.customerId) {
      dispatch({ type: "setCustomer", customerId: appointment.customerId });
      dispatch({ type: "setOrderPayer", customerId: appointment.customerId });
    }
    dispatch({ type: "activateWorkflow", workflow: appointment.route });
    dispatch({ type: "setScreen", screen: "order" });
  };

  const saveMeasurements = (mode: "draft" | "saved", title: string) => {
    if (!selectedCustomer) {
      return;
    }

    const result = saveMeasurementSet(
      measurementSets,
      selectedCustomer,
      state.order.custom.draft.linkedMeasurementSetId,
      state.order.custom.draft.measurements,
      mode,
      title,
    );

    setMeasurementSets(result.measurementSets);
    dispatch({ type: "linkMeasurementSet", measurementSetId: result.linkedMeasurementSetId });
  };

  const createDraftMeasurements = () => {
    const result = createDraftMeasurementSet(measurementSets, selectedCustomer);
    setMeasurementSets(result.measurementSets);
    dispatch({
      type: "replaceMeasurements",
      values: result.values,
      measurementSetId: result.linkedMeasurementSetId || null,
    });
  };

  const deleteMeasurementSet = (measurementSetId: string) => {
    const result = deleteMeasurementSetAndPreserveDraft(
      measurementSets,
      measurementSetId,
      state.order.custom.draft.linkedMeasurementSetId,
      selectedCustomer,
      state.order.custom.draft.measurements,
    );
    setMeasurementSets(result.measurementSets);
    dispatch({ type: "linkMeasurementSet", measurementSetId: result.linkedMeasurementSetId });
  };

  const completeOrder = (paymentStatus: "pay_later" | "prepaid") => {
    const openOrder = buildOpenOrder(state.order, customers, paymentStatus);
    if (!openOrder) {
      return;
    }

    dispatch({ type: "completeOpenOrder", openOrder });
  };

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
