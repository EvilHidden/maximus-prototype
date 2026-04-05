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
      <div className="mb-3 lg:mb-2.5">
        <div className="app-text-overline">Measurement sets</div>
        <div className="mt-1 min-w-0 app-text-value">{customer?.name ?? "No customer selected"}</div>
        <div className="app-text-caption mt-1">
          {customer ? `${customerHistory.length} saved ${customerHistory.length === 1 ? "set" : "sets"}` : "Choose a customer to review saved sets."}
        </div>
        <div className="mt-2 flex items-center gap-2">
          {customer ? (
            <ActionButton tone="secondary" className="min-h-9.5 flex-1 px-3 text-sm" onClick={onOpenCustomerModal}>
              Change customer
            </ActionButton>
          ) : null}
          <ActionButton
            tone="primary"
            className="inline-flex min-h-9.5 items-center gap-1.5 px-3 py-2 text-sm"
            onClick={customer ? onStartNewSet : onOpenCustomerModal}
          >
            <Plus className="h-3.5 w-3.5" />
            New set
          </ActionButton>
        </div>
      </div>

      {customerHistory.length > 0 ? (
        <div className="space-y-1.5 text-sm">
          {customerHistory.map((set) => {
            const display = getMeasurementSetDisplay(set);
            const isCurrent = linkedMeasurementSetId === set.id;

            return (
              <div
                key={set.id}
                className={`rounded-[var(--app-radius-sm)] border border-[color:color-mix(in_srgb,var(--app-border)_60%,transparent)] px-3 py-2 transition ${
                  isCurrent ? "bg-[color:color-mix(in_srgb,var(--app-surface-muted)_34%,transparent)]" : "bg-[var(--app-surface)]"
                }`}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <button onClick={() => onApplySet(set)} className="block w-full min-w-0 text-left">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate app-text-strong">{display.title}</div>
                        <div className="mt-1 space-y-0.5">
                          {display.status ? <div className="app-text-caption">{display.status}</div> : null}
                          {display.subline ? <div className="app-text-caption">{display.subline}</div> : null}
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
                    className="mt-0.5 text-[var(--app-text-soft)] transition hover:text-[var(--app-text)]"
                    aria-label={`Delete ${display.version}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
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
