import { useMemo, useState } from "react";
import { createInitialWorkflowDraft, customers } from "./data/fixtures";
import { useThemePreference } from "./hooks/useThemePreference";
import type { Customer, OrderType, Screen, WorkflowDraft } from "./types";
import { AppShell } from "./components/layout/AppShell";
import { HomeScreen } from "./screens/HomeScreen";
import { CustomerScreen } from "./screens/CustomerScreen";
import { OrderScreen } from "./screens/OrderScreen";
import { MeasurementsScreen } from "./screens/MeasurementsScreen";
import { CheckoutScreen } from "./screens/CheckoutScreen";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [draft, setDraft] = useState<WorkflowDraft>(() => createInitialWorkflowDraft());
  const { theme, setTheme } = useThemePreference();

  const updateDraft = (patch: Partial<WorkflowDraft>) => {
    setDraft((currentDraft) => ({ ...currentDraft, ...patch }));
  };

  const content = useMemo(() => {
    if (screen === "home") {
      return <HomeScreen onScreenChange={setScreen} onOrderTypeChange={(orderType) => updateDraft({ orderType, activeWorkflow: orderType })} />;
    }

    if (screen === "customer") {
      return <CustomerScreen selectedCustomer={selectedCustomer} onSelectCustomer={setSelectedCustomer} onScreenChange={setScreen} />;
    }

    if (screen === "order") {
      return (
        <OrderScreen
          draft={draft}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
          onDraftChange={updateDraft}
          onScreenChange={setScreen}
          onOrderTypeChange={(orderType: OrderType) => updateDraft({ orderType, activeWorkflow: orderType === "mixed" ? draft.activeWorkflow : orderType })}
        />
      );
    }

    if (screen === "measurements") {
      return <MeasurementsScreen selectedCustomer={selectedCustomer} draft={draft} onDraftChange={updateDraft} onScreenChange={setScreen} />;
    }

    return <CheckoutScreen orderType={draft.orderType} />;
  }, [draft, screen, selectedCustomer]);

  return (
    <div data-theme={theme}>
      <AppShell
        themeLabel={theme}
        onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"))}
        screen={screen}
        onScreenChange={setScreen}
      >
        {content}
      </AppShell>
    </div>
  );
}
