import { Plus, Trash2 } from "lucide-react";
import type { Customer, MeasurementSet } from "../../../types";
import { ActionButton, Card, EmptyState, StatusPill } from "../../../components/ui/primitives";
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
    <Card className="p-4">
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-[var(--app-border)] pb-3">
        <div>
          <div className="text-[1.05rem] font-semibold text-[var(--app-text)]">{customer?.name ?? "No customer selected"}</div>
          <div className="text-sm text-[var(--app-text-muted)]">Saved measurements</div>
        </div>
        <ActionButton tone="secondary" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs" onClick={onCreateDraftSet}>
          <Plus className="h-3.5 w-3.5" />
          New set
        </ActionButton>
      </div>

      {customerHistory.length > 0 ? (
        <div className="space-y-2 text-sm">
          {customerHistory.map((set) => {
            const display = getMeasurementSetDisplay(set);
            const isCurrent = linkedMeasurementSetId === set.id;

            return (
              <div
                key={set.id}
                className={`app-entity-row relative block p-0 transition ${isCurrent ? "border-[var(--app-border-strong)] bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]" : ""}`}
              >
                <button onClick={() => onApplySet(set)} className="block w-full min-w-0 px-4 py-3 pr-14 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-medium text-[var(--app-text)]">{display.title}</div>
                      {display.status ? <div className="mt-1 text-xs text-[var(--app-text-muted)]">{display.status}</div> : null}
                      {display.subline ? <div className="mt-1 text-xs text-[var(--app-text-soft)]">{display.subline}</div> : null}
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
    </Card>
  );
}
