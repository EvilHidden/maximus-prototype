import { ChevronRight } from "lucide-react";
import { cx } from "../../../../components/ui/primitives";

export function OrderDetailsLink({
  onClick,
  className,
  label = "Details",
}: {
  onClick: () => void;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex shrink-0 items-center gap-0.5 text-[0.75rem] font-medium leading-[1.35] text-[var(--app-text-muted)] transition-colors hover:text-[var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]/35",
        className,
      )}
    >
      <span>{label}</span>
      <ChevronRight className="h-3.5 w-3.5" />
    </button>
  );
}
