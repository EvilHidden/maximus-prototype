import { Suspense } from "react";
import { AppShell } from "./components/layout/AppShell";
import { ToastProvider } from "./components/ui/toast";
import { useThemePreference } from "./hooks/useThemePreference";
import { AppScreenContent } from "./features/app/AppScreenContent";
import { useAppController } from "./features/app/useAppController";

export default function App() {
  const appController = useAppController();
  const { theme, setTheme } = useThemePreference();

  return (
    <div data-theme={theme}>
      <ToastProvider>
        <AppShell
          themeLabel={theme}
          onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"))}
          screen={appController.state.screen}
          onScreenChange={(screen) => appController.dispatch({ type: "setScreen", screen })}
        >
          <Suspense
            fallback={
              <div className="app-work-surface px-5 py-8">
                <div className="app-text-body-muted">Loading screen…</div>
              </div>
            }
          >
            <AppScreenContent {...appController} />
          </Suspense>
        </AppShell>
      </ToastProvider>
    </div>
  );
}
