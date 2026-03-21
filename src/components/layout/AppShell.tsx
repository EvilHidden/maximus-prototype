import {
  CalendarDays,
  ClipboardList,
  Home,
  Moon,
  Package,
  Ruler,
  Sun,
  Users,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
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
} satisfies Record<Screen, typeof Home>;

export function AppShell({ themeLabel, onToggleTheme, screen, onScreenChange, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="grid h-full grid-cols-[228px_minmax(0,1fr)] gap-3 p-3">
        <aside className="app-sidebar flex h-full min-h-0 flex-col rounded-[14px] border border-[var(--app-border)]/70 p-3">
          <div className="rounded-[12px] border border-[var(--app-border)]/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] px-4 py-4">
            <div className="app-text-strong">SAMEpage Tailor OS</div>
            <div className="app-text-overline mt-1">Operations</div>
          </div>

          <div className="mt-3 flex-1 rounded-[12px] bg-[var(--app-surface)]/26 p-2">
            <div className="app-text-overline px-2 pb-2 pt-1">Workspace</div>
            <div className="space-y-1.5">
            {navItems.map((item) => (
              (() => {
                const Icon = navIcons[item.key];

                return (
                  <button
                    key={item.key}
                    onClick={() => onScreenChange(item.key)}
                    className={cx(
                      "flex w-full items-center gap-3 rounded-[12px] px-3.5 py-3 text-left transition",
                      screen === item.key
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

        <main className="app-main h-full overflow-x-hidden overflow-y-auto rounded-[14px] border border-[var(--app-border)]/55 p-4 [scrollbar-gutter:stable] md:p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
