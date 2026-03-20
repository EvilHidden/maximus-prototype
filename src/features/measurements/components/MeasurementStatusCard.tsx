type MeasurementStatusCardProps = {
  title: string;
  detail: string;
};

export function MeasurementStatusCard({ title, detail }: MeasurementStatusCardProps) {
  return (
    <div className="mb-4 border-b border-[var(--app-border)] pb-3">
      <div className="text-base font-semibold text-[var(--app-text)]">{title}</div>
      <div className="mt-1 text-sm text-[var(--app-text-muted)]">{detail}</div>
    </div>
  );
}
