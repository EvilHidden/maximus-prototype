import { HomeScreen } from "../../screens/HomeScreen";
import { CustomerScreen } from "../../screens/CustomerScreen";
import { OrderScreen } from "../../screens/OrderScreen";
import { MeasurementsScreen } from "../../screens/MeasurementsScreen";
import { OpenOrdersScreen } from "../../screens/OpenOrdersScreen";
import { AppointmentsScreen } from "../../screens/AppointmentsScreen";
import { ReviewOrderScreen } from "../../screens/CheckoutScreen";
import { OrderDetailsScreen } from "../../screens/OrderDetailsScreen";
import type { useAppController } from "./useAppController";

type AppController = ReturnType<typeof useAppController>;

export function AppScreenContent({
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
  startNewMeasurementSet,
  deleteMeasurementSet,
  saveDraftOrder,
  assignOpenOrderTailor,
  startOpenOrderWork,
  completeOpenOrderCheckout,
}: AppController) {
  if (state.screen === "home") {
    return (
      <HomeScreen
        appointments={appointments}
        openOrders={openOrders}
        pickupLocations={referenceData.pickupLocations}
        onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
        onStartWorkflow={startWorkflow}
        onOpenAppointment={openWorkflowAppointment}
        onCancelAppointment={(appointmentId) => dispatch({ type: "cancelAppointment", appointmentId })}
        onOpenReadyPickupOrder={(openOrderId) => dispatch({ type: "openOrderDetails", openOrderId })}
        onCheckoutReadyPickup={(openOrderId) => dispatch({ type: "openOrderDetails", openOrderId })}
      />
    );
  }

  if (state.screen === "customer") {
    return (
      <CustomerScreen
        customers={customers}
        customerOrders={customerOrders}
        measurementSets={measurementSets}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={(customer) => dispatch({ type: "setCustomer", customerId: customer.id })}
        onAddCustomer={(customer) => dispatch({ type: "addCustomer", customer })}
        onUpdateCustomer={(customer) => dispatch({ type: "updateCustomer", customer })}
        onArchiveCustomer={(customerId) => dispatch({ type: "archiveCustomer", customerId })}
        onStartOrderForCustomer={(customerId) => dispatch({ type: "startOrderForCustomer", customerId })}
        onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
      />
    );
  }

  if (state.screen === "order") {
    return (
      <OrderScreen
        customers={customers}
        measurementSets={measurementSets}
        referenceData={referenceData}
        payerCustomer={payerCustomer}
        order={state.order}
        editingOpenOrderId={state.editingOpenOrderId}
        dispatch={dispatch}
        onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
        onOpenDraftCheckout={() => dispatch({ type: "openCheckoutForDraft" })}
        onSaveDraftOrder={saveDraftOrder}
      />
    );
  }

  if (state.screen === "measurements") {
    return (
      <MeasurementsScreen
        customers={customers}
        selectedCustomer={selectedCustomer}
        measurementSets={measurementSets}
        measurementFields={referenceData.measurementFields}
        order={state.order}
        onStartNewSet={startNewMeasurementSet}
        onSelectCustomer={(customerId) => {
          dispatch({ type: "setCustomer", customerId });
          if (state.order.activeWorkflow === "custom") {
            dispatch({ type: "selectCustomWearer", customerId });
          }
        }}
        onUpdateMeasurement={(field, value) => dispatch({ type: "updateMeasurements", field, value })}
        onReplaceMeasurements={(values, measurementSetId) => dispatch({ type: "replaceMeasurements", values, measurementSetId })}
        onSaveMeasurementSet={saveMeasurements}
        onDeleteMeasurementSet={deleteMeasurementSet}
        onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
      />
    );
  }

  if (state.screen === "openOrders") {
    return (
      <OpenOrdersScreen
        openOrders={openOrders}
        closedOrderHistory={closedOrderHistory}
        pickupLocations={referenceData.pickupLocations}
        inHouseTailors={inHouseTailors}
        onAssignOpenOrderTailor={assignOpenOrderTailor}
        onStartOpenOrderWork={startOpenOrderWork}
        onMarkOpenOrderPickupReady={(openOrderId, pickupId) => dispatch({ type: "markOpenOrderPickupReady", openOrderId, pickupId })}
        onOpenOrderDetails={(openOrderId) => dispatch({ type: "openOrderDetails", openOrderId })}
        onStartNewOrder={() => startWorkflow("alteration")}
      />
    );
  }

  if (state.screen === "orderDetails") {
    return (
      <OrderDetailsScreen
        customers={customers}
        openOrder={checkoutOpenOrder}
        showAcceptedConfirmation={state.checkoutJustSavedOpenOrderId === checkoutOpenOrder?.id}
        showCheckoutCompletion={state.checkoutJustCompletedOpenOrderId === checkoutOpenOrder?.id}
        onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
        onCompleteOpenOrderCheckout={completeOpenOrderCheckout}
        onEditOpenOrder={(openOrderId) => dispatch({ type: "openOrderForEdit", openOrderId })}
        onCancelOpenOrder={(openOrderId) => dispatch({ type: "cancelOpenOrder", openOrderId })}
        onCompleteOpenOrderPickup={(openOrderId) => dispatch({ type: "completeOpenOrderPickup", openOrderId })}
      />
    );
  }

  if (state.screen === "appointments") {
    return (
      <AppointmentsScreen
        appointments={appointments}
        customers={customers}
        pickupLocations={referenceData.pickupLocations}
        onCreateAppointment={(payload) => dispatch({ type: "createAppointment", payload })}
        onUpdateAppointment={(payload) => dispatch({ type: "updateAppointment", payload })}
        onConfirmAppointment={(appointmentId) => dispatch({ type: "confirmAppointment", appointmentId })}
        onCancelAppointment={(appointmentId) => dispatch({ type: "cancelAppointment", appointmentId })}
      />
    );
  }

  return (
    <ReviewOrderScreen
      customers={customers}
      payerCustomer={payerCustomer}
      openOrder={checkoutOpenOrder}
      showAcceptedConfirmation={state.checkoutJustSavedOpenOrderId === checkoutOpenOrder?.id}
      showCheckoutCompletion={state.checkoutJustCompletedOpenOrderId === checkoutOpenOrder?.id}
      order={state.order}
      onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
      onBackToOpenOrder={(openOrderId) => dispatch({ type: "openOrderDetails", openOrderId })}
      onSaveDraftOrder={saveDraftOrder}
      onCompleteOpenOrderCheckout={completeOpenOrderCheckout}
      onEditOpenOrder={(openOrderId) => dispatch({ type: "openOrderForEdit", openOrderId })}
      onCancelOpenOrder={(openOrderId) => dispatch({ type: "cancelOpenOrder", openOrderId })}
      onCompleteOpenOrderPickup={(openOrderId) => dispatch({ type: "completeOpenOrderPickup", openOrderId })}
    />
  );
}
