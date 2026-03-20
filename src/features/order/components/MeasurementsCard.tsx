import { Ruler } from "lucide-react";
import type { Customer } from "../../../types";
import { ActionButton, Card, EmptyState, PanelSection, SectionHeader } from "../../../components/ui/primitives";

type MeasurementsCardProps = {
  customer: Customer | null;
  linkedMeasurementSetLabel: string | null;
  suggestedMeasurementSetLabel: string | null;
  onUseSuggested: () => void;
  onChooseAnother: () => void;
  onCreateNew: () => void;
};

export function MeasurementsCard({
  customer,
  linkedMeasurementSetLabel,
  suggestedMeasurementSetLabel,
  onUseSuggested,
  onChooseAnother,
  onCreateNew,
}: MeasurementsCardProps) {
  return (
    <Card className="p-4">
      <SectionHeader icon={Ruler} title="Measurements" subtitle="Required for custom" />

      {!customer ? (
        <EmptyState>Select a customer first.</EmptyState>
      ) : linkedMeasurementSetLabel ? (
        <>
          <PanelSection title="Linked set">
            <div className="text-sm font-medium text-[var(--app-text)]">{linkedMeasurementSetLabel}</div>
            <div className="mt-1 text-xs text-[var(--app-text-muted)]">{customer.name}</div>
          </PanelSection>
          <div className="mt-3 flex items-center gap-2">
            <ActionButton tone="secondary" className="px-3 py-2.5 text-xs" onClick={onChooseAnother}>
              Choose another
            </ActionButton>
            <ActionButton tone="secondary" className="px-3 py-2.5 text-xs" onClick={onCreateNew}>
              New measurements
            </ActionButton>
          </div>
        </>
      ) : suggestedMeasurementSetLabel ? (
        <>
          <PanelSection title="Suggested set">
            <div className="text-sm font-medium text-[var(--app-text)]">{suggestedMeasurementSetLabel}</div>
            <div className="mt-1 text-xs text-[var(--app-text-muted)]">{customer.name}</div>
          </PanelSection>
          <div className="mt-3 flex items-center gap-2">
            <ActionButton tone="primary" className="px-3 py-2.5 text-xs" onClick={onUseSuggested}>
              Use suggested
            </ActionButton>
            <ActionButton tone="secondary" className="px-3 py-2.5 text-xs" onClick={onChooseAnother}>
              Choose another
            </ActionButton>
            <ActionButton tone="secondary" className="px-3 py-2.5 text-xs" onClick={onCreateNew}>
              New measurements
            </ActionButton>
          </div>
        </>
      ) : (
        <>
          <EmptyState>No measurement set linked.</EmptyState>
          <div className="mt-3 flex items-center gap-2">
            <ActionButton tone="secondary" className="px-3 py-2.5 text-xs" onClick={onChooseAnother}>
              Choose set
            </ActionButton>
            <ActionButton tone="primary" className="px-3 py-2.5 text-xs" onClick={onCreateNew}>
              New measurements
            </ActionButton>
          </div>
        </>
      )}
    </Card>
  );
}
