import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import type { StatusTone } from "../../types";
import { cx } from "./utils";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "quiet" | "danger";
  fullWidth?: boolean;
  disabledReason?: string;
};

type QuickActionTileProps = {
  title: ReactNode;
  subtitle: ReactNode;
  icon: LucideIcon;
  iconStyle?: CSSProperties;
  metaLabel?: ReactNode;
  onClick: () => void;
  className?: string;
  size?: "default" | "compact";
};

type SelectionChipProps = {
  children: ReactNode;
  selected?: boolean;
  onClick: () => void;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  size?: "sm" | "md";
};

type StatusPillProps = {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
};

export function QuickActionTile({
  title,
  subtitle,
  icon: Icon,
  iconStyle,
  metaLabel = "Open",
  onClick,
  className = "",
  size = "default",
}: QuickActionTileProps) {
  const sizeClassName =
    size === "compact"
      ? "min-h-[84px] px-3 py-3 sm:min-h-[88px] sm:px-3.25 sm:py-3.25 xl:min-h-[112px] xl:px-5 xl:py-4.5"
      : "min-h-[92px] px-3.5 py-3.5 sm:min-h-[104px] sm:px-4 sm:py-4 lg:min-h-[112px] lg:px-5 lg:py-4.5";

  return (
    <button
      onClick={onClick}
      className={cx(
        "group flex flex-col justify-between gap-2 rounded-[var(--app-radius-md)] border border-[var(--app-border)]/62 bg-[var(--app-surface)] text-left shadow-[var(--app-shadow-sm)] transition hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-muted)] sm:gap-2.5",
        sizeClassName,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="app-icon-chip h-9 w-9 shrink-0 transition group-hover:border-[var(--app-border-strong)] [&_svg]:h-4.5 [&_svg]:w-4.5 sm:h-10 sm:w-10 sm:[&_svg]:h-5 sm:[&_svg]:w-5"
          style={iconStyle}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span className="app-text-overline hidden pt-1 text-[var(--app-text-soft)] sm:block">{metaLabel}</span>
      </div>
      <div className="space-y-1 pt-0.5">
        <div className="app-text-value text-[0.98rem] leading-tight sm:text-[1.02rem]">{title}</div>
        <div className="app-text-caption max-w-[22ch] text-[0.73rem] sm:text-[0.76rem]">{subtitle}</div>
      </div>
    </button>
  );
}

export function SelectionChip({
  children,
  selected = false,
  onClick,
  leading,
  trailing,
  className = "",
  size = "md",
}: SelectionChipProps) {
  const sizeClassName =
    size === "sm"
      ? "min-h-9 rounded-[var(--app-radius-sm)] px-2.75 py-1.75 text-[0.72rem] font-semibold tracking-[0.02em]"
      : "min-h-10 rounded-[var(--app-radius-md)] px-3.5 py-2 text-sm font-medium";

  return (
    <button
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-2 border transition",
        sizeClassName,
        selected
          ? "border-[var(--app-border-strong)] bg-[var(--app-surface)] text-[var(--app-text)] shadow-[var(--app-shadow-sm)]"
          : "border-[var(--app-border)] bg-transparent text-[var(--app-text-muted)] hover:text-[var(--app-text)]",
        className,
      )}
    >
        {leading ? <span className="shrink-0">{leading}</span> : null}
        <span>{children}</span>
        {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </button>
  );
}

export function StatusPill({ children, tone = "default", className }: StatusPillProps) {
  const tones: Record<StatusTone, string> = {
    default: "app-pill app-pill--default",
    dark: "app-pill app-pill--dark",
    warn: "app-pill app-pill--warn",
    success: "app-pill app-pill--success",
    danger: "app-pill app-pill--danger",
  };

  return <span className={cx(tones[tone], className)}>{children}</span>;
}

export function ActionButton({
  tone = "secondary",
  fullWidth = false,
  className,
  children,
  disabledReason,
  disabled,
  ...props
}: ActionButtonProps) {
  const tones = {
    primary: "app-btn app-btn--primary",
    secondary: "app-btn app-btn--secondary",
    quiet: "app-btn app-btn--quiet",
    danger: "app-btn app-btn--danger",
  };

  const isDisabled = Boolean(disabled);

  return (
    <button
      className={cx(
        "app-text-body font-medium",
        tones[tone],
        isDisabled && "app-btn--disabled",
        fullWidth && "w-full",
        className,
      )}
      title={isDisabled && disabledReason && !props.title ? disabledReason : props.title}
      {...props}
      disabled={isDisabled}
    >
      {children}
    </button>
  );
}

export function RowChevronAffordance({ hideAboveDesktop = false }: { hideAboveDesktop?: boolean }) {
  return (
    <div
      className={cx(
        "pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5",
        hideAboveDesktop && "app-hide-at-desktop",
      )}
      aria-hidden="true"
    >
      <div className="flex h-11 items-center gap-2 rounded-l-[var(--app-radius-sm)] bg-gradient-to-l from-[var(--app-surface)] via-[var(--app-surface)]/92 to-transparent pl-4 pr-0.5 transition group-hover:from-[var(--app-surface-muted)]/72 group-hover:via-[var(--app-surface-muted)]/42">
        <div className="h-9 w-px bg-[var(--app-border)]/55 transition group-hover:bg-[var(--app-text-soft)]/45" />
        <ChevronRight className="h-4 w-4 text-[var(--app-text-soft)] transition group-hover:text-[var(--app-text)]" />
      </div>
    </div>
  );
}
