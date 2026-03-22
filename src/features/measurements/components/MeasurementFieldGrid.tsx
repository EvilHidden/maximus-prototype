type MeasurementFieldGridProps = {
  fieldNames: string[];
  activeField: string;
  values: Record<string, string>;
  onSelectField: (field: string) => void;
};

export function MeasurementFieldGrid({ fieldNames, activeField, values, onSelectField }: MeasurementFieldGridProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {fieldNames.map((field) => {
        const isActive = activeField === field;
        return (
          <button
            key={field}
            onClick={() => onSelectField(field)}
            className={`min-h-16 border px-3 py-3 text-left ${isActive ? "app-workflow-toggle app-workflow-toggle--active" : "app-workflow-toggle"}`}
          >
            <div className="app-text-overline">{field}</div>
            <div className="app-text-value mt-2">{values[field] || "--"}</div>
          </button>
        );
      })}
    </div>
  );
}
