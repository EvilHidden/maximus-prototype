import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { DefinitionItem, StatusTone } from "../../types";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type CardProps = {
  children: ReactNode;
  className?: string;
};

type SectionHeaderProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

type StatusPillProps = {
  children: ReactNode;
  tone?: StatusTone;
};

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "quiet";
  fullWidth?: boolean;
  disabledReason?: string;
  onDisabledPress?: (reason: string) => void;
};

type DefinitionListProps = {
  items: DefinitionItem[];
  className?: string;
};

type ModalShellProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  showCloseButton?: boolean;
  widthClassName?: string;
  children: ReactNode;
  footer?: ReactNode;
};

type PanelSectionProps = {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

type EntityRowProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  onClick?: () => void;
  className?: string;
};

type EmptyStateProps = {
  children: ReactNode;
  className?: string;
};

type WorkflowToggleProps = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  isActive: boolean;
  isEnabled?: boolean;
  onClick: () => void;
};

type SummaryStackProps = {
  children: ReactNode;
  className?: string;
};

type FieldLabelProps = {
  children: ReactNode;
};

type InspectorListProps = {
  items: DefinitionItem[];
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return <section className={cx("app-card", className)}>{children}</section>;
}

export function SectionHeader({ icon: Icon, title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="app-icon-chip">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="app-section-title">{title}</h2>
          {subtitle ? <p className="app-section-copy">{subtitle}</p> : null}
        </div>
      </div>
      {action ?? null}
    </div>
  );
}

export function StatusPill({ children, tone = "default" }: StatusPillProps) {
  const tones: Record<StatusTone, string> = {
    default: "app-pill app-pill--default",
    dark: "app-pill app-pill--dark",
    warn: "app-pill app-pill--warn",
    success: "app-pill app-pill--success",
    danger: "app-pill app-pill--danger",
  };

  return <span className={tones[tone]}>{children}</span>;
}

export function ActionButton({
  tone = "secondary",
  fullWidth = false,
  className,
  children,
  disabledReason,
  onDisabledPress,
  disabled,
  onClick,
  ...props
}: ActionButtonProps) {
  const tones = {
    primary: "app-btn app-btn--primary",
    secondary: "app-btn app-btn--secondary",
    quiet: "app-btn app-btn--quiet",
  };

  const isGuarded = Boolean(disabled);

  return (
    <button
      className={cx(
        "app-text-body font-medium",
        tones[tone],
        isGuarded && "app-btn--disabled",
        fullWidth && "w-full",
        className,
      )}
      aria-disabled={isGuarded}
      onClick={(event) => {
        if (isGuarded) {
          event.preventDefault();
          event.stopPropagation();
          if (disabledReason && onDisabledPress) {
            onDisabledPress(disabledReason);
          }
          return;
        }

        onClick?.(event);
      }}
      {...props}
      disabled={false}
    >
      {children}
    </button>
  );
}

export function DefinitionList({ items, className = "" }: DefinitionListProps) {
  return (
    <div className={cx("app-definition-list", className)}>
      {items.map((item) => (
        <div key={item.label} className="contents">
          <div className="app-text-caption">{item.label}</div>
          <div className="app-text-body text-right font-medium">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

export function ModalShell({
  title,
  subtitle,
  onClose,
  showCloseButton = true,
  widthClassName = "max-w-[520px]",
  children,
  footer,
}: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="app-modal-scrim absolute inset-0" onClick={onClose} />
      <div className={cx("app-modal absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2", widthClassName)}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="app-section-title">{title}</div>
            {subtitle ? <div className="app-section-copy">{subtitle}</div> : null}
          </div>
          {showCloseButton ? (
            <ActionButton tone="secondary" onClick={onClose} className="px-3 py-2 text-xs">
              Close
            </ActionButton>
          ) : null}
        </div>
        <div>{children}</div>
        {footer ? <div className="mt-4 border-t border-[var(--app-border)] pt-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function PanelSection({ title, action, children, className = "" }: PanelSectionProps) {
  return (
    <div className={cx("app-panel-section", className)}>
      {title || action ? (
        <div className="mb-3 flex items-start justify-between gap-3">
          {title ? <div className="app-kicker">{title}</div> : <span />}
          {action ?? null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function EntityRow({ title, subtitle, meta, action, onClick, className = "" }: EntityRowProps) {
  const content = (
    <div className={cx("app-entity-row", className)}>
      <div className="min-w-0 flex-1">
        <div className="app-text-strong truncate">{title}</div>
        {subtitle ? <div className="app-text-caption mt-1">{subtitle}</div> : null}
      </div>
      {meta ? <div className="shrink-0 text-right">{meta}</div> : null}
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );

  if (!onClick) {
    return content;
  }

  return (
    <button className="w-full text-left" onClick={onClick}>
      {content}
    </button>
  );
}

export function EmptyState({ children, className = "" }: EmptyStateProps) {
  return <div className={cx("app-empty-state", className)}>{children}</div>;
}

export function WorkflowToggle({ icon: Icon, title, subtitle, isActive, isEnabled, onClick }: WorkflowToggleProps) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "app-workflow-toggle min-h-[104px] px-4 py-3.5 text-left",
        isActive && "app-workflow-toggle--active",
        !isActive && isEnabled && "app-workflow-toggle--enabled",
      )}
    >
      <Icon className="mb-2.5 h-4.5 w-4.5" />
      <div className="app-text-value">{title}</div>
      <div className="app-text-caption mt-1.5">{subtitle}</div>
    </button>
  );
}

export function SummaryStack({ children, className = "" }: SummaryStackProps) {
  return <div className={cx("space-y-3", className)}>{children}</div>;
}

export function FieldLabel({ children }: FieldLabelProps) {
  return <div className="app-field-label">{children}</div>;
}

export function InspectorList({ items, className = "" }: InspectorListProps) {
  return (
    <div className={cx("space-y-2", className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-3">
          <span className="app-text-body-muted">{item.label}</span>
          <span className="app-text-body font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
