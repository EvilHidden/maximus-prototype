import {
  CalendarDays,
  ClipboardList,
  Home,
  Menu,
  Moon,
  Package,
  Ruler,
  Sun,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { navItems } from "../../data";
import type { Screen } from "../../types";
import { ActionButton, cx } from "../ui/primitives";

type AppShellProps = {
  screen: Screen;
  onScreenChange: (screen: Screen) => void;
  themeLabel: string;
  onToggleTheme: () => void;
  children: ReactNode;
};

const navIcons = {
  home: Home,
  customer: Users,
  openOrders: Package,
  appointments: CalendarDays,
  order: ClipboardList,
  measurements: Ruler,
  checkout: Wallet,
  orderDetails: Package,
} satisfies Record<Screen, typeof Home>;

export function AppShell({ themeLabel, onToggleTheme, screen, onScreenChange, children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const getActiveNavScreen = (value: Screen) => {
    if (value === "orderDetails") {
      return "openOrders";
    }

    return value;
  };

  const handleScreenChange = (nextScreen: Screen) => {
    onScreenChange(nextScreen);
    setMobileNavOpen(false);
  };

  return (
    <div className="app-shell">
      <div className="app-mobile-topbar md:hidden">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="app-mobile-topbar__menu"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <div className="app-text-strong truncate">SAMEpage Tailor OS</div>
          <div className="app-text-overline mt-0.5">Operations</div>
        </div>
      </div>

      {mobileNavOpen ? (
        <div className="app-mobile-drawer md:hidden">
          <button
            type="button"
            className="app-mobile-drawer__scrim"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="app-mobile-drawer__panel">
            <div className="flex items-start justify-between gap-3 rounded-[12px] border border-[var(--app-border)]/55 bg-[color:color-mix(in_srgb,var(--app-surface-muted)_72%,var(--app-surface))] px-4 py-4">
              <div className="min-w-0">
                <div className="app-text-strong">SAMEpage Tailor OS</div>
                <div className="app-text-overline mt-1">Operations</div>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex-1 rounded-[12px] bg-[color:color-mix(in_srgb,var(--app-surface-muted)_40%,transparent)] p-2">
              <div className="app-text-overline px-2 pb-2 pt-1">Workspace</div>
              <div className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = navIcons[item.key];

                  return (
                    <button
                      key={item.key}
                      onClick={() => handleScreenChange(item.key)}
                      className={cx(
                        "flex w-full items-center gap-3 rounded-[12px] px-3.5 py-3 text-left transition",
                        getActiveNavScreen(screen) === item.key
                          ? "border border-[var(--app-accent)] bg-[var(--app-surface)] text-[var(--app-text)] shadow-[var(--app-shadow-sm)]"
                          : "border border-transparent bg-transparent text-[var(--app-text-muted)] hover:border-[var(--app-border)]/55 hover:bg-[var(--app-surface)]/42 hover:text-[var(--app-text)]",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="app-text-body font-medium">{item.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <ActionButton
              tone="secondary"
              onClick={onToggleTheme}
              className="mt-3 flex min-h-12 items-center gap-2 rounded-[12px] px-3.5 py-2.5 text-sm shadow-none"
            >
              {themeLabel === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {themeLabel === "dark" ? "Light mode" : "Dark mode"}
            </ActionButton>
          </aside>
        </div>
      ) : null}

      <div className="app-shell-grid">
        <aside className="app-sidebar hidden h-full min-h-0 flex-col rounded-[14px] border border-[var(--app-border)]/70 p-3 md:flex">
          <div className="rounded-[12px] border border-[var(--app-border)]/55 bg-[color:color-mix(in_srgb,var(--app-surface-muted)_72%,var(--app-surface))] px-4 py-4">
            <div className="app-text-strong">SAMEpage Tailor OS</div>
            <div className="app-text-overline mt-1">Operations</div>
          </div>

          <div className="mt-3 flex-1 rounded-[12px] bg-[color:color-mix(in_srgb,var(--app-surface-muted)_40%,transparent)] p-2">
            <div className="app-text-overline px-2 pb-2 pt-1">Workspace</div>
            <div className="space-y-1.5">
            {navItems.map((item) => (
              (() => {
                const Icon = navIcons[item.key];

                return (
                  <button
                    key={item.key}
                    onClick={() => handleScreenChange(item.key)}
                    className={cx(
                      "flex w-full items-center gap-3 rounded-[12px] px-3.5 py-3 text-left transition",
                      getActiveNavScreen(screen) === item.key
                        ? "border border-[var(--app-accent)] bg-[var(--app-surface)] text-[var(--app-text)] shadow-[var(--app-shadow-sm)]"
                        : "border border-transparent bg-transparent text-[var(--app-text-muted)] hover:border-[var(--app-border)]/55 hover:bg-[var(--app-surface)]/42 hover:text-[var(--app-text)]",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="app-text-body font-medium">{item.label}</div>
                  </button>
                );
              })()
            ))}
            </div>
          </div>

          <ActionButton
            tone="secondary"
            onClick={onToggleTheme}
            className="mt-3 flex min-h-12 items-center gap-2 rounded-[12px] px-3.5 py-2.5 text-sm shadow-none"
          >
            {themeLabel === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {themeLabel === "dark" ? "Light mode" : "Dark mode"}
          </ActionButton>
        </aside>

        <main className="app-main h-full overflow-x-hidden overflow-y-auto rounded-[14px] border border-[var(--app-border)]/55 p-3 [scrollbar-gutter:stable] sm:p-3.5 md:p-4 xl:p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
