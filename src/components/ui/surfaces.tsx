import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "./utils";

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

const surfaceToneClasses: Record<SurfaceTone, string> = {
  card: "app-card",
  control: "app-control-deck",
  work: "app-work-surface",
  support: "app-support-rail",
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
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="app-icon-chip shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="app-section-title">{title}</h2>
          {subtitle ? <p className="app-section-copy">{subtitle}</p> : null}
        </div>
      </div>
      <div className="self-start md:self-auto">{action ?? null}</div>
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
  subtitleClassName = "app-text-caption",
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
