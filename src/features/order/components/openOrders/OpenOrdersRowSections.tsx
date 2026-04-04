import { MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { ActionButton, cx } from "../../../../components/ui/primitives";
import { formatOpenOrderCreatedAt } from "../../selectors";
import { formatWorklistTotal, getWorklistPaymentLabel, getWorklistPaymentTextClassName } from "./meta";
import { getOrdersStatusTextClassName, type OrderStatusTone } from "./openOrdersFormatting";

export type OpenOrdersReadyByGroup = {
  key: string;
  dateLabel: string;
  timeLabel?: string | null;
  location?: string | null;
  summary?: string | null;
  secondary?: string | null;
};

export type OpenOrdersStatusRow = {
  key: string;
  label?: string | null;
  tone: OrderStatusTone;
  secondary?: string | null;
};

export type OpenOrdersActionRow = {
  key: string;
  label?: string | null;
  disabled?: boolean;
  onClick?: () => void;
};

export function OpenOrdersIdentitySection({
  payerName,
  orderId,
  createdAt,
  workflowLabel,
  compactDesktop = false,
}: {
  payerName: string;
  orderId: number | string;
  createdAt: string;
  workflowLabel: string;
  compactDesktop?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="app-text-value min-w-0">{payerName}</div>
      <div className="app-text-caption mt-1">Order #{orderId} • {formatOpenOrderCreatedAt(createdAt)}</div>
      <div className={cx("app-text-body-muted font-medium", compactDesktop ? "mt-1.5" : "mt-2")}>{workflowLabel}</div>
    </div>
  );
}

export function OpenOrdersReadyBySection({
  groups,
}: {
  groups: OpenOrdersReadyByGroup[];
}) {
  return (
    <div className="min-w-0">
      <div className="app-text-overline min-[1000px]:hidden">Ready by</div>
      <div className="mt-1 min-[1000px]:mt-0">
        {groups.map((group, index) => (
          <div
            key={group.key}
            className={cx(
              "min-w-0 py-2.5",
              index === 0 ? "pt-0" : "border-t border-[var(--app-border)]/35",
            )}
          >
            <div className={cx("min-w-0", index > 0 && "pt-0.5")}>
              <div className="mt-0 flex flex-wrap items-center gap-2">
                <div className="app-text-body font-medium">
                  {group.dateLabel}{group.timeLabel ? ` · ${group.timeLabel}` : ""}
                </div>
                {group.location ? (
                  <div className="app-text-caption inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
                    <span>{group.location}</span>
                  </div>
                ) : null}
              </div>
              {group.summary ? <div className="app-text-caption mt-1">{group.summary}</div> : null}
              {group.secondary ? <div className="app-text-caption mt-1">{group.secondary}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OpenOrdersStatusSection({
  rows,
}: {
  rows: OpenOrdersStatusRow[];
}) {
  return (
    <div className="min-w-0">
      <div className="app-text-overline min-[1000px]:hidden">Status</div>
      <div className="mt-1 min-[1000px]:mt-0">
        {rows.map((row, index) => (
          <div
            key={row.key}
            className={cx(
              "flex min-h-12 flex-col items-start justify-center py-2",
              index === 0 ? "pt-0" : "border-t border-[var(--app-border)]/35 pt-2.5",
            )}
          >
            {row.label ? <div className={getOrdersStatusTextClassName(row.tone)}>{row.label}</div> : null}
            {row.secondary ? <div className="app-text-caption mt-1 text-left">{row.secondary}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function OpenOrdersActionSection({
  rows,
  buttonClassName = "min-w-[4.75rem] justify-center whitespace-nowrap px-3 py-1.5 text-[0.68rem]",
}: {
  rows: OpenOrdersActionRow[];
  buttonClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="mt-1 min-[1000px]:mt-0">
        {rows.map((row, index) => (
          <div
            key={row.key}
            className={cx(
              "flex min-h-12 items-center justify-start py-2",
              index === 0 ? "pt-0" : "border-t border-[var(--app-border)]/35 pt-2.5",
            )}
          >
            {row.label && row.onClick ? (
              <ActionButton
                tone="primary"
                className={buttonClassName}
                disabled={row.disabled}
                onClick={(event) => {
                  event.stopPropagation();
                  row.onClick?.();
                }}
              >
                {row.label}
              </ActionButton>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function OpenOrdersTotalSection({
  total,
  balanceDue,
  className,
  amountClassName,
}: {
  total: number;
  balanceDue: number;
  className?: string;
  amountClassName?: string;
}) {
  return (
    <div className={cx("min-w-0 text-left md:text-right", className)}>
      <div className="app-text-overline min-[1000px]:hidden">Total</div>
      <div className={cx(
        "text-[1.375rem] font-semibold leading-none tracking-[-0.01em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]",
        amountClassName,
      )}>
        {formatWorklistTotal(total)}
      </div>
      <div className="mt-1.5">
        <span className={getWorklistPaymentTextClassName(balanceDue)}>{getWorklistPaymentLabel(balanceDue)}</span>
      </div>
    </div>
  );
}

export function OpenOrdersMobileReadyStatusLayout({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2.5 border-t border-[var(--app-border)]/35 pt-3">
      <div className="min-w-0">{left}</div>
      <div className="min-w-[5.25rem] text-right">{right}</div>
    </div>
  );
}
