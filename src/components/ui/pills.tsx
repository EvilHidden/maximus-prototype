import type { LucideIcon } from "lucide-react";
import { AlertCircle, MapPin, Ruler } from "lucide-react";
import type { MeasurementStatus, OpenOrderPaymentStatus, StatusTone } from "../../types";
import { getMeasurementStatusLabel, getMeasurementStatusTone } from "../../features/customer/selectors";
import { StatusPill, cx } from "./primitives";

type CountPillProps = {
  count: number;
  label?: string;
  icon?: LucideIcon;
  tone?: "default" | "info" | "success";
  className?: string;
};

type ReadinessPillProps = {
  ready: boolean;
  readyLabel?: string;
  missingLabel?: string;
  readyTone?: StatusTone;
  missingTone?: StatusTone;
};

const countToneClasses: Record<NonNullable<CountPillProps["tone"]>, string> = {
  default: "border-[var(--app-border)]/55 bg-[var(--app-surface)]/26 text-[var(--app-text-muted)]",
  info: "border-[var(--app-info-border)] bg-[var(--app-info-bg)] text-[var(--app-info-text)]",
  success: "border-[var(--app-success-border)] bg-[var(--app-success-bg)] text-[var(--app-success-text)]",
};

export function VipPill() {
  return (
    <StatusPill
      tone="default"
      className="border-[var(--app-border-strong)]/65 bg-[var(--app-surface-muted)]/75 text-[var(--app-text)]"
    >
      VIP
    </StatusPill>
  );
}

export function MeasurementStatusPill({
  status,
  showIcon = false,
}: {
  status: MeasurementStatus;
  showIcon?: boolean;
}) {
  const Icon = status === "on_file" ? Ruler : AlertCircle;

  return (
    <StatusPill tone={getMeasurementStatusTone(status)}>
      {showIcon ? <Icon className="h-3.5 w-3.5" /> : null}
      <span>{getMeasurementStatusLabel(status)}</span>
    </StatusPill>
  );
}

export function PaymentStatusPill({ status }: { status: OpenOrderPaymentStatus }) {
  const tone = status === "captured" ? "success" : "warn";
  const label = status === "captured"
    ? "Paid"
    : status === "pending"
      ? "Payment pending"
      : "PAYMENT DUE";
  const className = status === "captured"
    ? undefined
    : status === "pending"
      ? undefined
      : "uppercase tracking-[0.08em]";

  return <StatusPill tone={tone} className={className}>{label}</StatusPill>;
}

export function ReadinessPill({
  ready,
  readyLabel = "Ready",
  missingLabel = "Missing",
  readyTone = "dark",
  missingTone = "warn",
}: ReadinessPillProps) {
  return <StatusPill tone={ready ? readyTone : missingTone}>{ready ? readyLabel : missingLabel}</StatusPill>;
}

export function OrderStatusPill({ status }: { status: string }) {
  const normalized = status.trim().toLowerCase();

  let tone: StatusTone = "default";
  if (normalized === "delivered" || normalized === "picked up" || normalized === "ready" || normalized === "ready today") {
    tone = "success";
  } else if (normalized === "canceled") {
    tone = "danger";
  } else if (normalized === "quoted" || normalized === "in progress") {
    tone = "warn";
  }

  return <StatusPill tone={tone}>{status}</StatusPill>;
}

export function LocationPill({ location }: { location: string }) {
  return (
    <StatusPill>
      <MapPin className="h-3.5 w-3.5" />
      <span>{location}</span>
    </StatusPill>
  );
}

export function MeasurementVersionPill({
  version,
  isCurrent = false,
}: {
  version: string;
  isCurrent?: boolean;
}) {
  return (
    <StatusPill
      tone="default"
      className={isCurrent ? "border-[var(--app-border-strong)]/70 bg-[var(--app-surface-muted)]/72 text-[var(--app-text)]" : undefined}
    >
      {version}
    </StatusPill>
  );
}

export function AppointmentIssuePill({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "warn" | "success";
}) {
  return (
    <StatusPill
      tone={tone === "warn" ? "warn" : tone === "success" ? "success" : "default"}
      className="px-2.5 py-1 text-[11px]"
    >
      {label}
    </StatusPill>
  );
}

export function CountPill({
  count,
  label,
  icon: Icon,
  tone = "default",
  className,
}: CountPillProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
        countToneClasses[tone],
        className,
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      <span className="app-text-overline">{label ? `${count} ${label}` : count}</span>
    </span>
  );
}
