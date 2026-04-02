import { Shirt, TriangleAlert } from "lucide-react";
import { ActionButton, Callout, FieldLabel, InlineEmptyState, SectionHeader, StatusPill, Surface, cx } from "../../../components/ui/primitives";
import type { CustomGarmentGender } from "../../../types";
import type { MaterialOption } from "../../../db/referenceData";
import { getCustomGarmentPrice } from "../selectors";

type CustomGarmentBuilderProps = {
  garmentOptionsByGender: Record<CustomGarmentGender, string[]>;
  customMaterialOptionsByKind: Record<"fabric" | "buttons" | "lining" | "threads", MaterialOption[]>;
  jacketBasedCustomGarments: Set<string>;
  lapelOptions: string[];
  pocketTypeOptions: string[];
  canvasOptions: string[];
  selectedGender: CustomGarmentGender | null;
  selectedGarment: string | null;
  isRush: boolean;
  fabricSku: string | null;
  buttonsSku: string | null;
  liningSku: string | null;
  threadsSku: string | null;
  monogramLeft: string;
  monogramCenter: string;
  monogramRight: string;
  pocketType: string | null;
  lapel: string | null;
  canvas: string | null;
  canAddToOrder: boolean;
  addDisabledReason?: string;
  onShowDisabledReason?: (reason: string) => void;
  showValidation?: boolean;
  missingGender?: boolean;
  missingGarment?: boolean;
  missingWearer?: boolean;
  missingMeasurements?: boolean;
  missingBuildDetails?: boolean;
  missingStyleDetails?: boolean;
  isEditing: boolean;
  wearerName?: string | null;
  measurementVersionLabel?: string | null;
  onSelectGender: (gender: CustomGarmentGender) => void;
  onSelectGarment: (garment: string | null) => void;
  onAddToOrder: () => void;
  onCancelEdit: () => void;
  onSetConfiguration: (patch: {
    fabricSku?: string | null;
    buttonsSku?: string | null;
    liningSku?: string | null;
    threadsSku?: string | null;
    monogramLeft?: string;
    monogramCenter?: string;
    monogramRight?: string;
    pocketType?: string | null;
    lapel?: string | null;
    canvas?: string | null;
    isRush?: boolean;
  }) => void;
};

const genderLabels: Record<CustomGarmentGender, string> = {
  male: "Male",
  female: "Female",
};

function StageLabel({ children }: { children: string }) {
  return <div className="app-kicker text-[var(--app-text-muted)]">{children}</div>;
}

function GroupLabel({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <div className="app-text-body font-medium text-[var(--app-text)]">{title}</div>
      {subtitle ? <div className="app-text-caption mt-1">{subtitle}</div> : null}
    </div>
  );
}

function MaterialField({
  label,
  skuValue,
  match,
  onSkuChange,
}: {
  label: string;
  skuValue: string | null;
  match: MaterialOption | null;
  onSkuChange: (value: string | null) => void;
}) {
  return (
    <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 bg-[var(--app-surface)]/58 p-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <FieldLabel>{label}</FieldLabel>
        <span className="app-text-caption text-[var(--app-text-muted)]">SKU required</span>
      </div>
      <div className="mt-3 space-y-2.5">
        <input
          value={skuValue ?? ""}
          onChange={(event) => onSkuChange(event.target.value.trim() ? event.target.value : null)}
          placeholder={`Enter ${label.toLowerCase()} SKU`}
          className="app-input min-h-12 bg-[var(--app-surface)]"
        />
        {match ? (
          <div className="rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)]/26 px-1 py-1">
            <div className="flex items-start gap-3.5">
              <div
                className="h-12 w-12 shrink-0 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] shadow-[var(--app-shadow-xs)]"
                style={match.swatchImage
                  ? {
                    backgroundColor: match.swatch,
                    backgroundImage: `url(${match.swatchImage})`,
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                  }
                  : { backgroundColor: match.swatch }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="app-text-body font-medium text-[var(--app-text)]">{match.label}</div>
                <div className="app-text-caption mt-1">{match.sku}</div>
              </div>
            </div>
            {match.composition || match.yarn || match.weight ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {match.composition ? (
                  <div className="min-w-0">
                    <div className="app-text-overline">Composition</div>
                    <div className="app-text-caption mt-1">{match.composition}</div>
                  </div>
                ) : null}
                {match.yarn ? (
                  <div className="min-w-0">
                    <div className="app-text-overline">Yarn</div>
                    <div className="app-text-caption mt-1">{match.yarn}</div>
                  </div>
                ) : null}
                {match.weight ? (
                  <div className="min-w-0">
                    <div className="app-text-overline">Weight</div>
                    <div className="app-text-caption mt-1">{match.weight}</div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : skuValue ? (
          <div className="app-text-caption rounded-[var(--app-radius-md)] border border-dashed border-[var(--app-border)] px-3 py-2.5 text-[var(--app-text-muted)]">
            No catalog metadata found for this SKU yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ChoiceGrid({
  options,
  selectedValue,
  onSelect,
  columnsClassName,
  showSelectedLabel = false,
}: {
  options: string[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  columnsClassName?: string;
  showSelectedLabel?: boolean;
}) {
  return (
    <div className={cx("grid gap-2.5 md:grid-cols-3", columnsClassName)}>
      {options.map((option) => {
        const isSelected = selectedValue === option;

        return (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className={cx(
              "min-h-12 rounded-[var(--app-radius-md)] border px-4 py-3 text-left transition",
              isSelected && "app-workflow-toggle--active",
              !isSelected &&
                "border-[var(--app-border)]/55 bg-[var(--app-surface)]/34 text-[var(--app-text)] hover:bg-[var(--app-surface)]/48",
              isSelected && "border-[var(--app-border-strong)] bg-[var(--app-surface-muted)]/48 shadow-[var(--app-shadow-xs)]",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="app-text-body font-medium leading-snug">{option}</span>
              {isSelected && showSelectedLabel ? <span className="app-text-overline text-[var(--app-text-muted)]">Selected</span> : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function VerticalOptionList({
  options,
  selectedValue,
  onSelect,
}: {
  options: string[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      {options.map((option) => {
        const isSelected = selectedValue === option;

        return (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className={cx(
              "flex min-h-12 w-full items-center justify-between rounded-[var(--app-radius-md)] border px-4 py-3 text-left transition",
              isSelected
                ? "border-[var(--app-border-strong)] bg-[var(--app-surface-muted)]/48 text-[var(--app-text)] shadow-[var(--app-shadow-xs)]"
                : "border-[var(--app-border)] bg-[var(--app-surface)]/85 text-[var(--app-text-muted)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]",
            )}
          >
            <span className="app-text-body font-medium leading-snug">{option}</span>
            {isSelected ? <span className="app-text-overline text-[var(--app-text-muted)]">Selected</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function CustomGarmentBuilder({
  garmentOptionsByGender,
  customMaterialOptionsByKind,
  jacketBasedCustomGarments,
  lapelOptions,
  pocketTypeOptions,
  canvasOptions,
  selectedGender,
  selectedGarment,
  isRush,
  fabricSku,
  buttonsSku,
  liningSku,
  threadsSku,
  monogramLeft,
  monogramCenter,
  monogramRight,
  pocketType,
  lapel,
  canvas,
  canAddToOrder,
  addDisabledReason,
  onShowDisabledReason,
  showValidation = false,
  missingGender = false,
  missingGarment = false,
  missingWearer = false,
  missingMeasurements = false,
  missingBuildDetails = false,
  missingStyleDetails = false,
  isEditing,
  wearerName,
  measurementVersionLabel,
  onSelectGender,
  onSelectGarment,
  onAddToOrder,
  onCancelEdit,
  onSetConfiguration,
}: CustomGarmentBuilderProps) {
  const garmentOptions = selectedGender ? garmentOptionsByGender[selectedGender] : [];
  const showConfiguration = Boolean(selectedGarment);
  const showJacketStyleOptions = selectedGarment ? jacketBasedCustomGarments.has(selectedGarment) : false;
  const currentSubtotal = getCustomGarmentPrice(selectedGarment);
  const summaryParts = [wearerName, measurementVersionLabel, selectedGarment].filter(Boolean) as string[];
  const showValidationBanner =
    showValidation &&
    (missingGender || missingGarment || missingWearer || missingMeasurements || missingBuildDetails || missingStyleDetails);
  const stageShellClassName =
    "rounded-[var(--app-radius-md)] border border-[var(--app-border)]/70 bg-[var(--app-surface)]/88 px-5 py-5 shadow-[var(--app-shadow-xs)]";
  const getMaterialMatch = (kind: "fabric" | "buttons" | "lining" | "threads", sku: string | null) => {
    if (!sku) {
      return null;
    }

    return customMaterialOptionsByKind[kind].find((option) => option.sku.toLowerCase() === sku.toLowerCase()) ?? null;
  };

  return (
    <>
      <section>
        <SectionHeader
          icon={Shirt}
          title={isEditing ? "Edit item" : "Custom garment"}
          subtitle={isEditing ? "Update wearer, measurements, and build details" : "Build the garment in 3 steps"}
        />

        {showValidationBanner ? (
        <Callout
          tone="danger"
          icon={TriangleAlert}
          title={<StatusPill tone="danger">{isEditing ? "Can't save this yet" : "Can't add this yet"}</StatusPill>}
          className="mb-4"
        >
            <div className="mt-0.5 flex flex-wrap gap-2">
              {missingGender ? <span className="app-text-caption">Gender</span> : null}
              {missingGarment ? <span className="app-text-caption">Garment</span> : null}
              {missingWearer ? <span className="app-text-caption">Wearer</span> : null}
              {missingMeasurements ? <span className="app-text-caption">Measurements</span> : null}
              {missingBuildDetails ? <span className="app-text-caption">Build details</span> : null}
              {missingStyleDetails ? <span className="app-text-caption">Jacket style details</span> : null}
            </div>
          </Callout>
        ) : null}

        <div className="space-y-6">
          <div
            className={cx(
              stageShellClassName,
              showValidation && (missingGender || missingGarment) && "border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/14",
            )}
          >
            <div className="space-y-5">
              <StageLabel>1. Choose garment</StageLabel>

              <div
                className={cx(
                  "pb-5",
                  showValidation && missingGender && "rounded-[var(--app-radius-md)] border border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/18 px-4 py-4",
                )}
              >
                <div className="app-kicker text-[var(--app-text-muted)]">Cut</div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(["male", "female"] as const).map((gender) => (
                    <button
                      key={gender}
                      onClick={() => onSelectGender(gender)}
                      className={cx(
                        "min-h-12 rounded-[var(--app-radius-md)] border px-4 py-3 text-left transition-[background-color,border-color,color,box-shadow]",
                        selectedGender === gender
                          ? "border border-[var(--app-border-strong)] bg-[var(--app-surface-muted)]/48 text-[var(--app-text)] shadow-[var(--app-shadow-xs)]"
                          : "border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/20 text-[var(--app-text-muted)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]",
                      )}
                    >
                      <div className="app-text-body font-semibold text-[var(--app-text)]">{genderLabels[gender]}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-[var(--app-border)]/60 pt-5">
                <FieldLabel>Garment</FieldLabel>
                {selectedGender ? (
                  <div
                    className={cx(
                      "mt-3",
                      showValidation && missingGarment && "rounded-[var(--app-radius-md)] border border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/18 px-4 py-4",
                    )}
                  >
                    <ChoiceGrid
                      options={garmentOptions}
                      selectedValue={selectedGarment}
                      onSelect={onSelectGarment}
                      columnsClassName="md:grid-cols-2 xl:grid-cols-3"
                    />
                  </div>
                ) : (
                  <InlineEmptyState className={cx("mt-3", showValidation && missingGender && "border-[var(--app-danger-border)] text-[var(--app-danger-text)]")}>
                    Select cut first.
                  </InlineEmptyState>
                )}
              </div>
            </div>
          </div>

          <div
            className={cx(
              stageShellClassName,
              showValidation &&
                (missingBuildDetails || missingStyleDetails) &&
                "border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/14",
            )}
          >
            <div className="space-y-5">
              <StageLabel>2. Build details</StageLabel>

              {showConfiguration ? (
                <div className="space-y-6">
                  <div>
                    <GroupLabel title="Materials" subtitle="Enter each material SKU to pull its catalog metadata." />
                    <div className="mt-3 grid gap-4 lg:grid-cols-2">
                      <MaterialField
                        label="Fabric"
                        skuValue={fabricSku}
                        match={getMaterialMatch("fabric", fabricSku)}
                        onSkuChange={(value) => onSetConfiguration({ fabricSku: value })}
                      />
                      <MaterialField
                        label="Buttons"
                        skuValue={buttonsSku}
                        match={getMaterialMatch("buttons", buttonsSku)}
                        onSkuChange={(value) => onSetConfiguration({ buttonsSku: value })}
                      />
                      <MaterialField
                        label="Lining"
                        skuValue={liningSku}
                        match={getMaterialMatch("lining", liningSku)}
                        onSkuChange={(value) => onSetConfiguration({ liningSku: value })}
                      />
                      <MaterialField
                        label="Threads"
                        skuValue={threadsSku}
                        match={getMaterialMatch("threads", threadsSku)}
                        onSkuChange={(value) => onSetConfiguration({ threadsSku: value })}
                      />
                    </div>
                  </div>

                  <div className="border-t border-[var(--app-border-strong)]/55 pt-6">
                    <div className="grid gap-6 xl:grid-cols-[0.76fr_1fr]">
                      <div className="space-y-6">
                        {showJacketStyleOptions ? (
                          <>
                            <div>
                              <GroupLabel title="Construction" subtitle="Pick the internal structure first." />
                              <div className="mt-3">
                                <VerticalOptionList
                                  options={canvasOptions}
                                  selectedValue={canvas}
                                  onSelect={(value) => onSetConfiguration({ canvas: value })}
                                />
                              </div>
                            </div>

                            <div>
                              <GroupLabel title="Lapel" subtitle="Choose the front shape." />
                              <div className="mt-3">
                                <ChoiceGrid
                                  options={lapelOptions}
                                  selectedValue={lapel}
                                  onSelect={(value) => onSetConfiguration({ lapel: value })}
                                  columnsClassName="grid-cols-1 sm:grid-cols-3"
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 bg-[var(--app-surface)]/58 p-4">
                            <GroupLabel title="Style details" subtitle="No additional jacket styling is needed for this garment." />
                          </div>
                        )}
                      </div>

                      <div className="space-y-6 border-t border-[var(--app-border-strong)]/55 pt-6 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
                        {showJacketStyleOptions ? (
                          <div>
                            <GroupLabel title="Pockets" subtitle="Choose the exterior pocket treatment." />
                            <div className="mt-3">
                              <VerticalOptionList
                                options={pocketTypeOptions}
                                selectedValue={pocketType}
                                onSelect={(value) => onSetConfiguration({ pocketType: value })}
                              />
                            </div>
                          </div>
                        ) : null}

                        <div className={cx(showJacketStyleOptions && "border-t border-[var(--app-border-strong)]/55 pt-6 xl:border-t-0 xl:pt-0")}>
                          <GroupLabel title="Monograms" subtitle="Optional placements" />
                          <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            {[
                              { key: "Left", value: monogramLeft, setter: (value: string) => onSetConfiguration({ monogramLeft: value }) },
                              { key: "Center", value: monogramCenter, setter: (value: string) => onSetConfiguration({ monogramCenter: value }) },
                              { key: "Right", value: monogramRight, setter: (value: string) => onSetConfiguration({ monogramRight: value }) },
                            ].map((field) => (
                              <label key={field.key} className="block text-sm">
                                <FieldLabel>{field.key}</FieldLabel>
                                <input
                                  value={field.value}
                                  onChange={(event) => field.setter(event.target.value)}
                                  placeholder="Optional"
                                  className="app-input min-h-12 bg-[var(--app-surface)]"
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <InlineEmptyState className={cx(showValidation && missingGarment && "border-[var(--app-danger-border)] text-[var(--app-danger-text)]")}>
                  Select a garment first.
                </InlineEmptyState>
              )}
            </div>
          </div>
        </div>
      </section>

      <Surface tone="support" className="mt-4 flex flex-wrap items-start justify-between gap-4 p-4 xl:pt-5">
        <div className="min-w-0 flex-1">
          <div className="app-text-body font-medium">{isEditing ? "Current garment" : "Ready to add"}</div>
          <div className="app-text-caption mt-1">
            {summaryParts.length > 0 ? summaryParts.join(" • ") : "Choose the wearer, measurements, and build details."}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ActionButton
            tone="secondary"
            className={cx(
              "min-h-12 px-4 text-sm",
              isRush && "border-[var(--app-danger-border)] bg-[var(--app-danger-bg)] text-[var(--app-danger-text)] hover:bg-[var(--app-danger-bg)]/80",
            )}
            onClick={() => onSetConfiguration({ isRush: !isRush })}
          >
            {isRush ? "Rush item" : "Mark rush"}
          </ActionButton>
          <div className="text-right">
            <div className="app-text-overline">Subtotal</div>
            <div className="app-text-strong mt-1">${currentSubtotal.toFixed(2)}</div>
          </div>
          {isEditing ? (
            <ActionButton tone="secondary" className="min-h-12 px-5 text-sm" onClick={onCancelEdit}>
              Cancel edit
            </ActionButton>
          ) : null}
          <ActionButton
            tone="primary"
            className="min-h-12 min-w-[200px] px-5 text-sm"
            onClick={() => {
              if (!canAddToOrder) {
                if (addDisabledReason && onShowDisabledReason) {
                  onShowDisabledReason(addDisabledReason);
                }
                return;
              }

              onAddToOrder();
            }}
          >
            {isEditing ? "Save item" : "Add to Cart"}
          </ActionButton>
        </div>
      </Surface>
    </>
  );
}
