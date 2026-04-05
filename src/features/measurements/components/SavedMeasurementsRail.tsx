import { Plus, Trash2 } from "lucide-react";
import type { Customer, MeasurementSet } from "../../../types";
import { ActionButton, EmptyState } from "../../../components/ui/primitives";
import { getMeasurementSetDisplay } from "../selectors";

type SavedMeasurementsRailProps = {
  customer: Customer | null;
  customerHistory: MeasurementSet[];
  linkedMeasurementSetId: string | null;
  onStartNewSet: () => void;
  onOpenCustomerModal: () => void;
  onApplySet: (set: MeasurementSet) => void;
  onDeleteSet: (measurementSetId: string) => void;
};

export function SavedMeasurementsRail({
  customer,
  customerHistory,
  linkedMeasurementSetId,
  onStartNewSet,
  onOpenCustomerModal,
  onApplySet,
  onDeleteSet,
}: SavedMeasurementsRailProps) {
  return (
    <div className="app-measurements-sets">
      <div className="mb-3 lg:mb-2.5 app-measurements-sets__header">
        <div className="app-text-overline">Measurement sets</div>
        <div className="mt-1 min-w-0 app-text-value">{customer?.name ?? "No customer selected"}</div>
        <div className="app-text-caption mt-1 app-desktop-only">
          {customer ? `${customerHistory.length} saved ${customerHistory.length === 1 ? "set" : "sets"}` : "Choose a customer to review saved sets."}
        </div>
        <div className="mt-2 flex items-center gap-2 app-measurements-sets__actions">
          <ActionButton
            tone={customer ? "secondary" : "primary"}
            className="app-hide-at-desktop min-h-9.5 flex-1 px-3 text-sm"
            onClick={onOpenCustomerModal}
          >
            {customer ? "Change customer" : "Choose customer"}
          </ActionButton>
          {customer ? (
            <ActionButton tone="secondary" className="app-desktop-only min-h-9.5 flex-1 px-3 text-sm" onClick={onOpenCustomerModal}>
              Change customer
            </ActionButton>
          ) : null}
          <ActionButton
            tone="primary"
            className="app-desktop-only inline-flex min-h-9.5 items-center gap-1.5 px-3 py-2 text-sm"
            onClick={customer ? onStartNewSet : onOpenCustomerModal}
          >
            <Plus className="h-3.5 w-3.5" />
            New set
          </ActionButton>
        </div>
      </div>

      {customerHistory.length > 0 ? (
        <div className="app-desktop-only app-measurements-rail__sets app-measurements-sets__history text-sm">
          {customerHistory.map((set) => {
            const display = getMeasurementSetDisplay(set);
            const isCurrent = linkedMeasurementSetId === set.id;

            return (
              <div
                key={set.id}
                className={`app-measurements-rail__set ${isCurrent ? "app-measurements-rail__set--active" : ""}`}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <button onClick={() => onApplySet(set)} className="block w-full min-w-0 text-left">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="truncate app-text-strong">{display.title}</div>
                        <div className="shrink-0 app-text-caption">{display.version}</div>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {display.subline ? <div className="app-text-caption">{display.subline}</div> : null}
                        {display.status ? <div className="app-text-caption">{display.status}</div> : null}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteSet(set.id);
                    }}
                    className="mt-0.5 text-[var(--app-text-soft)] transition hover:text-[var(--app-text)] focus-visible:outline-none focus-visible:text-[var(--app-text)]"
                    aria-label={`Delete ${display.version}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : customer ? null : (
        <EmptyState className="space-y-3">
          <div>{customer ? "No saved sets yet." : "Select a customer to view or save measurement sets."}</div>
        </EmptyState>
      )}
    </div>
  );
}
