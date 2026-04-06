import { Search, Shirt, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { ActionButton, Callout, FieldLabel, InlineEmptyState, SectionHeader, StatusPill, cx } from "../../../components/ui/primitives";
import type { CustomGarmentGender } from "../../../types";
import type { MaterialOption } from "../../../db/referenceData";
import {
  getPricingProgramKeyForGarment,
  type CustomPricingTierDefinition,
  type JacketCanvas,
} from "../../../db/customPricingCatalog";
import type {
  CatalogVariationTierPriceView,
  CatalogVariationView,
} from "../../../db/referenceData";
import { getCustomGarmentPrice } from "../selectors";

type CustomGarmentBuilderProps = {
  garmentOptionsByGender: Record<CustomGarmentGender, string[]>;
  customMaterialOptionsByKind: Record<"fabric" | "buttons" | "lining" | "threads", MaterialOption[]>;
  customPricingTiers: CustomPricingTierDefinition[];
  catalogVariations: CatalogVariationView[];
  catalogVariationTierPrices: CatalogVariationTierPriceView[];
  jacketCanvasSurcharges: Record<JacketCanvas, number>;
  jacketBasedCustomGarments: Set<string>;
  customLiningEligibleGarments: Set<string>;
  customLiningSurchargeAmount: number;
  lapelOptions: string[];
  pocketTypeOptions: string[];
  canvasOptions: string[];
  selectedGender: CustomGarmentGender | null;
  selectedGarment: string | null;
  pricingTierKey: string | null;
  isRush: boolean;
  fabricSku: string | null;
  buttonsSku: string | null;
  liningSku: string | null;
  customLiningRequested: boolean;
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
    customLiningRequested?: boolean;
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

function formatCanvasSurchargeLabel(
  option: string,
  surcharges: Record<JacketCanvas, number>,
) {
  const amount = surcharges[option as JacketCanvas] ?? 0;
  return amount > 0 ? `${option} (+$${amount})` : `${option} (included)`;
}

const genderLabels: Record<CustomGarmentGender, string> = {
  male: "Male",
  female: "Female",
};

function StageLabel({ children }: { children: string }) {
  return <div className="app-text-overline text-[var(--app-text-soft)]">{children}</div>;
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
  options,
  onSkuChange,
}: {
  label: string;
  skuValue: string | null;
  match: MaterialOption | null;
  options: MaterialOption[];
  onSkuChange: (value: string | null) => void;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = (skuValue ?? "").trim().toLowerCase();
    if (!normalizedQuery) {
      return options.slice(0, 6);
    }

    const startsWithMatches = options.filter((option) => option.sku.toLowerCase().startsWith(normalizedQuery));
    const containsMatches = options.filter((option) => {
      if (startsWithMatches.some((candidate) => candidate.sku === option.sku)) {
        return false;
      }

      const searchBody = [
        option.sku,
        option.label,
        option.millLabel,
        option.manufacturer,
        option.bookType,
        option.composition,
        option.yarn,
        option.weight,
      ].filter(Boolean).join(" ").toLowerCase();

      return searchBody.includes(normalizedQuery);
    });

    return [...startsWithMatches, ...containsMatches].slice(0, 6);
  }, [options, skuValue]);

  const showSuggestionList = showSuggestions && filteredOptions.length > 0;
  const showMissingCatalogMessage = Boolean(skuValue) && !match && filteredOptions.length === 0;

  return (
    <div className="app-custom-builder__material-card rounded-[var(--app-radius-md)] border border-[var(--app-border)]/52 bg-[var(--app-surface)]/52 p-3">
      <div className="flex items-baseline justify-between gap-3">
        <FieldLabel>{label}</FieldLabel>
        <span className="app-text-caption text-[var(--app-text-soft)]">SKU required</span>
      </div>
      <div className="mt-2.5 space-y-2 app-custom-builder__material-field">
        <div className="app-custom-builder__material-input-shell">
          <Search className="app-custom-builder__material-input-icon h-4 w-4" />
          <input
            value={skuValue ?? ""}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              window.setTimeout(() => setShowSuggestions(false), 120);
            }}
            onChange={(event) => onSkuChange(event.target.value.trim() ? event.target.value : null)}
            placeholder={`Search ${label.toLowerCase()} SKU`}
            className="app-input min-h-12 bg-[var(--app-surface)] app-custom-builder__material-input"
            aria-label={`${label} SKU`}
            aria-autocomplete="list"
            aria-expanded={showSuggestionList}
          />
        </div>
        {showSuggestionList ? (
          <div className="app-custom-builder__material-suggestions" role="listbox" aria-label={`${label} SKU suggestions`}>
            {filteredOptions.map((option) => {
              const isActive = option.sku.toLowerCase() === (skuValue ?? "").trim().toLowerCase();

              return (
                <button
                  key={option.sku}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onSkuChange(option.sku);
                    setShowSuggestions(false);
                  }}
                  className={cx(
                    "app-custom-builder__material-suggestion",
                    isActive && "app-custom-builder__material-suggestion--active",
                  )}
                >
                  <div className="min-w-0">
                    <div className="app-text-body font-medium text-[var(--app-text)]">{option.label}</div>
                    <div className="app-custom-builder__material-sku mt-0.5">{option.sku}</div>
                  </div>
                  <div
                    className="app-custom-builder__material-suggestion-swatch"
                    style={option.swatchImage
                      ? {
                        backgroundColor: option.swatch,
                        backgroundImage: `url(${option.swatchImage})`,
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "cover",
                      }
                      : { backgroundColor: option.swatch }}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        ) : null}
        {match ? (
          <div className="space-y-3 border-t border-[var(--app-border)]/42 pt-3">
            <div className="flex items-start gap-3">
              <div
                className="h-10 w-10 shrink-0 rounded-[var(--app-radius-sm)] border border-[var(--app-border)]"
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
                <div className="app-custom-builder__material-sku mt-0.5">{match.sku}</div>
              </div>
            </div>
            {match.composition || match.yarn || match.weight || match.millLabel || match.pricingTierLabel ? (
                <div className="app-custom-builder__material-meta grid gap-2.5 sm:grid-cols-3">
                {match.pricingTierLabel ? (
                  <div className="app-custom-builder__material-meta-item min-w-0">
                    <div className="app-custom-builder__material-meta-label app-text-overline">Pricing tier</div>
                    <div className="app-custom-builder__material-meta-value app-text-caption mt-0.5">{match.pricingTierLabel}</div>
                  </div>
                ) : null}
                {match.millLabel ? (
                  <div className="app-custom-builder__material-meta-item min-w-0">
                    <div className="app-custom-builder__material-meta-label app-text-overline">Book</div>
                    <div className="app-custom-builder__material-meta-value app-text-caption mt-0.5">{match.millLabel}</div>
                  </div>
                ) : null}
                {match.manufacturer ? (
                  <div className="app-custom-builder__material-meta-item min-w-0">
                    <div className="app-custom-builder__material-meta-label app-text-overline">Mill</div>
                    <div className="app-custom-builder__material-meta-value app-text-caption mt-0.5">{match.manufacturer}</div>
                  </div>
                ) : null}
                {match.composition ? (
                  <div className="app-custom-builder__material-meta-item min-w-0">
                    <div className="app-custom-builder__material-meta-label app-text-overline">Composition</div>
                    <div className="app-custom-builder__material-meta-value app-text-caption mt-0.5">{match.composition}</div>
                  </div>
                ) : null}
                {match.yarn ? (
                  <div className="app-custom-builder__material-meta-item min-w-0">
                    <div className="app-custom-builder__material-meta-label app-text-overline">Yarn</div>
                    <div className="app-custom-builder__material-meta-value app-text-caption mt-0.5">{match.yarn}</div>
                  </div>
                ) : null}
                {match.weight ? (
                  <div className="app-custom-builder__material-meta-item min-w-0">
                    <div className="app-custom-builder__material-meta-label app-text-overline">Weight</div>
                    <div className="app-custom-builder__material-meta-value app-text-caption mt-0.5">{match.weight}</div>
                  </div>
                ) : null}
                {match.hasQrCode !== undefined ? (
                  <div className="app-custom-builder__material-meta-item min-w-0">
                    <div className="app-custom-builder__material-meta-label app-text-overline">QR lookup</div>
                    <div className="app-custom-builder__material-meta-value app-text-caption mt-0.5">
                      {match.hasQrCode ? "Available" : "Not available"}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : showMissingCatalogMessage ? (
          <div className="app-text-caption border-t border-dashed border-[var(--app-border)] px-0 pt-3 text-[var(--app-text-muted)]">
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
  mobileClassName,
  mobileOptionClassName,
  showSelectedLabel = false,
}: {
  options: string[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  columnsClassName?: string;
  mobileClassName?: string;
  mobileOptionClassName?: string;
  showSelectedLabel?: boolean;
}) {
  return (
    <div className={cx("grid gap-2 md:grid-cols-3", mobileClassName, columnsClassName)}>
      {options.map((option) => {
        const isSelected = selectedValue === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={cx(
              "min-h-11 rounded-[var(--app-radius-md)] border px-3.5 py-2.5 text-left transition",
              mobileOptionClassName,
              isSelected && "app-custom-builder__garment-option--active",
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
    <div className="space-y-2">
      {options.map((option) => {
        const isSelected = selectedValue === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={cx(
              "flex min-h-11 w-full items-center justify-between rounded-[var(--app-radius-md)] border px-3.5 py-2.5 text-left transition",
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
  customPricingTiers,
  catalogVariations,
  catalogVariationTierPrices,
  jacketCanvasSurcharges,
  jacketBasedCustomGarments,
  customLiningEligibleGarments,
  customLiningSurchargeAmount,
  lapelOptions,
  pocketTypeOptions,
  canvasOptions,
  selectedGender,
  selectedGarment,
  pricingTierKey,
  isRush,
  fabricSku,
  buttonsSku,
  liningSku,
  customLiningRequested,
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
  const showCustomLiningOption = selectedGarment ? customLiningEligibleGarments.has(selectedGarment) : false;
  const selectedProgramKey = getPricingProgramKeyForGarment(selectedGarment);
  const compatibleFabricOptions = useMemo(() => {
    if (!selectedProgramKey) {
      return customMaterialOptionsByKind.fabric;
    }

    return customMaterialOptionsByKind.fabric.filter((option) => !option.programKey || option.programKey === selectedProgramKey);
  }, [customMaterialOptionsByKind.fabric, selectedProgramKey]);
  const incompatibleFabricMatch = useMemo(() => {
    if (!fabricSku || !selectedProgramKey) {
      return null;
    }

    const normalizedSku = fabricSku.trim().toLowerCase();
    return customMaterialOptionsByKind.fabric.find((option) => (
      option.sku.toLowerCase() === normalizedSku && option.programKey && option.programKey !== selectedProgramKey
    )) ?? null;
  }, [customMaterialOptionsByKind.fabric, fabricSku, selectedProgramKey]);
  const fabricMatch = getMaterialMatch("fabric", fabricSku);
  const currentSubtotal = getCustomGarmentPrice({
    selectedGarment,
    variationLabel: selectedGarment,
    fabricSku,
    pricingTierKey: pricingTierKey ?? fabricMatch?.pricingTierKey ?? null,
    canvas,
    customLiningRequested,
  }, {
    pricingTiers: customPricingTiers,
    fabricOptions: customMaterialOptionsByKind.fabric,
    catalogVariations,
    catalogVariationTierPrices,
    jacketCanvasSurcharges,
    customLiningSurchargeAmount,
  });
  const summaryParts = [wearerName, measurementVersionLabel, selectedGarment].filter(Boolean) as string[];
  const showValidationBanner =
    showValidation &&
    (missingGender || missingGarment || missingWearer || missingMeasurements || missingBuildDetails || missingStyleDetails);
  const stageShellClassName =
    "app-custom-builder__stage rounded-[var(--app-radius-md)] border border-[var(--app-border)]/56 bg-[color-mix(in_srgb,var(--app-surface-muted)_38%,var(--app-surface))] px-5 py-5";
  function getMaterialMatch(kind: "fabric" | "buttons" | "lining" | "threads", sku: string | null) {
    if (!sku) {
      return null;
    }

    const options = kind === "fabric" ? compatibleFabricOptions : customMaterialOptionsByKind[kind];
    return options.find((option) => option.sku.toLowerCase() === sku.toLowerCase()) ?? null;
  }

  return (
    <>
      <section className="app-custom-builder min-w-0">
        <SectionHeader
          icon={Shirt}
          title={isEditing ? "Edit item" : "Custom garment"}
          subtitle={isEditing ? "Update wearer and build details" : "Choose garment and build details"}
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

        <div className="space-y-5">
          <div
            className={cx(
              stageShellClassName,
              showValidation && (missingGender || missingGarment) && "border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/14",
            )}
          >
            <div className="space-y-4.5">
              <StageLabel>Choose garment</StageLabel>

              <div
                className={cx(
                  "app-custom-builder__gender-section pb-4.5",
                  showValidation && missingGender && "rounded-[var(--app-radius-md)] border border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/18 px-4 py-4",
                )}
              >
                <div className="app-text-overline text-[var(--app-text-soft)]">Cut</div>
                <div className="app-custom-builder__gender-grid mt-3 grid grid-cols-2 gap-2">
                  {(["male", "female"] as const).map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => onSelectGender(gender)}
                      className={cx(
                        "app-custom-builder__gender-button min-h-12 rounded-[var(--app-radius-md)] border px-4 py-3 text-left transition-[background-color,border-color,color,box-shadow]",
                        selectedGender === gender && "app-custom-builder__gender-button--active",
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

              <div className="border-t border-[var(--app-border)]/48 pt-4.5">
                <FieldLabel>Garment</FieldLabel>
                {selectedGender ? (
                  <div
                    className={cx(
                      "app-custom-builder__garment-section mt-3",
                      showValidation && missingGarment && "rounded-[var(--app-radius-md)] border border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/18 px-4 py-4",
                    )}
                  >
                    <ChoiceGrid
                      options={garmentOptions}
                      selectedValue={selectedGarment}
                      onSelect={onSelectGarment}
                      mobileClassName="app-custom-builder__garment-grid"
                      mobileOptionClassName="app-custom-builder__garment-option"
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
            <div className="space-y-4.5">
              <StageLabel>Build details</StageLabel>

              {showConfiguration ? (
                <div className="app-custom-builder__build-stack space-y-5">
                  <div>
                    <GroupLabel title="Materials" subtitle="Enter material SKUs." />
                    <div className="app-custom-builder__materials-grid mt-3 grid gap-3 lg:grid-cols-2">
                      <MaterialField
                        label="Fabric"
                        skuValue={fabricSku}
                        match={fabricMatch}
                        options={compatibleFabricOptions}
                        onSkuChange={(value) => onSetConfiguration({ fabricSku: value })}
                      />
                      {incompatibleFabricMatch ? (
                        <Callout tone="warn">
                          <div className="app-text-caption">
                            {incompatibleFabricMatch.sku} is a{" "}
                            {incompatibleFabricMatch.programKey === "custom_shirting" ? "shirting" : "suiting"} fabric and cannot be used for{" "}
                            {selectedGarment ?? "this garment"}.
                          </div>
                        </Callout>
                      ) : null}
                      <MaterialField
                        label="Buttons"
                        skuValue={buttonsSku}
                        match={getMaterialMatch("buttons", buttonsSku)}
                        options={customMaterialOptionsByKind.buttons}
                        onSkuChange={(value) => onSetConfiguration({ buttonsSku: value })}
                      />
                      <MaterialField
                        label="Lining"
                        skuValue={liningSku}
                        match={getMaterialMatch("lining", liningSku)}
                        options={customMaterialOptionsByKind.lining}
                        onSkuChange={(value) => onSetConfiguration({ liningSku: value })}
                      />
                      <MaterialField
                        label="Threads"
                        skuValue={threadsSku}
                        match={getMaterialMatch("threads", threadsSku)}
                        options={customMaterialOptionsByKind.threads}
                        onSkuChange={(value) => onSetConfiguration({ threadsSku: value })}
                      />
                    </div>
                  </div>

                  <div className="app-custom-builder__style-shell border-t border-[var(--app-border-strong)]/44 pt-5">
                    <div className="app-custom-builder__style-grid grid gap-5 xl:grid-cols-[0.76fr_1fr]">
                      <div className="app-custom-builder__style-primary space-y-5">
                        {showCustomLiningOption ? (
                          <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/48 bg-[var(--app-surface)]/46 p-3.5">
                            <GroupLabel title="Lining surcharge" subtitle="Standard lining is included. Use custom printed lining only when needed." />
                            <label className="app-text-caption mt-3 inline-flex items-center gap-2 rounded-[12px] border border-[var(--app-border)]/60 px-3 py-3">
                              <input
                                type="checkbox"
                                checked={customLiningRequested}
                                onChange={(event) => onSetConfiguration({ customLiningRequested: event.target.checked })}
                              />
                              <span>{customLiningRequested ? `Custom printed lining (+$${customLiningSurchargeAmount})` : "Standard lining included"}</span>
                            </label>
                          </div>
                        ) : null}

                        {showJacketStyleOptions ? (
                          <>
                            <div>
                              <GroupLabel title="Construction" subtitle="Pick structure." />
                              <div className="mt-3">
                                <VerticalOptionList
                                  options={canvasOptions.map((option) => formatCanvasSurchargeLabel(option, jacketCanvasSurcharges))}
                                  selectedValue={canvas ? formatCanvasSurchargeLabel(canvas, jacketCanvasSurcharges) : null}
                                  onSelect={(value) => onSetConfiguration({ canvas: value.split(" (")[0] })}
                                />
                              </div>
                            </div>

                            <div>
                              <GroupLabel title="Lapel" subtitle="Choose front shape." />
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
                          <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/48 bg-[var(--app-surface)]/46 p-3.5">
                            <GroupLabel title="Style details" subtitle="No jacket styling needed." />
                          </div>
                        )}
                      </div>

                      <div className="app-custom-builder__style-secondary space-y-5 border-t border-[var(--app-border-strong)]/44 pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                        {showJacketStyleOptions ? (
                          <div>
                            <GroupLabel title="Pockets" subtitle="Choose pocket treatment." />
                            <div className="mt-3">
                              <VerticalOptionList
                                options={pocketTypeOptions}
                                selectedValue={pocketType}
                                onSelect={(value) => onSetConfiguration({ pocketType: value })}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="app-custom-builder__monograms mt-5 border-t border-[var(--app-border-strong)]/44 pt-5">
                      <GroupLabel title="Monograms" />
                      <div className="app-custom-builder__monogram-grid mt-3 grid gap-3 sm:grid-cols-3">
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
              ) : (
                <InlineEmptyState className={cx(showValidation && missingGarment && "border-[var(--app-danger-border)] text-[var(--app-danger-text)]")}>
                  Select a garment first.
                </InlineEmptyState>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="app-order-builder-workspace__footer app-custom-builder__footer mt-4 space-y-3">
        <div className="app-custom-builder__footer-summary flex items-end gap-4">
          <div className="app-custom-builder__footer-label min-w-[9.5rem] shrink-0">
            <div className="app-text-body font-medium">{isEditing ? "Current garment" : "Ready to add"}</div>
          </div>
          <div className="app-custom-builder__footer-detail app-text-body-muted min-w-[14rem] flex-1 whitespace-normal break-words text-right">
            {summaryParts.length > 0 ? (
              <span className="font-semibold text-[var(--app-text)]">{summaryParts.join(" • ")}</span>
            ) : null}
          </div>
        </div>
        <div className="app-custom-builder__footer-actions flex items-center gap-2.5">
          <ActionButton
            tone={isRush ? "danger" : "secondary"}
            className={cx(
              "app-custom-builder__rush-button min-h-10 px-4 py-2 text-sm shrink-0",
              isRush && "shadow-[inset_0_0_0_1px_var(--app-danger-border)]",
            )}
            onClick={() => onSetConfiguration({ isRush: !isRush })}
          >
            {isRush ? "Rushing" : "Rush item"}
          </ActionButton>
          <div className="app-custom-builder__footer-cta ml-auto flex items-center gap-2.5">
            <div className="app-custom-builder__subtotal text-right">
              <div className="app-text-overline">Subtotal</div>
              <div className="app-text-strong mt-0.5">${currentSubtotal.toFixed(2)}</div>
            </div>
            {isEditing ? (
              <ActionButton tone="secondary" className="app-custom-builder__secondary-action min-h-10 px-4 py-2 text-sm" onClick={onCancelEdit}>
                Cancel edit
              </ActionButton>
            ) : null}
            <ActionButton
              tone="primary"
              className="app-custom-builder__primary-action min-h-10 min-w-[160px] px-4 py-2 text-sm"
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
        </div>
      </div>
    </>
  );
}
