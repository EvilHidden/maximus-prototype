type MeasurementFieldSection = {
  title: string;
  fields: string[];
};

type MeasurementFieldGridProps = {
  fieldSections: MeasurementFieldSection[];
  activeField: string;
  values: Record<string, string>;
  onSelectField: (field: string) => void;
};

function splitFieldsIntoColumns(fields: string[]) {
  const midpoint = Math.ceil(fields.length / 2);
  return [fields.slice(0, midpoint), fields.slice(midpoint)].filter((column) => column.length > 0);
}

export function MeasurementFieldGrid({ fieldSections, activeField, values, onSelectField }: MeasurementFieldGridProps) {
  const formatListValue = (value: string) => (value ? `${value} in` : "—");

  return (
    <div className="space-y-4">
      {fieldSections.map((section) => {
        const columns = splitFieldsIntoColumns(section.fields);

        return (
          <section key={section.title}>
            <div className="mb-2.5">
              <div className="app-text-overline">{section.title}</div>
            </div>

            <div className={`grid gap-x-4 gap-y-1.5 ${columns.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {columns.map((column, columnIndex) => (
                <div key={`${section.title}-${columnIndex}`} className="space-y-1.5">
                  {column.map((field) => {
                    const isActive = activeField === field;
                    const value = values[field] ?? "";
                    const hasValue = value.trim().length > 0;

                    return (
                      <button
                        key={field}
                        onClick={() => onSelectField(field)}
                        aria-pressed={isActive}
                        className={`w-full rounded-[var(--app-radius-sm)] border px-3 py-3 text-left transition ${
                          isActive
                            ? "border-[var(--app-border-strong)] bg-[color:color-mix(in_srgb,var(--app-surface-muted)_34%,var(--app-surface))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--app-border-strong)_26%,transparent),var(--app-shadow-sm)]"
                            : "border-[color:color-mix(in_srgb,var(--app-border)_30%,transparent)] bg-[color:color-mix(in_srgb,var(--app-surface-muted)_10%,transparent)] hover:border-[color:color-mix(in_srgb,var(--app-border-strong)_42%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--app-surface-muted)_18%,transparent)]"
                        }`}
                      >
                        <div className="flex min-h-[4.1rem] flex-col justify-between gap-1.5">
                          <div
                            className={
                              isActive
                                ? "text-[0.98rem] font-semibold leading-tight tracking-[-0.01em] text-[var(--app-text)]"
                                : "text-[0.94rem] font-medium leading-tight text-[var(--app-text)]"
                            }
                          >
                            {field}
                          </div>
                          <div
                            className={
                              isActive
                                ? "text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-[var(--app-text-muted)]"
                                : hasValue
                                  ? "text-[0.75rem] font-medium uppercase tracking-[0.12em] text-[var(--app-text-soft)]"
                                  : "text-[0.75rem] uppercase tracking-[0.12em] text-[var(--app-text-soft)]"
                            }
                          >
                            {formatListValue(value)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
