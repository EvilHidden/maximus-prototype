import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { DefinitionItem } from "./types";
import { cx } from "./utils";

type DefinitionListProps = {
  items: DefinitionItem[];
  className?: string;
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

type SummaryStackProps = {
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

type InspectorListProps = {
  items: DefinitionItem[];
  className?: string;
};

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

export function SummaryStack({ children, className = "" }: SummaryStackProps) {
  return <div className={cx("space-y-3", className)}>{children}</div>;
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
