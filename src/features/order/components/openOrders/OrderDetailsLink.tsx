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
        "app-subtle-link inline-flex shrink-0 items-center gap-1 text-[0.75rem] font-medium leading-[1.35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]/35",
        className,
      )}
    >
      <span>{label}</span>
      <ChevronRight className="h-3.5 w-3.5" />
    </button>
  );
}
