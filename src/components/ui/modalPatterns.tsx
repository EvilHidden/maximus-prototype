import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "./primitives";

type ModalPanelProps = {
  children: ReactNode;
  className?: string;
  tone?: "default" | "muted";
};

type ModalSectionHeadingProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

type ModalSummaryCardProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  aside?: ReactNode;
  className?: string;
  tone?: "default" | "muted";
};

type ModalMetaItem = {
  icon?: LucideIcon;
  content: ReactNode;
};

type ModalMetaRowProps = {
  items: ModalMetaItem[];
  className?: string;
};

type ModalFooterActionsProps = {
  leading?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ModalPanel({ children, className = "", tone = "default" }: ModalPanelProps) {
  return (
    <div
      className={cx(
        "app-modal-panel",
        tone === "muted" && "app-modal-panel--muted",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ModalSectionHeading({
  eyebrow,
  title,
  description,
  action,
  className = "",
}: ModalSectionHeadingProps) {
  return (
    <div className={cx("app-modal-section-heading", className)}>
      <div className="min-w-0">
        {eyebrow ? <div className="app-text-overline">{eyebrow}</div> : null}
        <div className={cx(eyebrow ? "mt-1" : "", "app-text-strong")}>{title}</div>
        {description ? <div className="mt-1 app-text-caption">{description}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function ModalSummaryCard({
  eyebrow,
  title,
  description,
  meta,
  aside,
  className = "",
  tone = "default",
}: ModalSummaryCardProps) {
  return (
    <div
      className={cx(
        "app-modal-summary",
        tone === "muted" && "app-modal-summary--muted",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {eyebrow ? <div className="app-text-overline">{eyebrow}</div> : null}
          <div className={cx(eyebrow ? "mt-1" : "", "app-text-value")}>{title}</div>
          {description ? <div className="mt-1.5 app-text-body">{description}</div> : null}
          {meta ? <div className="mt-2.5">{meta}</div> : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
    </div>
  );
}

export function ModalMetaRow({ items, className = "" }: ModalMetaRowProps) {
  return (
    <div className={cx("app-modal-meta-row", className)}>
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={index} className="app-modal-meta-item app-text-caption">
            {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--app-text-soft)]" /> : null}
            <span>{item.content}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ModalFooterActions({ leading, children, className = "" }: ModalFooterActionsProps) {
  return (
    <div className={cx("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="min-h-0 min-w-0">{leading ?? <div />}</div>
      <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>
    </div>
  );
}
