import { useCallback } from "react";
import type { Appointment, CheckoutPaymentMode, WorkflowMode } from "../../types";
import type { AppAction } from "../../state/appState";

type UseAppWorkflowActionsArgs = {
  dispatch: React.Dispatch<AppAction>;
};

export function useAppWorkflowActions({ dispatch }: UseAppWorkflowActionsArgs) {
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

  const saveDraftOrder = useCallback((paymentMode: CheckoutPaymentMode, openCheckout = false) => {
    dispatch({ type: "saveOpenOrder", paymentMode, openCheckout });
  }, [dispatch]);

  const saveEditedOrder = useCallback(() => {
    dispatch({ type: "saveEditedOpenOrder" });
  }, [dispatch]);

  const assignOpenOrderTailor = useCallback((openOrderId: number, staffId: string | null) => {
    dispatch({ type: "assignOpenOrderTailor", openOrderId, staffId });
  }, [dispatch]);

  const startOpenOrderWork = useCallback((openOrderId: number) => {
    dispatch({ type: "startOpenOrderWork", openOrderId });
  }, [dispatch]);

  const completeOpenOrderCheckout = useCallback((openOrderId: number, paymentMode: Exclude<CheckoutPaymentMode, "none">) => {
    dispatch({ type: "completeOpenOrderCheckout", openOrderId, paymentMode });
  }, [dispatch]);

  return {
    startWorkflow,
    openWorkflowAppointment,
    saveDraftOrder,
    saveEditedOrder,
    assignOpenOrderTailor,
    startOpenOrderWork,
    completeOpenOrderCheckout,
  };
}
