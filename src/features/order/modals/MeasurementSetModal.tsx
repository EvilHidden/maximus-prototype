import type { MeasurementSetOption } from "../../../types";
import { ActionButton, EntityRow, InlineEmptyState, ModalShell, StatusPill } from "../../../components/ui/primitives";
import { ModalFooterActions, ModalSectionHeading } from "../../../components/ui/modalPatterns";

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
    <ModalShell
      title="Choose measurement set"
      onClose={onClose}
      widthClassName="max-w-[560px]"
      footer={
        <ModalFooterActions leading={<div className="app-text-caption">Need a new set instead?</div>}>
          <ActionButton tone="secondary" className="px-3 py-2 text-xs" onClick={onCreateNew}>
            New measurements
          </ActionButton>
        </ModalFooterActions>
      }
    >
      <div className="space-y-4">
          <ModalSectionHeading
            title={options.length === 1 ? "1 saved set" : `${options.length} saved sets`}
            description="Choose the measurements to use for this order."
          />
          <div className="max-h-[min(320px,calc(100vh-19rem))] space-y-2 overflow-auto rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/22 p-2">
            {options.length ? options.map((option) => (
              <EntityRow
                key={option.id}
                onClick={() => onSelect(option.id)}
                title={option.label}
                subtitle={option.note ? <span className="app-text-caption">{option.note}</span> : undefined}
                meta={currentMeasurementSetId === option.id ? <StatusPill tone="dark">Current</StatusPill> : null}
                className="w-full rounded-[var(--app-radius-md)] bg-[var(--app-surface)] px-4 py-3"
              />
            )) : (
              <InlineEmptyState>No saved measurements for this customer yet.</InlineEmptyState>
            )}
          </div>
      </div>
    </ModalShell>
  );
}
