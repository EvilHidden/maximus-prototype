import { Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { navItems } from "../../data/fixtures";
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
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-900 transition-colors">
      <div className="grid h-full grid-cols-[220px_minmax(0,1fr)]">
        <aside className="flex h-full w-52 shrink-0 flex-col gap-2 border-r border-slate-200 bg-white p-3">
          <div className="mb-1 flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
            <div>
              <div className="text-sm font-semibold text-slate-900">SAMEpage Tailor OS</div>
              <div className="text-xs text-slate-500">Operations</div>
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
                "w-full rounded-2xl px-3 py-3 text-left text-sm font-medium transition",
                screen === item.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {item.label}
            </button>
          ))}
        </aside>

        <main className="h-full overflow-auto bg-slate-100 p-4 md:p-5">{children}</main>
      </div>
    </div>
  );
}
