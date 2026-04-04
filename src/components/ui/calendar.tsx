import type { ReactNode } from "react";
import { cx } from "./utils";

type CalendarDayCardProps = {
  dayNumber: number;
  isSelected: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
  itemCount?: number;
  onClick: () => void;
  children: ReactNode;
};

export function CalendarDayCard({
  dayNumber,
  isSelected,
  isToday,
  isCurrentMonth,
  itemCount = 0,
  onClick,
  children,
}: CalendarDayCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex min-h-[104px] flex-col items-stretch justify-start rounded-[var(--app-radius-md)] border px-2 py-1.5 text-left align-top transition-colors",
        isSelected
          ? "border-[var(--app-accent)] bg-[var(--app-surface)] shadow-[inset_0_0_0_1px_var(--app-accent)]"
          : isToday
            ? "border-[var(--app-border-strong)] bg-[var(--app-surface)]"
            : isCurrentMonth
              ? "border-[var(--app-border)]/75 bg-[var(--app-surface)]"
              : "border-[var(--app-border)]/45 bg-[var(--app-surface-muted)]/16 opacity-60",
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className={isSelected || isToday ? "app-text-strong" : "app-text-body font-medium"}>{dayNumber}</div>
        {itemCount > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--app-accent)]/12 px-1.5 text-[10px] font-semibold text-[var(--app-text)]">
            {itemCount}
          </span>
        ) : null}
      </div>
      {children}
    </button>
  );
}
