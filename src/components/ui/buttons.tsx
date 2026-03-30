import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
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
}: QuickActionTileProps) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "group flex min-h-[112px] flex-col justify-between rounded-[var(--app-radius-md)] border border-[var(--app-border)]/55 bg-[var(--app-surface)]/18 px-4 py-4 text-left transition hover:bg-[var(--app-surface)]/34",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="app-icon-chip transition group-hover:border-[var(--app-border-strong)]" style={iconStyle}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="app-text-overline">{metaLabel}</span>
      </div>
      <div>
        <div className="app-text-value">{title}</div>
        <div className="app-text-caption mt-1">{subtitle}</div>
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
      ? "min-h-10 rounded-[var(--app-radius-sm)] px-3 py-2 text-[0.75rem] font-semibold tracking-[0.02em]"
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
