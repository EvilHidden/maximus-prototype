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
};

type MetricTileProps = {
  label: string;
  value: ReactNode;
};

type DefinitionListProps = {
  items: DefinitionItem[];
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return <div className={cx("rounded-3xl border border-slate-200 bg-white shadow-sm", className)}>{children}</div>;
}

export function SectionHeader({ icon: Icon, title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="formal-section-title text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="formal-section-copy text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {action ?? null}
    </div>
  );
}

export function StatusPill({ children, tone = "default" }: StatusPillProps) {
  const tones: Record<StatusTone, string> = {
    default: "border-slate-200 bg-slate-100 text-slate-700",
    dark: "border-slate-900 bg-slate-900 text-white",
    warn: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return <span className={cx("rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function ActionButton({
  tone = "secondary",
  fullWidth = false,
  className,
  children,
  ...props
}: ActionButtonProps) {
  const tones = {
    primary: "bg-slate-900 text-white border border-slate-900",
    secondary: "border border-slate-300 text-slate-700 bg-white",
    quiet: "border border-slate-200 text-slate-600 bg-slate-50",
  };

  return (
    <button
      className={cx(
        "rounded-2xl px-4 py-3 text-sm font-medium transition hover:bg-slate-50",
        tones[tone],
        tone === "primary" && "hover:bg-slate-800",
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function MetricTile({ label, value }: MetricTileProps) {
  return (
    <div className="profile-stat rounded-2xl bg-white p-3 text-sm">
      <div className="profile-stat-label text-slate-500">{label}</div>
      <div className="profile-stat-value font-semibold">{value}</div>
    </div>
  );
}

export function DefinitionList({ items, className = "" }: DefinitionListProps) {
  return (
    <div className={cx("grid grid-cols-2 gap-x-3 gap-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600", className)}>
      {items.map((item) => (
        <div key={item.label} className="contents">
          <div>{item.label}</div>
          <div className="text-right font-medium text-slate-900">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
