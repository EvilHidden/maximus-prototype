import type { ReactNode } from "react";
import { SurfaceHeader, cx } from "../../../../components/ui/primitives";
import type { LucideIcon } from "lucide-react";

export const OPEN_ORDER_ROW_GRID_CLASS =
  "grid gap-4 px-4 py-4 min-[1000px]:grid-cols-[minmax(0,0.78fr)_minmax(0,0.92fr)_7.25rem_5.5rem_7.75rem] min-[1000px]:items-start min-[1000px]:gap-x-4";
export const READY_ORDER_ROW_GRID_CLASS =
  "grid gap-4 px-4 py-3.5 min-[1000px]:grid-cols-[minmax(0,1.2fr)_minmax(0,1.05fr)_7.25rem_5.5rem_7.75rem] min-[1000px]:items-start min-[1000px]:gap-x-4";
export const NEEDS_ATTENTION_ROW_GRID_CLASS =
  "hidden min-[1000px]:grid min-[1000px]:gap-3 min-[1000px]:grid-cols-[minmax(0,0.62fr)_minmax(0,0.92fr)_7.25rem_5.5rem_8.25rem] min-[1000px]:items-start min-[1000px]:gap-x-4";
export const CLOSED_ORDER_ROW_GRID_CLASS =
  "grid gap-4 px-4 py-4 min-[1000px]:grid-cols-[minmax(0,0.82fr)_minmax(0,1.08fr)_7.25rem_7.25rem] min-[1000px]:items-start min-[1000px]:gap-x-4";

function OpenOrdersColumnHeaderRow({
  columns,
  className,
  wrapperClassName = "px-4 py-2 pr-14",
}: {
  columns: ReactNode[];
  className: string;
  wrapperClassName?: string;
}) {
  return (
    <div className={cx("app-table-head hidden border-b border-[var(--app-border)]/35 min-[1000px]:block", wrapperClassName)}>
      <div className={className}>
        {columns}
      </div>
    </div>
  );
}

export function OpenOrdersPanelHeader({
  icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <SurfaceHeader
      icon={icon}
      title={title}
      subtitle={subtitle}
      className="pb-3"
      titleClassName="app-text-value"
      subtitleClassName="app-text-caption line-clamp-1"
    />
  );
}

export function OrdersSectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="px-4 py-4">
      <OpenOrdersPanelHeader icon={icon} title={title} subtitle={subtitle} />
    </div>
  );
}

export function OpenOrdersColumnHeader() {
  return (
    <OpenOrdersColumnHeaderRow
      className="grid gap-4 min-[1000px]:grid-cols-[minmax(0,0.78fr)_minmax(0,0.92fr)_7.25rem_5.5rem_7.75rem] min-[1000px]:items-start min-[1000px]:gap-x-4"
      columns={[
        <div key="customer" className="app-text-overline">Customer</div>,
        <div key="ready-by" className="app-text-overline">Ready by</div>,
        <div key="status" className="app-text-overline">Status</div>,
        <div key="action" aria-hidden="true" />,
        <div key="total" className="app-text-overline text-right">Total</div>,
      ]}
    />
  );
}

export function ReadyOrdersColumnHeader() {
  return (
    <OpenOrdersColumnHeaderRow
      className="grid gap-4 min-[1000px]:grid-cols-[minmax(0,1.2fr)_minmax(0,1.05fr)_7.25rem_5.5rem_7.75rem] min-[1000px]:items-start min-[1000px]:gap-x-4"
      columns={[
        <div key="customer" className="app-text-overline">Customer</div>,
        <div key="ready-by" className="app-text-overline">Ready by</div>,
        <div key="status" className="app-text-overline">Status</div>,
        <div key="action" aria-hidden="true" />,
        <div key="total" className="app-text-overline text-right">Total</div>,
      ]}
    />
  );
}

export function NeedsAttentionColumnHeader() {
  return (
    <OpenOrdersColumnHeaderRow
      className="grid gap-3 min-[1000px]:grid-cols-[minmax(0,0.62fr)_minmax(0,0.92fr)_7.25rem_5.5rem_8.25rem] min-[1000px]:items-start min-[1000px]:gap-x-4"
      columns={[
        <div key="customer" className="app-text-overline">Customer</div>,
        <div key="ready-by" className="app-text-overline">Ready by</div>,
        <div key="status" className="app-text-overline">Status</div>,
        <div key="action" aria-hidden="true" />,
        <div key="total" className="app-text-overline text-right">Total</div>,
      ]}
    />
  );
}

export function ClosedOrdersColumnHeader() {
  return (
    <OpenOrdersColumnHeaderRow
      wrapperClassName="px-4 py-2 pr-14"
      className="grid gap-4 min-[1000px]:grid-cols-[minmax(0,0.82fr)_minmax(0,1.08fr)_7.25rem_7.25rem] min-[1000px]:items-start min-[1000px]:gap-x-4"
      columns={[
        <div key="customer" className="app-text-overline">Customer</div>,
        <div key="closed-out" className="app-text-overline">Closed out</div>,
        <div key="status" className="app-text-overline">Status</div>,
        <div key="total" className="app-text-overline text-right">Total</div>,
      ]}
    />
  );
}

export function openOrdersSectionClassName(hasBorder: boolean) {
  return cx("app-table-row", hasBorder && "border-t border-[var(--app-border)]/35");
}
