import { useMemo, useReducer, useState } from "react";
import { customers, measurementSets as initialMeasurementSets } from "./data";
import { useThemePreference } from "./hooks/useThemePreference";
import type { Customer, MeasurementSet, WorkflowMode } from "./types";
import { AppShell } from "./components/layout/AppShell";
import { HomeScreen } from "./screens/HomeScreen";
import { CustomerScreen } from "./screens/CustomerScreen";
import { OrderScreen } from "./screens/OrderScreen";
import { MeasurementsScreen } from "./screens/MeasurementsScreen";
import { CheckoutScreen } from "./screens/CheckoutScreen";
import { appReducer, createInitialAppState } from "./state/appState";
import { getOrderType } from "./features/order/selectors";
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
  const orderType = getOrderType(state.order);

  const startWorkflow = (workflow: WorkflowMode) => {
    dispatch({ type: "clearOrder" });
    dispatch({ type: "activateWorkflow", workflow });
    dispatch({ type: "setScreen", screen: "order" });
  };

  const handleSaveMeasurementSet = (mode: "draft" | "saved", title: string) => {
    if (!selectedCustomer) {
      return;
    }

    const result = saveMeasurementSet(
      measurementSets,
      selectedCustomer,
      state.order.custom.linkedMeasurementSetId,
      state.order.custom.measurements,
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
      state.order.custom.linkedMeasurementSetId,
      selectedCustomer,
      state.order.custom.measurements,
    );
    setMeasurementSets(result.measurementSets);
    dispatch({ type: "linkMeasurementSet", measurementSetId: result.linkedMeasurementSetId });
  };

  const content = useMemo(() => {
    if (state.screen === "home") {
      return <HomeScreen onScreenChange={(screen) => dispatch({ type: "setScreen", screen })} onStartWorkflow={startWorkflow} />;
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
          selectedCustomer={selectedCustomer}
          order={state.order}
          dispatch={dispatch}
          onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
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
          onSelectCustomer={(customerId) => dispatch({ type: "setCustomer", customerId })}
          onUpdateMeasurement={(field, value) => dispatch({ type: "updateMeasurements", field, value })}
          onReplaceMeasurements={(values, measurementSetId) => dispatch({ type: "replaceMeasurements", values, measurementSetId })}
          onSaveMeasurementSet={handleSaveMeasurementSet}
          onDeleteMeasurementSet={handleDeleteMeasurementSet}
          onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
        />
      );
    }

    return (
      <CheckoutScreen
        selectedCustomer={selectedCustomer}
        order={state.order}
        onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
      />
    );
  }, [measurementSets, state, selectedCustomer, orderType]);

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
