import { useCallback } from "react";
import { buildOpenOrder } from "../order/selectors";
import type { Appointment, Customer, WorkflowMode } from "../../types";
import type { AppAction, AppState } from "../../state/appState";

type UseAppWorkflowActionsArgs = {
  customers: Customer[];
  dispatch: React.Dispatch<AppAction>;
  order: AppState["order"];
};

export function useAppWorkflowActions({ customers, dispatch, order }: UseAppWorkflowActionsArgs) {
  const startWorkflow = useCallback((workflow: WorkflowMode) => {
    dispatch({ type: "clearOrder" });
    dispatch({ type: "activateWorkflow", workflow });
    dispatch({ type: "setScreen", screen: "order" });
  }, [dispatch]);

  const openWorkflowAppointment = useCallback((appointment: Appointment) => {
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
  }, [dispatch]);

  const saveDraftOrder = useCallback((paymentStatus: "due_later" | "ready_to_collect", openCheckout = false) => {
    const openOrder = buildOpenOrder(order, customers, paymentStatus);
    if (!openOrder) {
      return;
    }

    dispatch({ type: "saveOpenOrder", openOrder, openCheckout });
  }, [customers, dispatch, order]);

  const startOpenOrderPayment = useCallback((openOrderId: number) => {
    dispatch({ type: "startOpenOrderPayment", openOrderId });
  }, [dispatch]);

  const captureOpenOrderPayment = useCallback((openOrderId: number) => {
    dispatch({ type: "captureOpenOrderPayment", openOrderId });
  }, [dispatch]);

  return {
    startWorkflow,
    openWorkflowAppointment,
    saveDraftOrder,
    startOpenOrderPayment,
    captureOpenOrderPayment,
  };
}
