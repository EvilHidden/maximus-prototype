import type { Customer, MeasurementSet } from "../../../types";
import { formatMeasurementDisplayValue } from "../service";
import { getMeasurementSetDisplay } from "../selectors";

type MeasurementSetsWorkbenchProps = {
  customer: Customer | null;
  customerHistory: MeasurementSet[];
  linkedMeasurementSetId: string | null;
  measurementFields: string[];
  draftMeasurements: Record<string, string>;
  activeField: string;
  onSelectField: (field: string) => void;
};

export function MeasurementSetsWorkbench({
  customer,
  customerHistory,
  linkedMeasurementSetId,
  measurementFields,
  draftMeasurements,
  activeField,
  onSelectField,
}: MeasurementSetsWorkbenchProps) {
  const selectedSet = linkedMeasurementSetId ? customerHistory.find((set) => set.id === linkedMeasurementSetId) ?? null : null;
  const isDraftMode = customer && !selectedSet;
  const display = selectedSet ? getMeasurementSetDisplay(selectedSet) : null;
  const sourceValues = selectedSet ? selectedSet.values : draftMeasurements;

  return (
    <section className="app-measurements-set-board">
      {customer ? (
        <div className="app-measurements-set-board__grid">
          <article key={selectedSet?.id ?? "draft"} className="app-measurements-set-panel">
            <div className="app-measurements-set-panel__head">
              <div className="min-w-0">
                <div className="app-text-strong">{display?.title ?? "New set"}</div>
                <div className="app-text-caption mt-1">
                  {display?.subline ?? "Tap a measurement to enter values for this new set."}
                </div>
              </div>
            </div>

            <div className="app-measurements-set-sheet">
              {measurementFields.map((field) => {
                const rawValue = sourceValues[field]?.trim();
                const displayValue = rawValue ? `${formatMeasurementDisplayValue(rawValue)} in` : "—";
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
                    <div className="app-text-caption">{field}</div>
                    <div className="app-text-body text-right tabular-nums">{displayValue}</div>
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
