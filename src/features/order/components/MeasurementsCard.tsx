import { Ruler } from "lucide-react";
import { ActionButton, Card, EmptyState, PanelSection, SectionHeader, StatusPill } from "../../../components/ui/primitives";
import type { CustomMeasurementsCardModel } from "../../measurements/types";

type MeasurementsCardProps = {
  model: CustomMeasurementsCardModel;
  onChooseAnother: () => void;
  onCreateNew: () => void;
};

export function MeasurementsCard({
  model,
  onChooseAnother,
  onCreateNew,
}: MeasurementsCardProps) {
  return (
    <Card className="p-4">
      <SectionHeader icon={Ruler} title="Measurements" subtitle="Linked set" />

      {model.kind === "no_customer" ? (
        <EmptyState>Select a customer first.</EmptyState>
      ) : model.kind === "linked" ? (
        <>
          <PanelSection>
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-medium text-[var(--app-text)]">{model.set.title}</div>
              <StatusPill tone="dark">{model.set.version}</StatusPill>
            </div>
            <div className="mt-1 text-xs text-[var(--app-text-muted)]">{model.set.status ?? "Attached to this order."}</div>
            {model.set.subline ? <div className="mt-1 text-xs text-[var(--app-text-soft)]">{model.set.subline}</div> : null}
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
      ) : model.hasHistory ? (
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
      ) : (
        <>
          <EmptyState>No measurements on file.</EmptyState>
          <div className="mt-3 flex items-center gap-2">
            <ActionButton tone="secondary" className="px-3 py-2.5 text-xs" onClick={onCreateNew}>
              New set
            </ActionButton>
          </div>
        </>
      )}
    </Card>
  );
}
