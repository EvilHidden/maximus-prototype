import { HomeScreen } from "../../screens/HomeScreen";
import { CustomerScreen } from "../../screens/CustomerScreen";
import { OrderScreen } from "../../screens/OrderScreen";
import { MeasurementsScreen } from "../../screens/MeasurementsScreen";
import { OpenOrdersScreen } from "../../screens/OpenOrdersScreen";
import { AppointmentsScreen } from "../../screens/AppointmentsScreen";
import { CheckoutScreen } from "../../screens/CheckoutScreen";
import type { useAppController } from "./useAppController";

type AppController = ReturnType<typeof useAppController>;

export function AppScreenContent({
  state,
  dispatch,
  referenceData,
  customers,
  customerOrders,
  appointments,
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
}: AppController) {
  if (state.screen === "home") {
    return (
      <HomeScreen
        appointments={appointments}
        pickupAppointments={pickupAppointments}
        onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
        onStartWorkflow={startWorkflow}
        onOpenAppointment={openWorkflowAppointment}
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
        onDeleteCustomer={(customerId) => dispatch({ type: "deleteCustomer", customerId })}
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
        dispatch={dispatch}
        onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
        onCompleteOrder={completeOrder}
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
        onCreateDraftSet={createDraftMeasurements}
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
        openOrders={state.openOrders}
        closedOrderHistory={closedOrderHistory}
        pickupAppointments={pickupAppointments}
        pickupLocations={referenceData.pickupLocations}
        onMarkOpenOrderPickupReady={(openOrderId, pickupId) => dispatch({ type: "markOpenOrderPickupReady", openOrderId, pickupId })}
        onStartNewOrder={() => startWorkflow("alteration")}
      />
    );
  }

  if (state.screen === "appointments") {
    return <AppointmentsScreen appointments={appointments} />;
  }

  return (
    <CheckoutScreen
      payerCustomer={payerCustomer}
      order={state.order}
      onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
      onCompleteOrder={completeOrder}
    />
  );
}
