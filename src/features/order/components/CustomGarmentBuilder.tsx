import { CheckSquare, Layers3, Shirt, TriangleAlert, Type } from "lucide-react";
import { ActionButton, FieldLabel, InlineEmptyState, SectionHeader, StatusPill, cx } from "../../../components/ui/primitives";
import { jacketBasedCustomGarments } from "../../../data";
import type { CustomGarmentGender } from "../../../types";
import { getCustomGarmentPrice } from "../selectors";

type CustomGarmentBuilderProps = {
  garmentOptionsByGender: Record<CustomGarmentGender, string[]>;
  lapelOptions: string[];
  pocketTypeOptions: string[];
  canvasOptions: string[];
  selectedGender: CustomGarmentGender | null;
  selectedGarment: string | null;
  fabric: string | null;
  buttons: string | null;
  lining: string | null;
  threads: string | null;
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
  editingLabel?: string | null;
  wearerName?: string | null;
  onSelectGender: (gender: CustomGarmentGender) => void;
  onSelectGarment: (garment: string | null) => void;
  onAddToOrder: () => void;
  onCancelEdit: () => void;
  onSetConfiguration: (patch: {
    fabric?: string | null;
    buttons?: string | null;
    lining?: string | null;
    threads?: string | null;
    monogramLeft?: string;
    monogramCenter?: string;
    monogramRight?: string;
    pocketType?: string | null;
    lapel?: string | null;
    canvas?: string | null;
  }) => void;
};

const genderLabels: Record<CustomGarmentGender, string> = {
  male: "Male",
  female: "Female",
};

function StageLabel({ children }: { children: string }) {
  return <div className="mb-3 app-text-overline">{children}</div>;
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
      <div className="app-text-strong">{title}</div>
      {subtitle ? <div className="app-text-caption mt-1">{subtitle}</div> : null}
    </div>
  );
}

function TextSkuField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  onChange: (value: string | null) => void;
}) {
  return (
    <label className="block text-sm">
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value.trim() ? event.target.value : null)}
        placeholder={placeholder}
        className="app-input min-h-12 bg-[var(--app-surface)]"
      />
    </label>
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
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="app-text-body font-medium leading-snug">{option}</span>
              {isSelected && showSelectedLabel ? <span className="app-text-overline text-[var(--app-text)]">Selected</span> : null}
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
                ? "border-[var(--app-accent)] bg-[var(--app-surface)] text-[var(--app-text)] shadow-[var(--app-shadow-sm)]"
                : "border-[var(--app-border)] bg-[var(--app-surface)]/85 text-[var(--app-text-muted)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]",
            )}
          >
            <span className="app-text-body font-medium leading-snug">{option}</span>
            {isSelected ? <span className="app-text-overline text-[var(--app-text)]">Selected</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function CustomGarmentBuilder({
  garmentOptionsByGender,
  lapelOptions,
  pocketTypeOptions,
  canvasOptions,
  selectedGender,
  selectedGarment,
  fabric,
  buttons,
  lining,
  threads,
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
  editingLabel,
  wearerName,
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
  const summaryParts = [selectedGarment, wearerName, lapel].filter(Boolean) as string[];
  const showValidationBanner =
    showValidation &&
    (missingGender || missingGarment || missingWearer || missingMeasurements || missingBuildDetails || missingStyleDetails);

  return (
    <>
      <div className="app-work-surface p-4">
        <SectionHeader
          icon={Shirt}
          title={isEditing ? "Edit custom garment" : "Custom garment"}
          subtitle={isEditing ? "Update wearer, measurements, and build details" : "Build the garment in 3 steps"}
        />

        {showValidationBanner ? (
          <div className="mb-4 flex items-start gap-3 rounded-[var(--app-radius-md)] border border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/55 px-4 py-3">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--app-danger-text)]" />
            <div className="min-w-0">
              <StatusPill tone="danger">{isEditing ? "Save changes is blocked" : "Add to cart is blocked"}</StatusPill>
              <div className="mt-2 flex flex-wrap gap-2">
                {missingGender ? <span className="app-text-caption text-[var(--app-danger-text)]">Gender</span> : null}
                {missingGarment ? <span className="app-text-caption text-[var(--app-danger-text)]">Garment</span> : null}
                {missingWearer ? <span className="app-text-caption text-[var(--app-danger-text)]">Wearer</span> : null}
                {missingMeasurements ? <span className="app-text-caption text-[var(--app-danger-text)]">Measurements</span> : null}
                {missingBuildDetails ? <span className="app-text-caption text-[var(--app-danger-text)]">Build details</span> : null}
                {missingStyleDetails ? <span className="app-text-caption text-[var(--app-danger-text)]">Jacket style details</span> : null}
              </div>
            </div>
          </div>
        ) : null}

        {isEditing ? (
          <div className="mb-4 rounded-[var(--app-radius-md)] border border-[var(--app-border-strong)] bg-[var(--app-surface-muted)] px-4 py-3.5">
            <div className="app-text-overline">Editing</div>
            <div className="app-text-value mt-1">{editingLabel ?? "Custom garment"}</div>
            <div className="app-text-caption mt-1">Changes will update the existing line item instead of adding a new one.</div>
          </div>
        ) : null}

        <div className="space-y-6">
          <div>
            <StageLabel>1. Choose garment</StageLabel>

            <div className="space-y-5">
              <div
                className={cx(
                  "pb-5",
                  showValidation && missingGender && "rounded-[var(--app-radius-md)] border border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/18 px-4 py-4",
                )}
              >
              <div className="app-text-overline">Cut</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(["male", "female"] as const).map((gender) => (
                  <button
                    key={gender}
                    onClick={() => onSelectGender(gender)}
                    className={cx(
                      "min-h-12 rounded-[var(--app-radius-md)] border px-4 py-3 text-left transition-all",
                      selectedGender === gender
                        ? "border border-[var(--app-accent)] bg-[var(--app-surface)] text-[var(--app-text)] shadow-[var(--app-shadow-sm)]"
                        : "border border-[var(--app-border)]/55 bg-[var(--app-surface)]/45 text-[var(--app-text-muted)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]",
                    )}
                  >
                    <div className="app-text-value">{genderLabels[gender]}</div>
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

          <div className="border-t border-[var(--app-border)]/70 pt-6">
            <StageLabel>2. Build details</StageLabel>

            {showConfiguration ? (
              <div
                className={cx(
                  "rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 px-4 py-4",
                  showValidation && missingBuildDetails && "border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/18",
                )}
              >
                <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                  <div>
                    <div className="app-text-overline">Information</div>
                    <div className="mt-4 space-y-3.5">
                      <TextSkuField
                        label="Fabric"
                        value={fabric}
                        placeholder="Enter fabric SKU or note"
                        onChange={(value) => onSetConfiguration({ fabric: value })}
                      />
                      <TextSkuField
                        label="Buttons"
                        value={buttons}
                        placeholder="Enter button SKU or note"
                        onChange={(value) => onSetConfiguration({ buttons: value })}
                      />
                      <TextSkuField
                        label="Lining"
                        value={lining}
                        placeholder="Enter lining SKU or note"
                        onChange={(value) => onSetConfiguration({ lining: value })}
                      />
                      <TextSkuField
                        label="Threads"
                        value={threads}
                        placeholder="Enter thread SKU or note"
                        onChange={(value) => onSetConfiguration({ threads: value })}
                      />
                    </div>
                  </div>

                  <div className="border-t border-[var(--app-border)]/45 pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                    <div className="app-text-overline">Monograms</div>
                    <div className="app-text-caption mt-1">Optional placements</div>
                    <div className="mt-4 grid gap-3">
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

          <div className="border-t border-[var(--app-border)]/70 pt-6">
            <StageLabel>3. Style details</StageLabel>

            {showConfiguration && showJacketStyleOptions ? (
              <div
                className={cx(
                  "rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 px-4 py-4",
                  showValidation && missingStyleDetails && "border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/18",
                )}
              >
                <div className="grid gap-6 xl:grid-cols-[0.76fr_1fr]">
                  <div className="space-y-6">
                    <div className="border-b border-[var(--app-border)]/45 pb-5">
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
                          showSelectedLabel
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[var(--app-border)]/45 pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                    <GroupLabel title="Pockets" subtitle="Choose the exterior pocket treatment." />
                    <div className="mt-3">
                      <VerticalOptionList
                        options={pocketTypeOptions}
                        selectedValue={pocketType}
                        onSelect={(value) => onSetConfiguration({ pocketType: value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : showConfiguration ? (
              <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 px-4 py-4">
                <div className="app-text-overline">Style details</div>
                <div className="app-text-body mt-1 font-medium">Not needed for this garment</div>
                <div className="app-text-caption mt-1">Canvas, lapel, and pocket selections only appear for jacket-based garments.</div>
              </div>
            ) : (
              <InlineEmptyState>Select a garment first.</InlineEmptyState>
            )}
          </div>
        </div>
      </div>

      <div className="app-support-rail flex items-center justify-between gap-4 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <div className="app-text-overline">{isEditing ? "Current garment" : "Ready to add"}</div>
          <div className="app-text-caption mt-1">
            {summaryParts.length > 0 ? summaryParts.join(" • ") : "Select the garment details to build the order summary."}
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            disabled={!canAddToOrder}
            disabledReason={addDisabledReason}
            onDisabledPress={onShowDisabledReason}
            className="min-h-12 min-w-[200px] px-5 text-sm"
            onClick={onAddToOrder}
          >
            {isEditing ? "Save changes" : "Add to Cart"}
          </ActionButton>
        </div>
      </div>
    </>
  );
}
