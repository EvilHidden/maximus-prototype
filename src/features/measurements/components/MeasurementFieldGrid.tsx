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
            <div className="app-text-overline">{field}</div>
            <div className="app-text-value mt-2">{values[field] || "--"}</div>
          </button>
        );
      })}
    </div>
  );
}
