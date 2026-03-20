import { Moon, Sun } from "lucide-react";
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

export function AppShell({ themeLabel, onToggleTheme, screen, onScreenChange, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="grid h-full grid-cols-[220px_minmax(0,1fr)]">
        <aside className="app-sidebar flex h-full w-52 shrink-0 flex-col gap-2 p-3">
          <div className="mb-1 flex items-center justify-between gap-2 border-b border-[var(--app-border)] px-3 py-2">
            <div>
              <div className="text-sm font-semibold text-[var(--app-text)]">SAMEpage Tailor OS</div>
              <div className="text-xs text-[var(--app-text-muted)]">Operations</div>
            </div>
            <ActionButton tone="secondary" onClick={onToggleTheme} className="flex items-center gap-1.5 px-2.5 py-2 text-xs shadow-none">
              {themeLabel === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </ActionButton>
          </div>

          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onScreenChange(item.key)}
              className={cx(
                "w-full px-3 py-3 text-left text-sm font-medium transition",
                screen === item.key ? "app-btn app-btn--primary" : "app-btn app-btn--quiet",
              )}
            >
              {item.label}
            </button>
          ))}
        </aside>

        <main className="app-main h-full overflow-auto p-4 md:p-5">{children}</main>
      </div>
    </div>
  );
}
