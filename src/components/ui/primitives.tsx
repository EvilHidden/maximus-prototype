import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import type { StatusTone } from "../../types";
import type { DefinitionItem } from "./types";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type CardProps = {
  children: ReactNode;
  className?: string;
};

type SurfaceTone = "card" | "control" | "work" | "support";

type SurfaceProps = {
  children: ReactNode;
  className?: string;
  tone?: SurfaceTone;
  as?: "div" | "section" | "aside";
};

type SectionHeaderProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

type SurfaceHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  meta?: ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  iconStyle?: CSSProperties;
};

type CalloutTone = "default" | "warn" | "success" | "danger";

type CalloutProps = {
  title?: ReactNode;
  children?: ReactNode;
  icon?: LucideIcon;
  tone?: CalloutTone;
  action?: ReactNode;
  className?: string;
};

type StatusPillProps = {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
};

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "quiet";
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

type InlineEmptyStateProps = {
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

type FieldStackProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

type SearchFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  icon?: LucideIcon;
};

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
};

type InspectorListProps = {
  items: DefinitionItem[];
  className?: string;
};

type CalendarDayCardProps = {
  dayNumber: number;
  isSelected: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
  hasItems: boolean;
  onClick: () => void;
  children: ReactNode;
};

const surfaceToneClasses: Record<SurfaceTone, string> = {
  card: "app-card",
  control: "app-control-deck",
  work: "app-work-surface",
  support: "app-support-rail",
};

const calloutToneClasses: Record<CalloutTone, string> = {
  default: "app-callout app-callout--default",
  warn: "app-callout app-callout--warn",
  success: "app-callout app-callout--success",
  danger: "app-callout app-callout--danger",
};

export function Surface({ children, className = "", tone = "card", as = "section" }: SurfaceProps) {
  const Component = as;
  return <Component className={cx(surfaceToneClasses[tone], className)}>{children}</Component>;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <Surface tone="card" as="section" className={className}>
      {children}
    </Surface>
  );
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

export function SurfaceHeader({
  title,
  subtitle,
  icon: Icon,
  meta,
  className = "",
  titleClassName = "app-section-title",
  subtitleClassName = "app-section-copy",
  iconStyle,
}: SurfaceHeaderProps) {
  return (
    <div className={cx("flex items-start justify-between gap-3", className)}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="app-icon-chip" style={iconStyle}>
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
        <div>
          <div className={titleClassName}>{title}</div>
          {subtitle ? <div className={cx("mt-1", subtitleClassName)}>{subtitle}</div> : null}
        </div>
      </div>
      {meta ?? null}
    </div>
  );
}

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

export function FieldStack({ label, children, className = "" }: FieldStackProps) {
  return (
    <label className={cx("app-field-shell", className)}>
      <div className="app-text-overline">{label}</div>
      {children}
    </label>
  );
}

export function SearchField({
  label,
  value,
  onChange,
  placeholder,
  className = "",
  icon: Icon,
}: SearchFieldProps) {
  return (
    <FieldStack label={label} className={className}>
      <div className="app-field-control">
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-[var(--app-text-soft)]" /> : null}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="app-text-body min-w-0 flex-1 p-0"
        />
      </div>
    </FieldStack>
  );
}

export function SelectField({ label, value, onChange, children, className = "" }: SelectFieldProps) {
  return (
    <FieldStack label={label} className={className}>
      <div className="app-field-control">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="app-text-body min-w-0 flex-1 appearance-none pr-7"
        >
          {children}
        </select>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--app-text-soft)] pointer-events-none" />
      </div>
    </FieldStack>
  );
}

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
