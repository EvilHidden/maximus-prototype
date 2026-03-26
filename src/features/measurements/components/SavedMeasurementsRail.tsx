import { Plus, Trash2 } from "lucide-react";
import type { Customer, MeasurementSet } from "../../../types";
import { ActionButton, EmptyState } from "../../../components/ui/primitives";
import { MeasurementVersionPill } from "../../../components/ui/pills";
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
    <div>
      <div className="mb-4">
        <div className="app-text-overline">Measurement sets</div>
        <div className="mt-2 min-w-0 app-text-value">{customer?.name ?? "No customer selected"}</div>
        <div className="app-text-caption mt-2">
          {customer ? `${customerHistory.length} saved ${customerHistory.length === 1 ? "set" : "sets"}` : "Choose a customer to review saved sets."}
        </div>
        <div className="mt-3 flex items-center gap-2">
          {customer ? (
            <ActionButton tone="secondary" className="min-h-10 flex-1 px-3 text-sm" onClick={onOpenCustomerModal}>
              Change customer
            </ActionButton>
          ) : null}
          <ActionButton
            tone="primary"
            className="inline-flex min-h-10 items-center gap-1.5 px-3 py-2 text-sm"
            onClick={customer ? onStartNewSet : onOpenCustomerModal}
          >
            <Plus className="h-3.5 w-3.5" />
            New set
          </ActionButton>
        </div>
      </div>

      {customerHistory.length > 0 ? (
        <div className="space-y-2 text-sm">
          {customerHistory.map((set) => {
            const display = getMeasurementSetDisplay(set);
            const isCurrent = linkedMeasurementSetId === set.id;

            return (
              <div
                key={set.id}
                className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--app-radius-sm)] border border-[color:color-mix(in_srgb,var(--app-border)_60%,transparent)] px-3 py-2.5 transition ${
                  isCurrent ? "bg-[color:color-mix(in_srgb,var(--app-surface-muted)_34%,transparent)]" : "bg-[var(--app-surface)]"
                }`}
              >
                <button onClick={() => onApplySet(set)} className="block w-full min-w-0 text-left">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate app-text-strong">{display.title}</div>
                      <div className="mt-1 flex items-center gap-2">
                        {display.status ? <span className="app-text-caption">{display.status}</span> : null}
                        {display.subline ? <span className="app-text-caption">{display.subline}</span> : null}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <MeasurementVersionPill version={display.version} isCurrent={isCurrent} />
                    </div>
                  </div>
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteSet(set.id);
                  }}
                  className="text-[var(--app-text-soft)] transition hover:text-[var(--app-text)]"
                  aria-label={`Delete ${display.version}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState className="space-y-3">
          <div>{customer ? "No saved sets yet." : "Select a customer to view or save measurement sets."}</div>
        </EmptyState>
      )}
    </div>
  );
}
