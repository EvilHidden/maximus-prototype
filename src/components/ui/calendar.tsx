import type { ReactNode } from "react";
import { cx } from "./utils";

type CalendarDayCardProps = {
  dayNumber: number;
  isSelected: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
  hasItems: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function CalendarDayCard({
  dayNumber,
  isSelected,
  isToday,
  isCurrentMonth,
  hasItems,
  onClick,
  children,
}: CalendarDayCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex min-h-[118px] flex-col items-stretch justify-start rounded-[var(--app-radius-md)] border px-2.5 py-2 text-left align-top transition-colors",
        isSelected
          ? "border-[var(--app-accent)] bg-[var(--app-surface)] shadow-[inset_0_0_0_1px_var(--app-accent)]"
          : isToday
            ? "border-[var(--app-border-strong)] bg-[var(--app-surface)]"
            : isCurrentMonth
              ? "border-[var(--app-border)]/75 bg-[var(--app-surface)]"
              : "border-[var(--app-border)]/45 bg-[var(--app-surface-muted)]/16 opacity-60",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className={isSelected || isToday ? "app-text-strong" : "app-text-body font-medium"}>{dayNumber}</div>
        {hasItems ? <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--app-accent)] opacity-70" /> : null}
      </div>
      {children}
    </button>
  );
}
