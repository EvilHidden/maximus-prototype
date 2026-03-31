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
    <div className="space-y-3.5 lg:space-y-3">
      {fieldSections.map((section) => {
        const columns = splitFieldsIntoColumns(section.fields);

        return (
          <section key={section.title}>
            <div className="mb-2 lg:mb-1.5">
              <div className="app-text-overline">{section.title}</div>
            </div>

            <div className={`grid gap-x-3 gap-y-1.5 lg:gap-x-2.5 ${columns.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
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
                        className={`w-full rounded-[var(--app-radius-sm)] border px-2.5 py-2.5 text-left transition lg:px-2.5 lg:py-2 ${
                          isActive
                            ? "border-[var(--app-border-strong)] bg-[color:color-mix(in_srgb,var(--app-surface-muted)_34%,var(--app-surface))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--app-border-strong)_26%,transparent),var(--app-shadow-sm)]"
                            : "border-[color:color-mix(in_srgb,var(--app-border)_30%,transparent)] bg-[color:color-mix(in_srgb,var(--app-surface-muted)_10%,transparent)] hover:border-[color:color-mix(in_srgb,var(--app-border-strong)_42%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--app-surface-muted)_18%,transparent)]"
                        }`}
                      >
                        <div className="flex min-h-[3.5rem] flex-col justify-between gap-1 lg:min-h-[3.15rem]">
                          <div
                            className={
                              isActive
                                ? "text-[0.92rem] font-semibold leading-tight tracking-[-0.01em] text-[var(--app-text)] lg:text-[0.88rem]"
                                : "text-[0.88rem] font-medium leading-tight text-[var(--app-text)] lg:text-[0.84rem]"
                            }
                          >
                            {field}
                          </div>
                          <div
                            className={
                              isActive
                                ? "text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--app-text-muted)]"
                                : hasValue
                                  ? "text-[0.72rem] font-medium uppercase tracking-[0.12em] text-[var(--app-text-soft)]"
                                  : "text-[0.72rem] uppercase tracking-[0.12em] text-[var(--app-text-soft)]"
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
