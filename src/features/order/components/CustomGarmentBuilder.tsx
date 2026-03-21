import { CheckSquare, Layers3, Shirt, Type } from "lucide-react";
import { ActionButton, Card, EmptyState, FieldLabel, SectionHeader, cx } from "../../../components/ui/primitives";
import { jacketBasedCustomGarments } from "../../../data";
import type { CustomGarmentGender } from "../../../types";

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
  isEditing: boolean;
  editingLabel?: string | null;
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
}: {
  options: string[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  columnsClassName?: string;
}) {
  return (
    <div className={cx("grid gap-2.5 md:grid-cols-3", columnsClassName)}>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={cx(
            "min-h-12 rounded-[var(--app-radius-md)] border px-4 py-3 text-left transition",
            selectedValue === option && "app-workflow-toggle--active",
            selectedValue !== option &&
              "border-[var(--app-border)]/55 bg-[var(--app-surface)]/34 text-[var(--app-text)] hover:bg-[var(--app-surface)]/48",
          )}
        >
          <span className="app-text-body font-medium leading-snug">{option}</span>
        </button>
      ))}
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
  isEditing,
  editingLabel,
  onSelectGender,
  onSelectGarment,
  onAddToOrder,
  onCancelEdit,
  onSetConfiguration,
}: CustomGarmentBuilderProps) {
  const garmentOptions = selectedGender ? garmentOptionsByGender[selectedGender] : [];
  const showConfiguration = Boolean(selectedGarment);
  const showJacketStyleOptions = selectedGarment ? jacketBasedCustomGarments.has(selectedGarment) : false;

  return (
    <>
      <Card className="p-4">
        <SectionHeader
          icon={Shirt}
          title={isEditing ? "Edit custom garment" : "Custom garment"}
          subtitle={isEditing ? "Update wearer, measurements, and build details" : "Build the garment in 3 steps"}
        />

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

            <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/28 px-4 py-4">
              <div className="app-text-overline">Cut</div>
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)]/20 p-1.5">
                {(["male", "female"] as const).map((gender) => (
                  <button
                    key={gender}
                    onClick={() => onSelectGender(gender)}
                    className={cx(
                      "min-h-12 rounded-[calc(var(--app-radius-md)-2px)] px-4 py-3 text-left transition-all",
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

            <div className="mt-4">
              <FieldLabel>Garment</FieldLabel>
              {selectedGender ? (
                <div className="mt-2">
                  <ChoiceGrid
                    options={garmentOptions}
                    selectedValue={selectedGarment}
                    onSelect={onSelectGarment}
                    columnsClassName="md:grid-cols-2 xl:grid-cols-3"
                  />
                </div>
              ) : (
                <EmptyState className="mt-2">Select gender first.</EmptyState>
              )}
            </div>
          </div>

          <div className="border-t border-[var(--app-border)]/70 pt-6">
            <StageLabel>2. Build details</StageLabel>

            {showConfiguration ? (
              <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/28 px-4 py-4">
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
              <EmptyState>Select a garment first.</EmptyState>
            )}
          </div>

          <div className="border-t border-[var(--app-border)]/70 pt-6">
            <StageLabel>3. Style details</StageLabel>

            {showConfiguration && showJacketStyleOptions ? (
              <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/28 px-4 py-4">
                <div className="grid gap-6 xl:grid-cols-[0.76fr_1fr]">
                  <div className="space-y-6">
                    <div className="rounded-[var(--app-radius-md)] bg-[var(--app-surface)]/38 px-4 py-4">
                      <GroupLabel title="Construction" subtitle="Pick the internal structure first." />
                      <div className="mt-3">
                        <VerticalOptionList
                          options={canvasOptions}
                          selectedValue={canvas}
                          onSelect={(value) => onSetConfiguration({ canvas: value })}
                        />
                      </div>
                    </div>

                    <div className="rounded-[var(--app-radius-md)] bg-[var(--app-surface)]/24 px-4 py-4">
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
                  </div>

                  <div className="rounded-[var(--app-radius-md)] bg-[var(--app-surface)]/24 px-4 py-4">
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
              <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/28 px-4 py-4">
                <div className="app-text-overline">Style details</div>
                <div className="app-text-body mt-1 font-medium">Not needed for this garment</div>
                <div className="app-text-caption mt-1">Canvas, lapel, and pocket selections only appear for jacket-based garments.</div>
              </div>
            ) : (
              <EmptyState>Select a garment first.</EmptyState>
            )}
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
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
          {isEditing ? "Save changes" : "Add to order"}
        </ActionButton>
      </div>
    </>
  );
}
