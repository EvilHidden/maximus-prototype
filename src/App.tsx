import { useMemo, useReducer, useState } from "react";
import { appointments, customerOrders, customers, measurementSets as initialMeasurementSets } from "./data";
import { useThemePreference } from "./hooks/useThemePreference";
import type { Appointment, Customer, MeasurementSet, WorkflowMode } from "./types";
import { AppShell } from "./components/layout/AppShell";
import { HomeScreen } from "./screens/HomeScreen";
import { CustomerScreen } from "./screens/CustomerScreen";
import { OrderScreen } from "./screens/OrderScreen";
import { MeasurementsScreen } from "./screens/MeasurementsScreen";
import { CheckoutScreen } from "./screens/CheckoutScreen";
import { OpenOrdersScreen } from "./screens/OpenOrdersScreen";
import { AppointmentsScreen } from "./screens/AppointmentsScreen";
import { appReducer, createInitialAppState } from "./state/appState";
import { buildOpenOrder, getClosedOrderHistory, getOrderType } from "./features/order/selectors";
import { getOpenOrderPickupAppointments, getPickupAppointments } from "./features/home/selectors";
import {
  createDraftMeasurementSet,
  deleteMeasurementSetAndPreserveDraft,
  saveMeasurementSet,
} from "./features/measurements/service";

export default function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialAppState);
  const [measurementSets, setMeasurementSets] = useState<MeasurementSet[]>(initialMeasurementSets);
  const { theme, setTheme } = useThemePreference();
  const selectedCustomer = useMemo<Customer | null>(
    () => customers.find((customer) => customer.id === state.selectedCustomerId) ?? null,
    [state.selectedCustomerId],
  );
  const payerCustomer = useMemo<Customer | null>(
    () => customers.find((customer) => customer.id === state.order.payerCustomerId) ?? null,
    [state.order.payerCustomerId],
  );
  const orderType = getOrderType(state.order);
  const pickupAppointments = useMemo(() => getPickupAppointments(appointments), []);
  const openOrderPickupAppointments = useMemo(() => getOpenOrderPickupAppointments(state.openOrders), [state.openOrders]);
  const homePickupAppointments = useMemo(
    () => [...pickupAppointments, ...openOrderPickupAppointments],
    [pickupAppointments, openOrderPickupAppointments],
  );
  const closedOrderHistory = useMemo(() => getClosedOrderHistory(customers, customerOrders), []);

  const startWorkflow = (workflow: WorkflowMode) => {
    dispatch({ type: "clearOrder" });
    dispatch({ type: "activateWorkflow", workflow });
    dispatch({ type: "setScreen", screen: "order" });
  };

  const handleOpenAppointment = (appointment: Appointment) => {
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

  const handleSaveMeasurementSet = (mode: "draft" | "saved", title: string) => {
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

  const handleCreateDraftMeasurementSet = () => {
    const result = createDraftMeasurementSet(measurementSets, selectedCustomer);
    setMeasurementSets(result.measurementSets);
    dispatch({
      type: "replaceMeasurements",
      values: result.values,
      measurementSetId: result.linkedMeasurementSetId || null,
    });
  };

  const handleDeleteMeasurementSet = (measurementSetId: string) => {
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

  const handleCompleteOrder = (paymentStatus: "pay_later" | "prepaid") => {
    const openOrder = buildOpenOrder(state.order, customers, paymentStatus);
    if (!openOrder) {
      return;
    }

    dispatch({ type: "completeOpenOrder", openOrder });
  };

  const content = useMemo(() => {
    if (state.screen === "home") {
      return (
        <HomeScreen
          appointments={appointments}
          pickupAppointments={homePickupAppointments}
          onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
          onStartWorkflow={startWorkflow}
          onOpenAppointment={handleOpenAppointment}
        />
      );
    }

    if (state.screen === "customer") {
      return (
        <CustomerScreen
          measurementSets={measurementSets}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={(customer) => dispatch({ type: "setCustomer", customerId: customer.id })}
          onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
        />
      );
    }

    if (state.screen === "order") {
      return (
        <OrderScreen
          customers={customers}
          measurementSets={measurementSets}
          payerCustomer={payerCustomer}
          order={state.order}
          dispatch={dispatch}
          onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
          onCompleteOrder={handleCompleteOrder}
        />
      );
    }

    if (state.screen === "measurements") {
      return (
        <MeasurementsScreen
          customers={customers}
          selectedCustomer={selectedCustomer}
          measurementSets={measurementSets}
          order={state.order}
          onCreateDraftSet={handleCreateDraftMeasurementSet}
          onSelectCustomer={(customerId) => {
            dispatch({ type: "setCustomer", customerId });
            if (state.order.activeWorkflow === "custom") {
              dispatch({ type: "selectCustomWearer", customerId });
            }
          }}
          onUpdateMeasurement={(field, value) => dispatch({ type: "updateMeasurements", field, value })}
          onReplaceMeasurements={(values, measurementSetId) => dispatch({ type: "replaceMeasurements", values, measurementSetId })}
          onSaveMeasurementSet={handleSaveMeasurementSet}
          onDeleteMeasurementSet={handleDeleteMeasurementSet}
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
        onCompleteOrder={handleCompleteOrder}
      />
    );
  }, [measurementSets, state, selectedCustomer, payerCustomer, orderType, pickupAppointments]);

  return (
    <div data-theme={theme}>
      <AppShell
        themeLabel={theme}
        onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"))}
        screen={state.screen}
        onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
      >
        {content}
      </AppShell>
    </div>
  );
}
