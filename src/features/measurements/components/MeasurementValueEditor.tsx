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
    <div className="grid gap-3">
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.12em] text-[var(--app-text-soft)]">Measurement value</div>
          <button
            onClick={onClear}
            className="inline-flex h-8 items-center gap-1 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] px-2 text-xs font-medium text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
        <div className="grid grid-cols-[76px_minmax(0,1fr)_76px] items-stretch gap-3">
          <ActionButton tone="secondary" className="min-h-16 px-0 text-lg font-semibold" onClick={() => onStepInches(-1)}>
            <Minus className="h-4 w-4" />
            1
          </ActionButton>
          <div className="flex min-w-0">
            <input
              ref={activeInputRef}
              value={value}
              onChange={(event) => onChangeValue(event.target.value)}
              inputMode="decimal"
              enterKeyHint="done"
              pattern="[0-9]*[.]?[0-9]*"
              placeholder="Enter inches"
              className="app-input min-h-16 h-full text-center text-[2rem] font-semibold"
            />
          </div>
          <ActionButton tone="secondary" className="min-h-16 px-0 text-lg font-semibold" onClick={() => onStepInches(1)}>
            <Plus className="h-4 w-4" />
            1
          </ActionButton>
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs uppercase tracking-[0.12em] text-[var(--app-text-soft)]">Quarter step</div>
        <div className="grid grid-cols-4 gap-2">
          {fractions.map((fractionOption) => (
            <button
              key={fractionOption.label}
              onClick={() => onSetFraction(fractionOption.value)}
              className={`border px-3 py-3 text-sm font-medium ${
                fraction === fractionOption.value ? "app-workflow-toggle app-workflow-toggle--active" : "app-workflow-toggle"
              }`}
            >
              {fractionOption.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
