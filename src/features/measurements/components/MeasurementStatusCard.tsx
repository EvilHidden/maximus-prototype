type MeasurementStatusCardProps = {
  title: string;
  detail: string;
};

export function MeasurementStatusCard({ title, detail }: MeasurementStatusCardProps) {
  return (
    <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/18 px-4 py-3">
      <div className="app-text-value">{title}</div>
      <div className="app-text-caption mt-1">{detail}</div>
    </div>
  );
}
