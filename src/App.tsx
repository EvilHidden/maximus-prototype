import { useMemo, useReducer } from "react";
import { customers, measurementSets } from "./data";
import { useThemePreference } from "./hooks/useThemePreference";
import type { Customer, WorkflowMode } from "./types";
import { AppShell } from "./components/layout/AppShell";
import { HomeScreen } from "./screens/HomeScreen";
import { CustomerScreen } from "./screens/CustomerScreen";
import { OrderScreen } from "./screens/OrderScreen";
import { MeasurementsScreen } from "./screens/MeasurementsScreen";
import { CheckoutScreen } from "./screens/CheckoutScreen";
import { appReducer, createInitialAppState } from "./state/appState";
import { getOrderType } from "./features/order/selectors";

export default function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialAppState);
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

  const content = useMemo(() => {
    if (state.screen === "home") {
      return <HomeScreen onScreenChange={(screen) => dispatch({ type: "setScreen", screen })} onStartWorkflow={startWorkflow} />;
    }

    if (state.screen === "customer") {
      return (
        <CustomerScreen
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
          selectedCustomer={selectedCustomer}
          measurementSets={measurementSets}
          order={state.order}
          onUpdateMeasurement={(field, value) => dispatch({ type: "updateMeasurements", field, value })}
          onLinkMeasurementSet={(measurementSetId) => dispatch({ type: "linkMeasurementSet", measurementSetId })}
          onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
        />
      );
    }

    return <CheckoutScreen orderType={orderType} />;
  }, [state, selectedCustomer, orderType]);

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
