import { Scissors, TriangleAlert } from "lucide-react";
import type { AlterationService } from "../../../types";
import { ActionButton, Card, FieldLabel, InlineEmptyState, SectionHeader, StatusPill, cx } from "../../../components/ui/primitives";
import { getAlterationGarmentVisual } from "../alterationGarmentVisuals";
import { getAlterationServiceIcon, getAlterationServiceIconClassName } from "../alterationServiceVisuals";

type AlterationBuilderProps = {
  garmentOptions: string[];
  selectedGarment: string;
  currentServices: AlterationService[];
  selectedModifiers: AlterationService[];
  currentSubtotal: number;
  addDisabledReason?: string;
  onShowDisabledReason?: (reason: string) => void;
  showValidation?: boolean;
  missingGarment?: boolean;
  missingServices?: boolean;
  onSelectGarment: (garment: string) => void;
  onToggleModifier: (modifier: AlterationService) => void;
  onAddItem: () => void;
};

export function AlterationBuilder({
  garmentOptions,
  selectedGarment,
  currentServices,
  selectedModifiers,
  currentSubtotal,
  addDisabledReason,
  onShowDisabledReason,
  showValidation = false,
  missingGarment = false,
  missingServices = false,
  onSelectGarment,
  onToggleModifier,
  onAddItem,
}: AlterationBuilderProps) {
  const selectedServiceSummary = selectedModifiers.map((modifier) => modifier.name).join(", ");
  const showValidationBanner = showValidation && (missingGarment || missingServices);

  return (
    <Card className="flex h-full min-h-0 flex-col p-4">
      <SectionHeader icon={Scissors} title="Alteration intake" subtitle="Build line item" />

      {showValidationBanner ? (
        <div className="mb-4 flex items-start gap-3 rounded-[var(--app-radius-md)] border border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/55 px-4 py-3">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--app-danger-text)]" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="danger">Add to cart is blocked</StatusPill>
            </div>
            <div className="mt-2 app-text-caption text-[var(--app-danger-text)]">
              {missingGarment && missingServices
                ? "Choose a garment and at least one alteration service to build this line item."
                : missingGarment
                  ? "Choose the garment first."
                  : "Pick at least one alteration service for this garment."}
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={cx(
          "mb-4 rounded-[var(--app-radius-md)]",
          showValidation && missingGarment && "border border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/30 px-3 py-3",
        )}
      >
        <FieldLabel>Select garment</FieldLabel>
        <div className="grid gap-2 md:grid-cols-6">
          {garmentOptions.map((garment) => {
            const { icon: GarmentIcon, chipClassName } = getAlterationGarmentVisual(garment);

            return (
              <button
                key={garment}
                onClick={() => onSelectGarment(garment)}
                className={`flex min-h-12 items-center gap-2 border px-3 py-3 text-left leading-none ${
                  selectedGarment === garment ? "app-workflow-toggle app-workflow-toggle--active" : "app-workflow-toggle"
                }`}
              >
                <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--app-radius-sm)] border ${chipClassName}`}>
                  <GarmentIcon className="h-4 w-4" />
                </span>
                <span className="app-text-body font-medium">{garment}</span>
              </button>
            );
          })}
        </div>
        {!selectedGarment ? (
          <InlineEmptyState className={cx("mt-3", showValidation && missingGarment && "border-[var(--app-danger-border)] text-[var(--app-danger-text)]")}>
            Select a garment.
          </InlineEmptyState>
        ) : null}
      </div>

      {selectedGarment ? (
        <div
          className={cx(
            "rounded-[var(--app-radius-md)]",
            showValidation && missingServices && "border border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/30 px-3 py-3",
          )}
        >
          <div className="grid min-h-0 flex-1 auto-rows-[7.5rem] gap-2 overflow-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
            {currentServices.map((service) => {
              const isSelected = selectedModifiers.some((modifier) => modifier.name === service.name);
              const ServiceIcon = getAlterationServiceIcon(service.name);

              return (
                <button
                  key={`${selectedGarment}-${service.name}`}
                  onClick={() => onToggleModifier(service)}
                  className={`flex h-full min-h-[7.5rem] flex-col border px-3 py-3 text-left ${
                    isSelected ? "app-workflow-toggle app-workflow-toggle--active" : "app-workflow-toggle"
                  }`}
                >
                  <div className="mb-2 flex min-h-[2.75rem] items-start justify-between gap-2">
                    <div className="app-text-body font-medium leading-snug">{service.name}</div>
                    <div className={getAlterationServiceIconClassName(service.name)}>
                      <ServiceIcon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <div className="app-text-caption">Standard charge</div>
                    <div className="app-text-strong">${service.price.toFixed(2)}</div>
                  </div>
                </button>
              );
            })}
          </div>
          {showValidation && missingServices ? (
            <div className="mt-3 app-text-caption text-[var(--app-danger-text)]">Choose at least one service before adding this alteration to the cart.</div>
          ) : null}
        </div>
      ) : null}

      <div className="app-panel-section mt-4 xl:mt-5 flex flex-wrap items-start justify-between gap-3">
        <div className="shrink-0">
          <div className="app-text-body font-medium">Current item</div>
          <div className="app-text-caption mt-1">
            {selectedGarment && selectedModifiers.length > 0 ? "Ready to add" : "Build the line item"}
          </div>
        </div>
        <div className="app-text-body-muted min-w-[16rem] flex-1 self-center whitespace-normal break-words pt-0.5 text-right">
          {selectedGarment ? (
            <>
              <span className="font-semibold text-[var(--app-text)]">{selectedGarment}</span>
              {selectedServiceSummary ? <span>{` • ${selectedServiceSummary}`}</span> : null}
            </>
          ) : (
            "Select a garment and at least one service."
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 self-center">
          <div className="app-text-value">${currentSubtotal.toFixed(2)}</div>
          <ActionButton
            tone="primary"
            disabled={!selectedGarment || selectedModifiers.length === 0}
            disabledReason={addDisabledReason}
            onDisabledPress={onShowDisabledReason}
            onClick={onAddItem}
          >
            Add to Cart
          </ActionButton>
        </div>
      </div>
    </Card>
  );
}
