import { Minus, Plus, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { ActionButton } from "../../../components/ui/primitives";

type FractionOption = {
  label: string;
  value: number;
};

type MeasurementValueEditorProps = {
  focusKey: string;
  value: string;
  fraction: number;
  fractions: FractionOption[];
  onChangeValue: (value: string) => void;
  onStepInches: (delta: number) => void;
  onSetFraction: (value: number) => void;
  onClear: () => void;
};

export function MeasurementValueEditor({
  focusKey,
  value,
  fraction,
  fractions,
  onChangeValue,
  onStepInches,
  onSetFraction,
  onClear,
}: MeasurementValueEditorProps) {
  const activeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    activeInputRef.current?.focus();
    activeInputRef.current?.select();
  }, [focusKey]);

  return (
    <div className="app-measurements-value-editor">
      <div className="app-measurements-value-editor__head">
        <div className="app-text-overline">Measurement entry</div>
        <button
          onClick={onClear}
          className="inline-flex h-8 items-center gap-1 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] px-2.5 text-xs font-medium text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      <div className="app-measurements-value-editor__body">
        <input
          ref={activeInputRef}
          value={value}
          onChange={(event) => onChangeValue(event.target.value)}
          inputMode="decimal"
          enterKeyHint="done"
          pattern="[0-9]*[.]?[0-9]*"
          placeholder="Enter inches"
          className="app-input app-measurements-value-editor__input"
        />

        <div className="app-measurements-value-editor__stepper">
          <ActionButton tone="secondary" className="min-h-[3.2rem] px-0 text-lg font-semibold" onClick={() => onStepInches(1)}>
            <Plus className="h-5 w-5" />
          </ActionButton>
          <ActionButton tone="secondary" className="min-h-[3.2rem] px-0 text-lg font-semibold" onClick={() => onStepInches(-1)}>
            <Minus className="h-5 w-5" />
          </ActionButton>
        </div>
      </div>

      <div className="app-measurements-value-editor__fractions">
        {fractions.map((fractionOption) => (
          <button
            key={fractionOption.label}
            onClick={() => onSetFraction(fractionOption.value)}
            className={`flex min-h-[3rem] items-center justify-center border px-0 py-1.5 text-[1.5rem] font-semibold leading-none ${
              fraction === fractionOption.value ? "app-workflow-toggle app-workflow-toggle--active" : "app-workflow-toggle"
            }`}
          >
            {fractionOption.label}
          </button>
        ))}
      </div>
    </div>
  );
}
