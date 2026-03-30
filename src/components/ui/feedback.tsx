import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "./utils";

type CalloutTone = "default" | "warn" | "success" | "danger";

type CalloutProps = {
  title?: ReactNode;
  children?: ReactNode;
  icon?: LucideIcon;
  tone?: CalloutTone;
  action?: ReactNode;
  className?: string;
};

type EmptyStateProps = {
  children: ReactNode;
  className?: string;
};

type InlineEmptyStateProps = {
  children: ReactNode;
  className?: string;
};

const calloutToneClasses: Record<CalloutTone, string> = {
  default: "app-callout app-callout--default",
  warn: "app-callout app-callout--warn",
  success: "app-callout app-callout--success",
  danger: "app-callout app-callout--danger",
};

export function Callout({
  title,
  children,
  icon: Icon,
  tone = "default",
  action,
  className = "",
}: CalloutProps) {
  return (
    <div className={cx(calloutToneClasses[tone], className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0" /> : null}
          <div className="min-w-0">
            {title ? <div>{title}</div> : null}
            {children ? <div className={cx(title && "mt-2")}>{children}</div> : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({ children, className = "" }: EmptyStateProps) {
  return <div className={cx("app-empty-state", className)}>{children}</div>;
}

export function InlineEmptyState({ children, className = "" }: InlineEmptyStateProps) {
  return (
    <div
      className={cx(
        "rounded-[var(--app-radius-md)] border border-dashed border-[var(--app-border)]/70 bg-[var(--app-surface-muted)]/18 px-4 py-3 app-text-body-muted",
        className,
      )}
    >
      {children}
    </div>
  );
}
