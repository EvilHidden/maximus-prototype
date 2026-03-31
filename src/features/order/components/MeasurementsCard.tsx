import { Ruler, TriangleAlert } from "lucide-react";
import { ActionButton, Callout, EmptyState, StatusPill } from "../../../components/ui/primitives";
import { MeasurementVersionPill } from "../../../components/ui/pills";
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
      <div className="grid gap-3 px-1 py-1 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div>
          <div className="app-kicker text-[var(--app-text-muted)]">Wearer</div>
          <div className="app-text-strong mt-1">{model.customer.name}</div>
          <div className="app-text-caption mt-1">{model.customer.phone}</div>
        </div>
        <ActionButton tone="secondary" className="min-h-10 px-3.5 py-2 text-sm" onClick={onChooseWearer}>
          Change wearer
        </ActionButton>
      </div>
    );

  const linkedSetBlock =
    model.kind !== "linked" ? null : (
      <div className="grid gap-4 px-1 py-1 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div>
          <div className="app-kicker text-[var(--app-text-muted)]">Measurement set</div>
          <div className="mt-1 flex items-start gap-3">
            <div className="min-w-0">
              <div className="app-text-strong">{model.set.title}</div>
              <div className="app-text-caption mt-1">{model.set.status ?? "Attached to this order."}</div>
              {model.set.subline ? <div className="app-text-caption mt-1">{model.set.subline}</div> : null}
            </div>
            <MeasurementVersionPill version={model.set.version} isCurrent />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ActionButton tone="secondary" className="min-h-10 px-3.5 py-2 text-sm" onClick={onChooseAnother}>
            Choose set
          </ActionButton>
          <ActionButton tone="secondary" className="min-h-10 px-3.5 py-2 text-sm" onClick={onCreateNew}>
            New set
          </ActionButton>
        </div>
      </div>
    );

  const unlinkedSetBlock =
    model.kind === "linked" || model.kind === "no_wearer" ? null : (
      <div className="grid gap-4 px-1 py-1 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div>
          <div className="app-kicker text-[var(--app-text-muted)]">Measurement set</div>
          <div className="app-text-body mt-1 font-medium">
            {model.hasHistory ? "No measurement set chosen" : "No measurements saved yet"}
          </div>
          <div className="app-text-caption mt-1">
            {model.hasHistory ? "Choose an existing set or create a new one for this wearer." : "Create a measurement set to continue this custom garment."}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {model.hasHistory ? (
            <ActionButton tone="secondary" className="min-h-10 px-3.5 py-2 text-sm" onClick={onChooseAnother}>
              Choose set
            </ActionButton>
          ) : null}
          <ActionButton tone="secondary" className="min-h-10 px-3.5 py-2 text-sm" onClick={onCreateNew}>
            New set
          </ActionButton>
        </div>
      </div>
    );

  return (
    <section>
      <div className="mb-3 flex items-start gap-3">
        <div className="app-icon-chip">
          <Ruler className="h-4 w-4" />
        </div>
        <div>
          <div className="app-kicker text-[var(--app-text-muted)]">Measurements</div>
          <div className="app-text-body-muted mt-1">Wearer and linked set</div>
        </div>
      </div>

      {showValidationBanner ? (
        <Callout
          tone="danger"
          icon={TriangleAlert}
          title={<StatusPill tone="danger">Measurements needed</StatusPill>}
          className="mb-4"
        >
          <div className="app-text-caption">
            {missingWearer && missingMeasurementSet
              ? "Choose the wearer and link a measurement set before adding this custom garment."
              : missingWearer
                ? "Choose the wearer before continuing."
                : "Choose or create a measurement set before continuing."}
          </div>
        </Callout>
      ) : null}

      {model.kind === "no_wearer" ? (
        <>
          <EmptyState className={showValidation && missingWearer ? "border-[var(--app-danger-border)] text-[var(--app-danger-text)]" : ""}>
            Select a wearer first.
          </EmptyState>
          <div className="mt-3 flex items-center gap-2">
            <ActionButton tone="secondary" className="min-h-10 px-3.5 py-2 text-sm" onClick={onChooseWearer}>
              Choose wearer
            </ActionButton>
          </div>
        </>
      ) : model.kind === "linked" ? (
        <div className="divide-y divide-[var(--app-border-strong)]/55 rounded-[var(--app-radius-md)] border border-[var(--app-border-strong)]/70 bg-[var(--app-surface-muted)]/28 px-4">
          <div className="py-4">{wearerBlock}</div>
          <div className="py-4">{linkedSetBlock}</div>
        </div>
      ) : (
        <div className="divide-y divide-[var(--app-border-strong)]/55 rounded-[var(--app-radius-md)] border border-[var(--app-border-strong)]/70 bg-[var(--app-surface-muted)]/28 px-4">
          <div className="py-4">{wearerBlock}</div>
          {showValidation && missingMeasurementSet ? (
            <div className="py-4">
              <div className="rounded-[var(--app-radius-md)] border border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/30 px-4 py-3">
                {unlinkedSetBlock}
              </div>
            </div>
          ) : (
            <div className="py-4">{unlinkedSetBlock}</div>
          )}
        </div>
      )}
    </section>
  );
}
