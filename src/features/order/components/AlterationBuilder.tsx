import { Scissors, TriangleAlert } from "lucide-react";
import { useState } from "react";
import type { AlterationServiceDefinition, AlterationServiceSelection } from "../../../types";
import { ActionButton, Callout, FieldLabel, InlineEmptyState, ModalShell, SelectionChip, StatusPill, Surface, cx } from "../../../components/ui/primitives";
import { ModalFooterActions } from "../../../components/ui/modalPatterns";
import { getAlterationGarmentVisual } from "../alterationGarmentVisuals";
import {
  ALTERATION_FRACTION_OPTIONS,
  ALTERATION_WHOLE_INCH_OPTIONS,
  composeAlterationAdjustment,
  formatAlterationAdjustment,
  formatAlterationFraction,
  formatAlterationServiceLabel,
  getAlterationAdjustmentParts,
} from "../alterationAdjustments";

type AlterationBuilderProps = {
  garmentOptions: string[];
  selectedGarment: string;
  currentServices: AlterationServiceDefinition[];
  selectedModifiers: AlterationServiceSelection[];
  selectedRush: boolean;
  currentSubtotal: number;
  isEditing: boolean;
  editingLabel?: string | null;
  addDisabledReason?: string;
  onShowDisabledReason?: (reason: string) => void;
  showValidation?: boolean;
  missingGarment?: boolean;
  missingServices?: boolean;
  missingAdjustments?: boolean;
  onSelectGarment: (garment: string) => void;
  onToggleModifier: (modifier: AlterationServiceDefinition) => void;
  onSetModifierAdjustment: (modifierId: string, deltaInches: number | null) => void;
  onToggleRush: () => void;
  onAddItem: () => void;
  onCancelEdit: () => void;
};

type AdjustmentComposerProps = {
  service: AlterationServiceSelection;
  showValidation: boolean;
  missingAdjustments: boolean;
  onSetModifierAdjustment: (modifierId: string, deltaInches: number | null) => void;
};

function adjustmentButtonClass(isActive: boolean) {
  return cx(
    "inline-flex h-9 min-w-[2.75rem] items-center justify-center rounded-[var(--app-radius-sm)] border px-2.5 text-[0.78rem] font-semibold transition",
    isActive
      ? "border-[var(--app-accent)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
      : "border-[var(--app-border)]/70 bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-text)]",
  );
}

function AdjustmentComposer({
  service,
  showValidation,
  missingAdjustments,
  onSetModifierAdjustment,
}: AdjustmentComposerProps) {
  const { sign, wholeInches, fraction } = getAlterationAdjustmentParts(service.deltaInches);
  const currentValue = service.deltaInches === null ? "Not set yet" : formatAlterationAdjustment(service.deltaInches);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-4 rounded-[var(--app-radius-sm)] bg-[var(--app-surface)]/38 px-1 py-1">
        <div className="min-w-0">
          <div className="app-text-overline text-[var(--app-text-soft)]">{service.name}</div>
        </div>
        <div className="shrink-0 text-right text-[1.45rem] font-semibold tracking-[-0.02em] text-[var(--app-text)]">
          {currentValue}
        </div>
      </div>

      <div
        className={cx(
          "space-y-3 rounded-[var(--app-radius-md)] border bg-[var(--app-surface-muted)]/22 px-3.5 py-3.5",
          showValidation && missingAdjustments && service.deltaInches === null
            ? "border-[var(--app-danger-border)]"
            : "border-[var(--app-border)]/55",
        )}
      >
        <div className="grid gap-2 sm:grid-cols-[78px_minmax(0,1fr)] sm:items-center">
          <div className="app-text-overline text-[var(--app-text-soft)]">Direction</div>
          <div className="flex gap-2">
            {([
              { value: -1 as const, label: "-" },
              { value: 1 as const, label: "+" },
            ]).map((option) => (
              <button
                key={`${service.id}-sign-${option.label}`}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSetModifierAdjustment(service.id, composeAlterationAdjustment(option.value, wholeInches, fraction));
                }}
                className={cx(adjustmentButtonClass(sign === option.value && service.deltaInches !== null), "min-w-[3rem]")}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-[78px_minmax(0,1fr)] sm:items-start">
          <div className="app-text-overline text-[var(--app-text-soft)]">Length</div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {ALTERATION_WHOLE_INCH_OPTIONS.map((option) => (
                <button
                  key={`${service.id}-whole-${option}`}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSetModifierAdjustment(service.id, composeAlterationAdjustment(sign, option, fraction));
                  }}
                  className={adjustmentButtonClass(wholeInches === option && service.deltaInches !== null)}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {ALTERATION_FRACTION_OPTIONS.map((option) => (
                <button
                  key={`${service.id}-fraction-${option}`}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSetModifierAdjustment(service.id, composeAlterationAdjustment(sign, wholeInches, option));
                  }}
                  className={adjustmentButtonClass(Math.abs(fraction - option) < 0.0001 && service.deltaInches !== null)}
                >
                  {formatAlterationFraction(option)}
                </button>
              ))}
            </div>
          </div>
        </div>
        {showValidation && missingAdjustments && service.deltaInches === null ? (
          <Callout tone="danger">
            <div className="app-text-caption">Set the requested adjustment before saving this item.</div>
          </Callout>
        ) : null}
      </div>
    </div>
  );
}

export function AlterationBuilder({
  garmentOptions,
  selectedGarment,
  currentServices,
  selectedModifiers,
  selectedRush,
  currentSubtotal,
  isEditing,
  editingLabel,
  addDisabledReason,
  onShowDisabledReason,
  showValidation = false,
  missingGarment = false,
  missingServices = false,
  missingAdjustments = false,
  onSelectGarment,
  onToggleModifier,
  onSetModifierAdjustment,
  onToggleRush,
  onAddItem,
  onCancelEdit,
}: AlterationBuilderProps) {
  const [activeAdjustmentModifierId, setActiveAdjustmentModifierId] = useState<string | null>(null);
  const selectedServiceSummary = selectedModifiers.map((modifier) => formatAlterationServiceLabel(modifier)).join(", ");
  const showValidationBanner = showValidation && (missingGarment || missingServices || missingAdjustments);
  const activeAdjustmentService =
    activeAdjustmentModifierId === null
      ? null
      : selectedModifiers.find((modifier) => modifier.id === activeAdjustmentModifierId) ?? null;

  return (
    <Surface tone="work" className="flex flex-col p-4">
      <div className="mb-4 flex items-start gap-3">
        <Scissors className="mt-0.5 h-4 w-4 text-[var(--app-text-soft)]" />
        <div>
          <h2 className="app-section-title">{isEditing ? "Edit item" : "Alterations"}</h2>
          <p className="app-section-copy">{isEditing ? "Update the garment and services" : "Choose the garment and services"}</p>
        </div>
      </div>

      {showValidationBanner ? (
        <Callout
          tone="danger"
          icon={TriangleAlert}
          title={<StatusPill tone="danger">{isEditing ? "Can't save this yet" : "Can't add this yet"}</StatusPill>}
          className="mb-4"
        >
          <div className="app-text-caption">
            {missingGarment && missingServices
              ? "Choose a garment and at least one alteration service to build this line item."
              : missingGarment
                ? "Choose the garment first."
                : missingServices
                  ? "Pick at least one alteration service for this garment."
                  : "Choose the requested adjustment before saving this item."}
          </div>
        </Callout>
      ) : null}

      <div
        className={cx(
          "mb-4 rounded-[var(--app-radius-md)]",
          showValidation && missingGarment && "border border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/30 px-3 py-3",
        )}
      >
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <div className="app-text-overline">Select garment</div>
            <div className="app-text-body-muted mt-1">Choose the garment before selecting services.</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {garmentOptions.map((garment) => {
            const { icon: GarmentIcon } = getAlterationGarmentVisual(garment);
            const isSelected = selectedGarment === garment;

            return (
              <SelectionChip
                key={garment}
                selected={isSelected}
                onClick={() => onSelectGarment(garment)}
                leading={
                  <GarmentIcon
                    className={cx(
                      "h-4.5 w-4.5",
                      isSelected ? "text-[var(--app-accent)]" : "text-[var(--app-text-soft)]",
                    )}
                  />
                }
                className={cx(
                  "min-h-11 min-w-[10.75rem] justify-start rounded-[var(--app-radius-sm)] px-3.5 py-2.5 text-sm font-semibold",
                  isSelected
                    ? "border-[var(--app-accent)] bg-[var(--app-surface)] text-[var(--app-text)]"
                    : "border-[var(--app-border)]/70 bg-transparent text-[var(--app-text-muted)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-text)]",
                )}
              >
                {garment}
              </SelectionChip>
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
            "mb-3.5 flex flex-col rounded-[var(--app-radius-md)] border border-[var(--app-border)]/65 bg-[var(--app-surface-muted)]/18 p-3.5",
            showValidation && (missingServices || missingAdjustments) && "border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/26",
          )}
        >
          <div className="mb-3 flex items-end justify-between gap-3 border-b border-[var(--app-border-strong)]/45 pb-3">
            <div>
              <div className="app-text-overline">Services</div>
              <div className="app-text-body-muted mt-1">Available work for {selectedGarment.toLowerCase()}.</div>
            </div>
            <div className="app-text-overline text-[var(--app-text)]">{selectedModifiers.length} selected</div>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {currentServices.map((service) => {
              const selectedModifier = selectedModifiers.find((modifier) => modifier.id === service.id) ?? null;
              const isSelected = Boolean(selectedModifier);

              return (
                <div
                  key={`${selectedGarment}-${service.name}`}
                  className={cx(
                    "flex min-h-[6.25rem] flex-col rounded-[var(--app-radius-sm)] border px-3 pt-2.5 pb-0 transition-colors",
                    isSelected
                      ? "border-[var(--app-accent)] bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]"
                      : "border-[var(--app-border)]/65 bg-[var(--app-surface)]/88",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onToggleModifier(service);
                      if (!isSelected && service.supportsAdjustment) {
                        setActiveAdjustmentModifierId(service.id);
                      }
                      if (isSelected && activeAdjustmentModifierId === service.id) {
                        setActiveAdjustmentModifierId(null);
                      }
                    }}
                    className="mb-2 flex items-start justify-between gap-3 text-left"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="app-text-body text-[0.95rem] font-semibold leading-snug text-[var(--app-text)]">{service.name}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="app-text-overline text-[var(--app-text-soft)]">Price</div>
                      <div className="app-text-strong mt-1">${service.price.toFixed(2)}</div>
                    </div>
                  </button>

                  {isSelected && service.supportsAdjustment && selectedModifier ? (
                    <>
                      <div className="mb-2 flex items-center justify-between gap-2 rounded-[var(--app-radius-sm)] bg-[var(--app-surface-muted)]/28 px-2.5 py-2">
                        <div className="min-w-0">
                          <div className="app-text-overline text-[var(--app-text-soft)]">Adjustment</div>
                          <div className="app-text-caption mt-0.5 text-[var(--app-text)]">
                            {selectedModifier.deltaInches === null ? "Not set yet" : formatAlterationAdjustment(selectedModifier.deltaInches)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setActiveAdjustmentModifierId(service.id);
                          }}
                          className={cx(
                            "inline-flex h-8 shrink-0 items-center justify-center rounded-[var(--app-radius-sm)] border px-2.5 text-[0.72rem] font-medium transition",
                            activeAdjustmentModifierId === service.id
                              ? "border-[var(--app-accent)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
                              : "border-[var(--app-border)]/70 bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-text)]",
                          )}
                        >
                          Adjust
                        </button>
                      </div>
                    </>
                  ) : null}

                  <div className="mt-auto grid h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-[var(--app-border)]/45">
                    <div className="app-text-caption min-w-0">
                      {isSelected && selectedModifier?.deltaInches !== null && service.supportsAdjustment
                        ? formatAlterationAdjustment(selectedModifier.deltaInches)
                        : service.supportsAdjustment
                          ? "Set length"
                          : "Standard charge"}
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleModifier(service)}
                      className={cx(
                        "inline-flex h-8 min-w-[3.75rem] shrink-0 items-center justify-center rounded-[var(--app-radius-sm)] border px-2.5 text-[0.72rem] font-medium tracking-[0.01em] transition",
                        isSelected
                          ? "border-[var(--app-accent)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
                          : "border-[var(--app-primary-button)] bg-[var(--app-primary-button)] text-[var(--app-primary-button-contrast)]",
                      )}
                    >
                      {isSelected ? "Selected" : "Add"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {showValidation && missingServices ? (
            <div className="mt-3 app-text-caption text-[var(--app-danger-text)]">Choose at least one service before adding this alteration to the cart.</div>
          ) : null}
          {showValidation && missingAdjustments ? (
            <div className="mt-3 app-text-caption text-[var(--app-danger-text)]">Choose an adjustment for each selected service that requires one.</div>
          ) : null}
        </div>
      ) : null}

      <Surface tone="support" className="mt-4 flex flex-wrap items-start justify-between gap-4 p-4 xl:pt-5">
        <div className="shrink-0">
          <div className="app-text-body font-medium">Current item</div>
          <div className="app-text-caption mt-1">
            {selectedGarment && selectedModifiers.length > 0 ? "Ready to add" : "Choose the garment and services"}
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
          <ActionButton
            tone="secondary"
            className={cx(
              "min-h-10 px-3 py-2 text-xs",
              selectedRush && "border-[var(--app-danger-border)] bg-[var(--app-danger-bg)] text-[var(--app-danger-text)] hover:bg-[var(--app-danger-bg)]/80",
            )}
            onClick={onToggleRush}
          >
            {selectedRush ? "Rush item" : "Mark rush"}
          </ActionButton>
          <div className="app-text-value">${currentSubtotal.toFixed(2)}</div>
          {isEditing ? (
            <ActionButton
              tone="secondary"
              className="min-h-10 px-3 py-2 text-xs"
              onClick={onCancelEdit}
            >
              Cancel edit
            </ActionButton>
          ) : null}
          <ActionButton
            tone="primary"
            onClick={() => {
              if (!selectedGarment || selectedModifiers.length === 0 || missingAdjustments) {
                if (addDisabledReason && onShowDisabledReason) {
                  onShowDisabledReason(addDisabledReason);
                }
                return;
              }

              onAddItem();
            }}
          >
            {isEditing ? "Save item" : "Add to Cart"}
          </ActionButton>
        </div>
      </Surface>

      {activeAdjustmentService ? (
        <ModalShell
          title={`Adjust ${activeAdjustmentService.name}`}
          subtitle={undefined}
          onClose={() => setActiveAdjustmentModifierId(null)}
          widthClassName="max-w-[500px]"
          footer={
            <ModalFooterActions
              leading={<div className="app-text-caption">Base price ${activeAdjustmentService.price.toFixed(2)}</div>}
            >
              {activeAdjustmentService.deltaInches !== null ? (
                <ActionButton
                  tone="secondary"
                  onClick={() => onSetModifierAdjustment(activeAdjustmentService.id, null)}
                >
                  Clear
                </ActionButton>
              ) : null}
              <ActionButton tone="primary" onClick={() => setActiveAdjustmentModifierId(null)}>
                Done
              </ActionButton>
            </ModalFooterActions>
          }
        >
          <AdjustmentComposer
            service={activeAdjustmentService}
            showValidation={showValidation}
            missingAdjustments={missingAdjustments}
            onSetModifierAdjustment={onSetModifierAdjustment}
          />
        </ModalShell>
      ) : null}
    </Surface>
  );
}
