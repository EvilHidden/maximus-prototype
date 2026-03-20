import type { MeasurementSetOption } from "../../../types";
import { ActionButton, ModalShell } from "../../../components/ui/primitives";

type MeasurementSetModalProps = {
  customerName: string;
  currentMeasurementSetId: string | null;
  options: MeasurementSetOption[];
  onSelect: (measurementSetId: string) => void;
  onCreateNew: () => void;
  onClose: () => void;
};

export function MeasurementSetModal({
  customerName,
  currentMeasurementSetId,
  options,
  onSelect,
  onCreateNew,
  onClose,
}: MeasurementSetModalProps) {
  return (
    <ModalShell title="Choose measurement set" subtitle={customerName} onClose={onClose}>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className="app-entity-row w-full text-left"
          >
            <div>
              <div className="text-sm font-medium text-[var(--app-text)]">{option.label}</div>
              <div className="mt-1 text-xs text-[var(--app-text-muted)]">{option.note}</div>
            </div>
            {currentMeasurementSetId === option.id ? <div className="text-xs font-medium text-[var(--app-text)]">Current</div> : null}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--app-border)] pt-4">
        <div className="text-xs text-[var(--app-text-muted)]">Need a new set instead?</div>
        <ActionButton tone="primary" className="px-3 py-2 text-xs" onClick={onCreateNew}>
          New measurements
        </ActionButton>
      </div>
    </ModalShell>
  );
}
