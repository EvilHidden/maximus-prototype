import {
  CalendarDays,
  ClipboardList,
  Ellipsis,
  Home,
  Menu,
  Monitor,
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
import { ActionButton, SelectionChip, cx } from "../ui/primitives";

type AppShellProps = {
  screen: Screen;
  onScreenChange: (screen: Screen) => void;
  themePreference: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
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

const screenLabels: Record<Screen, string> = {
  home: "Home",
  customer: "Customers",
  openOrders: "Orders",
  appointments: "Appointments",
  order: "Order Builder",
  measurements: "Measurements",
  checkout: "Checkout",
  orderDetails: "Order details",
};

const themeOptions = [
  { key: "light" as const, label: "Light", Icon: Sun },
  { key: "dark" as const, label: "Dark", Icon: Moon },
  { key: "system" as const, label: "System", Icon: Monitor },
];

export function AppShell({ themePreference, onThemeChange, screen, onScreenChange, children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const primaryNavItems = navItems.filter((item) =>
    ["home", "customer", "openOrders", "appointments"].includes(item.key),
  );

  const utilityNavItems = navItems.filter((item) => !primaryNavItems.some((primaryItem) => primaryItem.key === item.key));

  const getActiveNavScreen = (value: Screen) => {
    if (value === "orderDetails") {
      return "openOrders";
    }

    return value;
  };

  const activeNavScreen = getActiveNavScreen(screen);
  const activeNavLabel = screenLabels[screen];
  const mobileMoreActive =
    utilityNavItems.some((item) => item.key === activeNavScreen) || screen === "checkout" || screen === "orderDetails";

  const handleScreenChange = (nextScreen: Screen) => {
    onScreenChange(nextScreen);
    setMobileNavOpen(false);
  };

  const themeControl = (
    <div className="flex flex-wrap gap-2">
      {themeOptions.map(({ key, label, Icon }) => (
        <SelectionChip
          key={key}
          selected={themePreference === key}
          onClick={() => onThemeChange(key)}
          leading={<Icon className="h-3.5 w-3.5" />}
          size="sm"
        >
          {label}
        </SelectionChip>
      ))}
    </div>
  );

  return (
    <div className="app-shell">
      <div className="app-mobile-topbar">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="app-mobile-topbar__menu"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <div className="app-text-overline">Workspace</div>
        </div>
        <div className="ml-auto">{themeControl}</div>
      </div>

      {mobileNavOpen ? (
        <div className="app-mobile-drawer">
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
                <div className="app-text-overline mt-1">Touch workspace</div>
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
              <div className="app-text-overline px-2 pb-2 pt-1">All screens</div>
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

            <div className="mt-3">
              <div className="app-text-overline mb-2 px-1">Theme</div>
              {themeControl}
            </div>
          </aside>
        </div>
      ) : null}

      <div className="app-shell-grid">
        <aside className="app-sidebar h-full min-h-0 flex-col rounded-[14px] border border-[var(--app-border)]/70 p-3">
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

          <div className="mt-3">
            <div className="app-text-overline mb-2 px-1">Theme</div>
            {themeControl}
          </div>
        </aside>

        <main className="app-main h-full overflow-x-hidden overflow-y-auto rounded-[14px] border border-[var(--app-border)]/55">
          {children}
        </main>
      </div>

      <nav className="app-mobile-tabbar" aria-label="Primary navigation">
        {primaryNavItems.map((item) => {
          const Icon = navIcons[item.key];
          const isActive = activeNavScreen === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleScreenChange(item.key)}
              className={cx("app-mobile-tabbar__item", isActive ? "app-mobile-tabbar__item--active" : "")}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-[1.05rem] w-[1.05rem] shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className={cx("app-mobile-tabbar__item", mobileMoreActive ? "app-mobile-tabbar__item--active" : "")}
          aria-label="More screens"
          aria-expanded={mobileNavOpen}
        >
          <Ellipsis className="h-[1.05rem] w-[1.05rem] shrink-0" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
