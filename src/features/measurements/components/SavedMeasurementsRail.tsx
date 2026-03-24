import { Plus, Trash2 } from "lucide-react";
import type { Customer, MeasurementSet } from "../../../types";
import { ActionButton, EmptyState } from "../../../components/ui/primitives";
import { MeasurementVersionPill } from "../../../components/ui/pills";
import { getMeasurementSetDisplay } from "../selectors";

type SavedMeasurementsRailProps = {
  customer: Customer | null;
  customerHistory: MeasurementSet[];
  linkedMeasurementSetId: string | null;
  onCreateDraftSet: () => void;
  onOpenCustomerModal: () => void;
  onApplySet: (set: MeasurementSet) => void;
  onDeleteSet: (measurementSetId: string) => void;
};

export function SavedMeasurementsRail({
  customer,
  customerHistory,
  linkedMeasurementSetId,
  onCreateDraftSet,
  onOpenCustomerModal,
  onApplySet,
  onDeleteSet,
}: SavedMeasurementsRailProps) {
  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="app-text-value">{customer?.name ?? "No customer selected"}</div>
          <div className="app-text-caption mt-1">Saved sets</div>
        </div>
        <ActionButton tone="secondary" className="inline-flex min-h-11 items-center gap-1.5 px-3 py-2 text-sm" onClick={onCreateDraftSet}>
          <Plus className="h-3.5 w-3.5" />
          New set
        </ActionButton>
      </div>

      {customerHistory.length > 0 ? (
        <div className="divide-y divide-[var(--app-border)]/35 overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)]/40 bg-[var(--app-surface)]/14 text-sm">
          {customerHistory.map((set) => {
            const display = getMeasurementSetDisplay(set);
            const isCurrent = linkedMeasurementSetId === set.id;

            return (
              <div
                key={set.id}
                className={`grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 p-0 transition ${isCurrent ? "bg-[var(--app-surface)]/34" : ""}`}
              >
                <button onClick={() => onApplySet(set)} className="block w-full min-w-0 px-4 py-3 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate app-text-strong">{display.title}</div>
                      {display.status ? <div className="mt-1 app-text-caption">{display.status}</div> : null}
                      {display.subline ? <div className="mt-1 app-text-caption">{display.subline}</div> : null}
                    </div>
                    <div className="shrink-0 pl-3">
                      <MeasurementVersionPill version={display.version} isCurrent={isCurrent} />
                    </div>
                  </div>
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteSet(set.id);
                  }}
                  className="mr-4 mt-3 self-start text-[var(--app-text-soft)] transition hover:text-[var(--app-text)]"
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
          <div>{customer ? "No saved sets yet." : "Choose a customer to see saved sets."}</div>
          {!customer ? (
            <ActionButton tone="secondary" className="min-h-11 px-4" onClick={onOpenCustomerModal}>
              Choose customer
            </ActionButton>
          ) : null}
        </EmptyState>
      )}
    </div>
  );
}
