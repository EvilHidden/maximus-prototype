import { Ruler } from "lucide-react";
import type { Customer } from "../../../types";
import { ActionButton, Card, EmptyState, PanelSection, SectionHeader, StatusPill } from "../../../components/ui/primitives";

type MeasurementsCardProps = {
  customer: Customer | null;
  linkedMeasurementSetLabel: string | null;
  suggestedMeasurementSetLabel: string | null;
  onUseSuggested: () => void;
  onChooseAnother: () => void;
  onCreateNew: () => void;
};

function splitMeasurementLabel(label: string | null) {
  if (!label) {
    return null;
  }

  const [version, ...rest] = label.split(" • ");
  return {
    version,
    title: rest.length > 0 ? rest.join(" • ") : version,
  };
}

export function MeasurementsCard({
  customer,
  linkedMeasurementSetLabel,
  suggestedMeasurementSetLabel,
  onUseSuggested,
  onChooseAnother,
  onCreateNew,
}: MeasurementsCardProps) {
  const linkedSet = splitMeasurementLabel(linkedMeasurementSetLabel);
  const suggestedSet = splitMeasurementLabel(suggestedMeasurementSetLabel);

  return (
    <Card className="p-4">
      <SectionHeader icon={Ruler} title="Measurements" subtitle="Required for custom" />

      {!customer ? (
        <EmptyState>Select a customer first.</EmptyState>
      ) : linkedMeasurementSetLabel ? (
        <>
          <PanelSection title="Linked set">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-medium text-[var(--app-text)]">{linkedSet?.title ?? linkedMeasurementSetLabel}</div>
              {linkedSet?.version ? <StatusPill tone="dark">{linkedSet.version}</StatusPill> : null}
            </div>
            <div className="mt-1 text-xs text-[var(--app-text-muted)]">Attached to this order.</div>
          </PanelSection>
          <div className="mt-3 flex items-center gap-2">
            <ActionButton tone="secondary" className="px-3 py-2.5 text-xs" onClick={onChooseAnother}>
              Choose set
            </ActionButton>
            <ActionButton tone="secondary" className="px-3 py-2.5 text-xs" onClick={onCreateNew}>
              New set
            </ActionButton>
          </div>
        </>
      ) : suggestedMeasurementSetLabel ? (
        <>
          <PanelSection title="Latest on file">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-medium text-[var(--app-text)]">{suggestedSet?.title ?? suggestedMeasurementSetLabel}</div>
              {suggestedSet?.version ? <StatusPill tone="dark">{suggestedSet.version}</StatusPill> : null}
            </div>
            <div className="mt-1 text-xs text-[var(--app-text-muted)]">Load this set or choose another one.</div>
          </PanelSection>
          <div className="mt-3 flex items-center gap-2">
            <ActionButton tone="secondary" className="px-3 py-2.5 text-xs" onClick={onUseSuggested}>
              Load latest
            </ActionButton>
            <ActionButton tone="secondary" className="px-3 py-2.5 text-xs" onClick={onChooseAnother}>
              Choose set
            </ActionButton>
            <ActionButton tone="secondary" className="px-3 py-2.5 text-xs" onClick={onCreateNew}>
              New set
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
            <ActionButton tone="secondary" className="px-3 py-2.5 text-xs" onClick={onCreateNew}>
              New set
            </ActionButton>
          </div>
        </>
      )}
    </Card>
  );
}
