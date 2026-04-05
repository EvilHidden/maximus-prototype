import type { Customer, MeasurementSet } from "../../../types";
import { formatMeasurementDisplayValue } from "../service";
import { getMeasurementSetDisplay } from "../selectors";

type MeasurementSetsWorkbenchProps = {
  customer: Customer | null;
  customerHistory: MeasurementSet[];
  linkedMeasurementSetId: string | null;
  measurementFields: string[];
  draftMeasurements: Record<string, string>;
  comparisonValues: Record<string, string> | null;
  enteredCount: number;
  totalFields: number;
  activeField: string;
  onSelectField: (field: string) => void;
};

export function MeasurementSetsWorkbench({
  customer,
  customerHistory,
  linkedMeasurementSetId,
  measurementFields,
  draftMeasurements,
  comparisonValues,
  enteredCount,
  totalFields,
  activeField,
  onSelectField,
}: MeasurementSetsWorkbenchProps) {
  const selectedSet = linkedMeasurementSetId ? customerHistory.find((set) => set.id === linkedMeasurementSetId) ?? null : null;
  const isDraftMode = customer && !selectedSet;
  const display = selectedSet ? getMeasurementSetDisplay(selectedSet) : null;
  const sourceValues = selectedSet ? selectedSet.values : draftMeasurements;

  return (
    <section className="app-measurements-set-board app-measurements-workbench__list">
      {customer ? (
        <div className="app-measurements-set-board__grid">
          <article key={selectedSet?.id ?? "draft"} className="app-measurements-set-panel">
            <div className="app-measurements-set-panel__head">
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-3 app-measurements-set-panel__summary">
                  <div className="app-text-strong">{display?.title ?? "New set"}</div>
                  <div className="app-measurements-set-sheet__row-value app-measurements-set-panel__count">
                    <div className="app-text-caption text-right">
                      {enteredCount}/{totalFields}
                    </div>
                  </div>
                </div>
                <div className="app-text-caption mt-1 app-measurements-set-panel__caption">
                  {display?.subline ?? "Tap a measurement to enter values for this new set."}
                </div>
              </div>
            </div>

            <div className="app-measurements-set-sheet">
              {measurementFields.map((field) => {
                const rawValue = sourceValues[field]?.trim();
                const displayValue = rawValue ? formatMeasurementDisplayValue(rawValue) : "—";
                const comparisonRawValue = comparisonValues?.[field]?.trim() ?? "";
                const comparisonDisplayValue = comparisonRawValue ? `${formatMeasurementDisplayValue(comparisonRawValue)} in` : null;
                const isActive = activeField === field;

                return (
                  <button
                    key={`${selectedSet?.id ?? "draft"}-${field}`}
                    type="button"
                    className={`app-measurements-set-sheet__row ${isActive ? "app-measurements-set-sheet__row--active" : ""}`}
                    onClick={() => onSelectField(field)}
                    aria-pressed={isActive}
                    aria-label={`${field} ${isDraftMode ? "for new set" : "from selected set"}`}
                  >
                    <div className="min-w-0">
                      <div className="app-text-caption app-measurements-set-sheet__field-name">{field}</div>
                      {comparisonDisplayValue ? (
                        <div className="app-text-caption mt-1 app-measurements-set-sheet__comparison">
                          Last saved {comparisonDisplayValue}
                        </div>
                      ) : null}
                    </div>
                    <div className="app-measurements-set-sheet__row-value">
                      <div className="app-text-body text-right tabular-nums app-measurements-set-sheet__field-value">
                        {rawValue ? (
                          <>
                            <span>{displayValue}</span>
                            <span className="app-measurements-set-sheet__field-unit"> in</span>
                          </>
                        ) : (
                          displayValue
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </article>
        </div>
      ) : (
        <div className="app-measurements-set-board__empty app-text-caption">
          Select a customer to populate the measurement library.
        </div>
      )}
    </section>
  );
}
