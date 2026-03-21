import { Plus, Trash2 } from "lucide-react";
import type { Customer, MeasurementSet } from "../../../types";
import { ActionButton, EmptyState, StatusPill } from "../../../components/ui/primitives";
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
          <div className="app-text-caption mt-1">Saved measurements</div>
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
                className={`relative block p-0 transition ${isCurrent ? "bg-[var(--app-surface)]/34" : ""}`}
              >
                <button onClick={() => onApplySet(set)} className="block w-full min-w-0 px-4 py-3 pr-14 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate app-text-strong">{display.title}</div>
                      {display.status ? <div className="mt-1 app-text-caption">{display.status}</div> : null}
                      {display.subline ? <div className="mt-1 app-text-caption">{display.subline}</div> : null}
                    </div>
                    <div className="absolute right-4 top-3 shrink-0">
                      <StatusPill tone={isCurrent ? "dark" : "default"}>{display.version}</StatusPill>
                    </div>
                  </div>
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteSet(set.id);
                  }}
                  className="absolute bottom-3 right-4 text-[var(--app-text-soft)] transition hover:text-[var(--app-text)]"
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
          <div>{customer ? "No saved measurement history." : "Link a customer to load saved measurement sets."}</div>
          {!customer ? (
            <ActionButton tone="secondary" className="min-h-11 px-4" onClick={onOpenCustomerModal}>
              Link customer
            </ActionButton>
          ) : null}
        </EmptyState>
      )}
    </div>
  );
}
