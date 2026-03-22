import { Ruler, TriangleAlert } from "lucide-react";
import { ActionButton, Card, EmptyState, SectionHeader, StatusPill } from "../../../components/ui/primitives";
import type { CustomMeasurementsCardModel } from "../../measurements/types";

type MeasurementsCardProps = {
  model: CustomMeasurementsCardModel;
  showValidation?: boolean;
  missingWearer?: boolean;
  missingMeasurementSet?: boolean;
  onChooseWearer: () => void;
  onChooseAnother: () => void;
  onCreateNew: () => void;
};

export function MeasurementsCard({
  model,
  showValidation = false,
  missingWearer = false,
  missingMeasurementSet = false,
  onChooseWearer,
  onChooseAnother,
  onCreateNew,
}: MeasurementsCardProps) {
  const showValidationBanner = showValidation && (missingWearer || missingMeasurementSet);
  const wearerBlock =
    model.kind === "no_wearer" ? null : (
      <div className="grid gap-3 rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/32 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div>
          <div className="app-text-overline">Wearer</div>
          <div className="app-text-value mt-1">{model.customer.name}</div>
          <div className="app-text-caption mt-1">{model.customer.phone}</div>
        </div>
        <ActionButton tone="secondary" className="min-h-12 px-4 py-2.5 text-sm" onClick={onChooseWearer}>
          Change wearer
        </ActionButton>
      </div>
    );

  const linkedSetBlock =
    model.kind !== "linked" ? null : (
      <div className="grid gap-4 rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/32 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div>
          <div className="app-text-overline">Measurement set</div>
          <div className="mt-1 flex items-start gap-3">
            <div className="min-w-0">
              <div className="app-text-value">{model.set.title}</div>
              <div className="app-text-caption mt-1">{model.set.status ?? "Attached to this order."}</div>
              {model.set.subline ? <div className="app-text-overline mt-1">{model.set.subline}</div> : null}
            </div>
            <StatusPill tone="dark">{model.set.version}</StatusPill>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ActionButton tone="secondary" className="min-h-12 px-4 py-2.5 text-sm" onClick={onChooseAnother}>
            Choose set
          </ActionButton>
          <ActionButton tone="secondary" className="min-h-12 px-4 py-2.5 text-sm" onClick={onCreateNew}>
            New set
          </ActionButton>
        </div>
      </div>
    );

  const unlinkedSetBlock =
    model.kind === "linked" || model.kind === "no_wearer" ? null : (
      <div className="grid gap-4 rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/32 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div>
          <div className="app-text-overline">Measurement set</div>
          <div className="app-text-body mt-1 font-medium">
            {model.hasHistory ? "No measurement set linked" : "No measurements on file"}
          </div>
          <div className="app-text-caption mt-1">
            {model.hasHistory ? "Choose an existing set or create a new one for this wearer." : "Create a measurement set to continue this custom garment."}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {model.hasHistory ? (
            <ActionButton tone="secondary" className="min-h-12 px-4 py-2.5 text-sm" onClick={onChooseAnother}>
              Choose set
            </ActionButton>
          ) : null}
          <ActionButton tone="secondary" className="min-h-12 px-4 py-2.5 text-sm" onClick={onCreateNew}>
            New set
          </ActionButton>
        </div>
      </div>
    );

  return (
    <Card className="p-4">
      <SectionHeader icon={Ruler} title="Measurements" subtitle="Wearer and linked set" />

      {showValidationBanner ? (
        <div className="mb-4 flex items-start gap-3 rounded-[var(--app-radius-md)] border border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/55 px-4 py-3">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--app-danger-text)]" />
          <div className="min-w-0">
            <StatusPill tone="danger">Measurement setup incomplete</StatusPill>
            <div className="mt-2 app-text-caption text-[var(--app-danger-text)]">
              {missingWearer && missingMeasurementSet
                ? "Choose the wearer and link a measurement set before adding this custom garment."
                : missingWearer
                  ? "Choose the wearer before continuing."
                  : "Choose or create a measurement set before continuing."}
            </div>
          </div>
        </div>
      ) : null}

      {model.kind === "no_wearer" ? (
        <>
          <EmptyState className={showValidation && missingWearer ? "border-[var(--app-danger-border)] text-[var(--app-danger-text)]" : ""}>
            Select a wearer first.
          </EmptyState>
          <div className="mt-3 flex items-center gap-2">
            <ActionButton tone="secondary" className="min-h-12 px-4 py-2.5 text-sm" onClick={onChooseWearer}>
              Choose wearer
            </ActionButton>
          </div>
        </>
      ) : model.kind === "linked" ? (
        <div className="space-y-3">
          {wearerBlock}
          {linkedSetBlock}
        </div>
      ) : (
        <div className="space-y-3">
          {wearerBlock}
          <div className={showValidation && missingMeasurementSet ? "rounded-[var(--app-radius-md)] border border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/30 p-3" : ""}>
            {unlinkedSetBlock}
          </div>
        </div>
      )}
    </Card>
  );
}
