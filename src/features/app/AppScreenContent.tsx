import { lazy } from "react";
import { HomeScreen } from "../../screens/HomeScreen";
import { CustomerScreen } from "../../screens/CustomerScreen";
import type { useAppController } from "./useAppController";

type AppController = ReturnType<typeof useAppController>;

const OrderScreen = lazy(async () => import("../../screens/OrderScreen").then((module) => ({ default: module.OrderScreen })));
const MeasurementsScreen = lazy(async () => import("../../screens/MeasurementsScreen").then((module) => ({ default: module.MeasurementsScreen })));
const OpenOrdersScreen = lazy(async () => import("../../screens/OpenOrdersScreen").then((module) => ({ default: module.OpenOrdersScreen })));
const AppointmentsScreen = lazy(async () => import("../../screens/AppointmentsScreen").then((module) => ({ default: module.AppointmentsScreen })));
const ReviewOrderScreen = lazy(async () => import("../../screens/CheckoutScreen").then((module) => ({ default: module.ReviewOrderScreen })));
const OrderDetailsScreen = lazy(async () => import("../../screens/OrderDetailsScreen").then((module) => ({ default: module.OrderDetailsScreen })));

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
  saveEditedOrder,
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
        onCheckoutReadyPickup={(openOrderId) => dispatch({ type: "openOrderDetails", openOrderId })}
        onCompleteReadyPickup={(openOrderId) => dispatch({ type: "completeOpenOrderPickup", openOrderId })}
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
        onBackToOrderDetails={state.editingOpenOrderId !== null
          ? () => dispatch({ type: "openOrderDetails", openOrderId: state.editingOpenOrderId! })
          : undefined}
        onOpenDraftCheckout={() => dispatch({ type: "openCheckoutForDraft" })}
        onSaveDraftOrder={saveDraftOrder}
        onSaveEditedOrder={saveEditedOrder}
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
        onAddCustomer={(customer) => dispatch({ type: "addCustomer", customer })}
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
        requestedCheckoutPaymentMode={state.checkoutRequestedPaymentMode}
        onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
        onDismissRequestedCheckoutPayment={() => dispatch({ type: "clearCheckoutPaymentRequest" })}
        onRevertAcceptedOrderSave={(openOrderId) => dispatch({ type: "revertAcceptedOrderSave", openOrderId })}
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
      requestedCheckoutPaymentMode={state.checkoutRequestedPaymentMode}
      order={state.order}
      onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
      onDismissRequestedCheckoutPayment={() => dispatch({ type: "clearCheckoutPaymentRequest" })}
      onRevertAcceptedOrderSave={(openOrderId) => dispatch({ type: "revertAcceptedOrderSave", openOrderId })}
      onBackToOpenOrder={(openOrderId) => dispatch({ type: "openOrderDetails", openOrderId })}
      onSaveDraftOrder={saveDraftOrder}
      onCompleteOpenOrderCheckout={completeOpenOrderCheckout}
      onEditOpenOrder={(openOrderId) => dispatch({ type: "openOrderForEdit", openOrderId })}
      onCancelOpenOrder={(openOrderId) => dispatch({ type: "cancelOpenOrder", openOrderId })}
      onCompleteOpenOrderPickup={(openOrderId) => dispatch({ type: "completeOpenOrderPickup", openOrderId })}
    />
  );
}
