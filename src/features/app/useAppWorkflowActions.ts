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

  const completeOrder = useCallback((paymentStatus: "pay_later" | "prepaid") => {
    const openOrder = buildOpenOrder(order, customers, paymentStatus);
    if (!openOrder) {
      return;
    }

    dispatch({ type: "completeOpenOrder", openOrder });
  }, [customers, dispatch, order]);

  return {
    startWorkflow,
    openWorkflowAppointment,
    completeOrder,
  };
}
