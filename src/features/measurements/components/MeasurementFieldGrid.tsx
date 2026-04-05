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

export function MeasurementFieldGrid({ fieldSections, activeField, values, onSelectField }: MeasurementFieldGridProps) {
  const formatListValue = (value: string) => (value ? `${value} in` : "—");

  return (
    <div className="app-measurement-field-grid">
      {fieldSections.map((section) => {
        return (
          <section key={section.title} className="app-measurement-field-grid__section">
            <div className="mb-2 lg:mb-1.5">
              <div className="app-text-overline">{section.title}</div>
            </div>

            <div className={`grid gap-x-3 gap-y-1.5 lg:gap-x-2.5 ${section.fields.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {section.fields.map((field) => {
                const isActive = activeField === field;
                const value = values[field] ?? "";
                const hasValue = value.trim().length > 0;

                return (
                  <button
                    key={field}
                    onClick={() => onSelectField(field)}
                    aria-pressed={isActive}
                    className={`w-full border-b px-0 py-2.5 text-left transition lg:py-2 ${
                      isActive
                        ? "border-[color:color-mix(in_srgb,var(--app-border-strong)_72%,transparent)] bg-[color:color-mix(in_srgb,var(--app-surface-muted)_18%,transparent)]"
                        : "border-[color:color-mix(in_srgb,var(--app-border)_28%,transparent)] hover:border-[color:color-mix(in_srgb,var(--app-border-strong)_42%,transparent)]"
                    }`}
                  >
                    <div className="flex min-h-[2.8rem] items-start justify-between gap-3 lg:min-h-[2.55rem]">
                      <div className="min-w-0">
                        <div
                          className={
                            isActive
                              ? "text-[0.92rem] font-semibold leading-tight tracking-[-0.01em] text-[var(--app-text)] lg:text-[0.88rem]"
                              : "text-[0.88rem] font-medium leading-tight text-[var(--app-text)] lg:text-[0.84rem]"
                          }
                        >
                          {field}
                        </div>
                      </div>
                      <div
                        className={
                          isActive
                            ? "shrink-0 text-[0.78rem] font-semibold tabular-nums text-[var(--app-text-muted)]"
                            : hasValue
                              ? "shrink-0 text-[0.78rem] font-medium tabular-nums text-[var(--app-text-soft)]"
                              : "shrink-0 text-[0.78rem] tabular-nums text-[var(--app-text-soft)]"
                        }
                      >
                        {formatListValue(value)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
