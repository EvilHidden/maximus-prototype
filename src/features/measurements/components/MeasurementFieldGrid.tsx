import { measurementFields } from "../../../data";

type MeasurementFieldGridProps = {
  activeField: string;
  values: Record<string, string>;
  onSelectField: (field: string) => void;
};

export function MeasurementFieldGrid({ activeField, values, onSelectField }: MeasurementFieldGridProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {measurementFields.map((field) => {
        const isActive = activeField === field;
        return (
          <button
            key={field}
            onClick={() => onSelectField(field)}
            className={`border px-3 py-3 text-left ${isActive ? "app-workflow-toggle app-workflow-toggle--active" : "app-workflow-toggle"}`}
          >
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-text-soft)]">{field}</div>
            <div className="mt-2 text-lg font-semibold text-[var(--app-text)]">{values[field] || "--"}</div>
          </button>
        );
      })}
    </div>
  );
}
