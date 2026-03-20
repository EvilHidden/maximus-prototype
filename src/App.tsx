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

  const saveMeasurementSet = (mode: "draft" | "saved", title: string) => {
    if (!state.selectedCustomerId) {
      return;
    }

    const now = new Date();
    const dateLabel = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
    }).format(now);

    let nextMeasurementSetId: string | null = null;

    setMeasurementSets((currentSets) => {
      const currentSet = currentSets.find((set) => set.id === state.order.custom.linkedMeasurementSetId) ?? null;
      const sameCustomerCurrentSet = currentSet?.customerId === state.selectedCustomerId ? currentSet : null;
      const normalizedTitle = title.trim() || (mode === "draft" ? "Draft set" : "Saved set");

      if (mode === "draft" && sameCustomerCurrentSet?.isDraft) {
        nextMeasurementSetId = sameCustomerCurrentSet.id;
        return currentSets.map((set) =>
          set.id === sameCustomerCurrentSet.id
            ? {
                ...set,
                note: `${dateLabel} • ${normalizedTitle}`,
                values: { ...state.order.custom.measurements },
                isDraft: true,
                suggested: false,
              }
            : set,
        );
      }

      if (mode === "saved" && sameCustomerCurrentSet && !sameCustomerCurrentSet.isDraft && sameCustomerCurrentSet.label.startsWith("Version ")) {
        nextMeasurementSetId = sameCustomerCurrentSet.id;
        return currentSets.map((set) => {
          if (set.customerId !== state.selectedCustomerId) {
            return set;
          }

          if (set.id === sameCustomerCurrentSet.id) {
            return {
              ...set,
              note: `${dateLabel} • ${normalizedTitle}`,
              values: { ...state.order.custom.measurements },
              isDraft: false,
              suggested: true,
            };
          }

          return {
            ...set,
            suggested: false,
          };
        });
      }

      if (mode === "saved") {
        const nextVersion =
          currentSets
            .filter((set) => set.customerId === state.selectedCustomerId)
            .reduce((maxVersion, set) => {
              const match = set.label.match(/^Version (\d+)$/);
              return match ? Math.max(maxVersion, Number.parseInt(match[1], 10)) : maxVersion;
            }, 0) + 1;

        if (sameCustomerCurrentSet?.isDraft) {
          nextMeasurementSetId = sameCustomerCurrentSet.id;
          return currentSets.map((set) => {
            if (set.customerId !== state.selectedCustomerId) {
              return set;
            }

            if (set.id === sameCustomerCurrentSet.id) {
              return {
                ...set,
                label: `Version ${nextVersion}`,
                note: `${dateLabel} • ${normalizedTitle}`,
                values: { ...state.order.custom.measurements },
                isDraft: false,
                suggested: true,
              };
            }

            return {
              ...set,
              suggested: false,
            };
          });
        }

        nextMeasurementSetId = `SET-${state.selectedCustomerId}-V${nextVersion}-${now.getTime()}`;

        const nextSet: MeasurementSet = {
          id: nextMeasurementSetId,
          customerId: state.selectedCustomerId,
          label: `Version ${nextVersion}`,
          note: `${dateLabel} • ${normalizedTitle}`,
          values: { ...state.order.custom.measurements },
          isDraft: false,
          suggested: true,
        };

        return [
          ...currentSets.map((set) =>
            set.customerId === state.selectedCustomerId
              ? {
                  ...set,
                  suggested: false,
                }
              : set,
          ),
          nextSet,
        ];
      }

      nextMeasurementSetId = `SET-${state.selectedCustomerId}-DRAFT-${now.getTime()}`;

      const draftSet: MeasurementSet = {
        id: nextMeasurementSetId,
        customerId: state.selectedCustomerId,
        label: "Draft",
        note: `${dateLabel} • ${normalizedTitle}`,
        values: { ...state.order.custom.measurements },
        isDraft: true,
        suggested: false,
      };

      return [...currentSets, draftSet];
    });

    if (nextMeasurementSetId) {
      dispatch({ type: "linkMeasurementSet", measurementSetId: nextMeasurementSetId });
    }
  };

  const deleteMeasurementSet = (measurementSetId: string) => {
    setMeasurementSets((currentSets) => currentSets.filter((set) => set.id !== measurementSetId));

    if (state.order.custom.linkedMeasurementSetId === measurementSetId) {
      dispatch({
        type: "linkMeasurementSet",
        measurementSetId: Object.values(state.order.custom.measurements).some((value) => value.trim().length > 0) ? "draft-entry" : null,
      });
    }
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
          onSelectCustomer={(customerId) => dispatch({ type: "setCustomer", customerId })}
          onUpdateMeasurement={(field, value) => dispatch({ type: "updateMeasurements", field, value })}
          onReplaceMeasurements={(values, measurementSetId) => dispatch({ type: "replaceMeasurements", values, measurementSetId })}
          onLinkMeasurementSet={(measurementSetId) => dispatch({ type: "linkMeasurementSet", measurementSetId })}
          onSaveMeasurementSet={saveMeasurementSet}
          onDeleteMeasurementSet={deleteMeasurementSet}
          onScreenChange={(screen) => dispatch({ type: "setScreen", screen })}
        />
      );
    }

    return (
      <CheckoutScreen
        selectedCustomer={selectedCustomer}
        measurementSets={measurementSets}
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
