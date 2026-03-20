import { CheckSquare, Layers3, Shirt, Type } from "lucide-react";
import { Card, EmptyState, FieldLabel, SectionHeader, cx } from "../../../components/ui/primitives";
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
  onSelectGender: (gender: CustomGarmentGender) => void;
  onSelectGarment: (garment: string | null) => void;
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
        className="app-input bg-[var(--app-surface-muted)]"
      />
    </label>
  );
}

function OptionGrid({
  options,
  selectedValue,
  onSelect,
  columnsClassName,
  buttonClassName,
}: {
  options: string[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  columnsClassName?: string;
  buttonClassName?: string;
}) {
  return (
    <div className={cx("grid gap-2 md:grid-cols-3", columnsClassName)}>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={cx(
            "app-workflow-toggle min-h-11 justify-center px-3 py-2.5 text-center text-sm leading-snug",
            selectedValue === option && "app-workflow-toggle--active",
            buttonClassName,
          )}
        >
          {option}
        </button>
      ))}
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
  onSelectGender,
  onSelectGarment,
  onSetConfiguration,
}: CustomGarmentBuilderProps) {
  const garmentOptions = selectedGender ? garmentOptionsByGender[selectedGender] : [];
  const showConfiguration = Boolean(selectedGarment);
  const showJacketStyleOptions = selectedGarment ? jacketBasedCustomGarments.has(selectedGarment) : false;

  return (
    <>
      <Card className="p-4">
        <SectionHeader icon={Shirt} title="Custom garment" subtitle="Choose gender, then garment" />

        <div className="space-y-4">
          <div>
            <FieldLabel>Gender</FieldLabel>
            <div className="grid grid-cols-2 gap-1 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-1">
              {(["male", "female"] as const).map((gender) => (
                <button
                  key={gender}
                  onClick={() => onSelectGender(gender)}
                  className={cx(
                    "rounded-[calc(var(--app-radius-md)-2px)] px-4 py-3 text-left transition-all",
                    selectedGender === gender
                      ? "border border-[var(--app-accent)] bg-[var(--app-surface)] text-[var(--app-text)] shadow-[var(--app-shadow-sm)]"
                      : "border border-transparent bg-transparent text-[var(--app-text-muted)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]",
                  )}
                >
                  <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--app-text-soft)]">Cut</span>
                  <div className="mt-1 text-base font-semibold tracking-[-0.01em]">{genderLabels[gender]}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Garment</FieldLabel>
            {selectedGender ? (
              <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-4">
                {garmentOptions.map((item) => (
                  <button
                    key={item}
                    onClick={() => onSelectGarment(item)}
                    className={cx(
                      "app-workflow-toggle min-h-10 px-3 py-2.5 text-left",
                      selectedGarment === item && "app-workflow-toggle--active",
                    )}
                  >
                    <span className="text-[13px] font-medium leading-snug">{item}</span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState>Select gender first.</EmptyState>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.8fr_0.55fr]">
        <Card className="p-4">
          <SectionHeader icon={Type} title="Information" />

          {showConfiguration ? (
            <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
              <div className="space-y-3">
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
          ) : (
            <EmptyState>Select a garment first.</EmptyState>
          )}
        </Card>

        <Card className="p-4">
          <SectionHeader icon={CheckSquare} title="Monograms" />

          {showConfiguration ? (
            <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
              <div className="grid gap-3">
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
                      className="app-input bg-[var(--app-surface)]"
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState>Select a garment first.</EmptyState>
          )}
        </Card>

        <Card className="p-4">
          <SectionHeader icon={Layers3} title="Canvas" />

          {showConfiguration && showJacketStyleOptions ? (
            <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
              <OptionGrid
                options={canvasOptions}
                selectedValue={canvas}
                onSelect={(value) => onSetConfiguration({ canvas: value })}
                columnsClassName="grid-cols-1 md:grid-cols-1"
                buttonClassName="bg-[var(--app-surface)] justify-start text-left"
              />
            </div>
          ) : showConfiguration ? (
            <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-4 text-sm text-[var(--app-text-muted)]">
              Canvas not needed for this garment.
            </div>
          ) : (
            <EmptyState>Select a garment first.</EmptyState>
          )}
        </Card>
      </div>

      <div className="grid gap-4">
        <Card className="p-4">
          <SectionHeader icon={CheckSquare} title="Style options" />

          {showConfiguration && showJacketStyleOptions ? (
            <div className="space-y-5">
              <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                <FieldLabel>Lapel</FieldLabel>
                <OptionGrid
                  options={lapelOptions}
                  selectedValue={lapel}
                  onSelect={(value) => onSetConfiguration({ lapel: value })}
                  buttonClassName="bg-[var(--app-surface)]"
                />
              </div>

              <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                <FieldLabel>Pockets</FieldLabel>
                <OptionGrid
                  options={pocketTypeOptions}
                  selectedValue={pocketType}
                  onSelect={(value) => onSetConfiguration({ pocketType: value })}
                  buttonClassName="bg-[var(--app-surface)]"
                />
              </div>
            </div>
          ) : showConfiguration ? (
            <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-4 text-sm text-[var(--app-text-muted)]">
              Lapel and pocket selections are only needed for jacket-based garments.
            </div>
          ) : (
            <EmptyState>Select a garment first.</EmptyState>
          )}
        </Card>
      </div>
    </>
  );
}
